from fastapi import APIRouter, Depends, status, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
import io
import httpx
import logging
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from ..core.config import settings
from .common import PositiveId
from ..services.invoice_delivery import InvoiceDeliveryError, send_invoice_email, download_invoice_pdf

logger = logging.getLogger(__name__)

async def send_invoice_webhook(invoice_data: dict):
    url = settings.INVOICE_WEBHOOK_URL
    if not url:
        logger.warning("Invoice webhook URL not configured. Skipping.")
        return

    headers = {"Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=invoice_data, headers=headers, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Invoice webhook sent to {url} successfully: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send invoice webhook to {url}: {e}")

# Roles permitted to access Revenue Cycle — must stay in sync with
# BILLING_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Reception"]

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.InvoiceRead])
def list_invoices(db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.list_entities(db, models.Invoice, owner_id)


@router.post("", response_model=schemas.InvoiceRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exclude_roles(["Patient"]))])
def create_invoice(
    payload: schemas.InvoiceCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    # 1. First validate stock for all pharmacy items in the invoice payload
    if payload.line_items:
        for item in payload.line_items:
            if item.category == "Medicines/Pharmacy":
                # Find medicine by medicine_code or name
                medicine = None
                if item.medicine_code:
                    medicine = db.query(models.Medicine).filter(models.Medicine.medicine_code == item.medicine_code).first()
                if not medicine:
                    medicine = db.query(models.Medicine).filter(models.Medicine.name == item.name).first()
                
                if not medicine:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Medicine '{item.name}' not found in pharmacy inventory."
                    )
                
                # Check stock sufficiency
                if medicine.stock < item.quantity:
                    raise HTTPException(
                        status_code=status.HTTP_400_BAD_REQUEST,
                        detail=f"Insufficient stock for '{item.name}'. Available: {medicine.stock}, Requested: {item.quantity}"
                    )

    # 2. Now perform the stock updates and write transaction logs
    if payload.line_items:
        for item in payload.line_items:
            if item.category == "Medicines/Pharmacy":
                medicine = None
                if item.medicine_code:
                    medicine = db.query(models.Medicine).filter(models.Medicine.medicine_code == item.medicine_code).first()
                if not medicine:
                    medicine = db.query(models.Medicine).filter(models.Medicine.name == item.name).first()
                
                if medicine:
                    # Reduce stock
                    medicine.stock -= item.quantity
                    db.add(medicine)
                    
                    # Store transaction log
                    tx_log = models.MedicineTransaction(
                        owner_user_id=current_user_id,
                        medicine_id=medicine.id,
                        medicine_name=medicine.name,
                        transaction_type="Sale",
                        quantity=item.quantity,
                        invoice_code=payload.invoice_code
                    )
                    db.add(tx_log)

    entity = crud.create_entity(db, models.Invoice, payload, current_user_id)
    if entity.amount_paid > 0:
        receipt = models.CashReceipt(
            owner_user_id=current_user_id,
            invoice_code=entity.invoice_code,
            patient_name=entity.patient_name,
            amount_paid=entity.amount_paid,
            payment_date=entity.created_at
        )
        db.add(receipt)
        db.commit()
        # Broadcast CashReceipt creation
        from ..core.websockets import manager
        import json
        manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "create", "entity": "CashReceipt"}))
    
    invoice_data = schemas.InvoiceRead.model_validate(entity).model_dump(mode='json')
    background_tasks.add_task(send_invoice_webhook, invoice_data)
    
    return entity


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
def get_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)


@router.put("/{invoice_id}", response_model=schemas.InvoiceRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_invoice(
    invoice_id: PositiveId,
    payload: schemas.InvoiceUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering)
):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)
    old_paid = invoice.amount_paid
    old_status = invoice.status
    updated_invoice = crud.update_entity(db, invoice, payload)
    new_paid = updated_invoice.amount_paid
    if new_paid > old_paid:
        diff = new_paid - old_paid
        receipt = models.CashReceipt(
            owner_user_id=invoice.owner_user_id,
            invoice_code=updated_invoice.invoice_code,
            patient_name=updated_invoice.patient_name,
            amount_paid=diff,
        )
        db.add(receipt)
        db.commit()
        # Broadcast CashReceipt creation
        from ..core.websockets import manager
        import json
        manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "create", "entity": "CashReceipt"}))
        
    if (payload.status is not None and payload.status != old_status) or (new_paid != old_paid):
        invoice_data = schemas.InvoiceRead.model_validate(updated_invoice).model_dump(mode='json')
        background_tasks.add_task(send_invoice_webhook, invoice_data)
        
    return updated_invoice


@router.post(
    "/{invoice_id}/send-paid-email",
    response_model=schemas.InvoicePaidEmailResponse,
    dependencies=[Depends(exclude_roles(["Patient"]))],
)
def send_paid_invoice_email(
    invoice_id: PositiveId,
    payload: schemas.InvoicePaidEmailRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)
    old_paid = invoice.amount_paid
    old_status = invoice.status
    invoice_update_data = payload.model_dump(
        exclude={"recipient_email", "line_items"},
        exclude_none=True,
    )
    updated_invoice = crud.update_entity(
        db,
        invoice,
        schemas.InvoiceUpdate(**invoice_update_data),
    )
    new_paid = updated_invoice.amount_paid
    if new_paid > old_paid:
        diff = new_paid - old_paid
        receipt = models.CashReceipt(
            owner_user_id=invoice.owner_user_id,
            invoice_code=updated_invoice.invoice_code,
            patient_name=updated_invoice.patient_name,
            amount_paid=diff,
        )
        db.add(receipt)
        db.commit()
        # Broadcast CashReceipt creation
        from ..core.websockets import manager
        import json
        manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "create", "entity": "CashReceipt"}))

    if (new_paid != old_paid) or (updated_invoice.status != old_status):
        invoice_data = schemas.InvoiceRead.model_validate(updated_invoice).model_dump(mode='json')
        background_tasks.add_task(send_invoice_webhook, invoice_data)

    if updated_invoice.status not in ("Paid", "Partially Paid"):
        return schemas.InvoicePaidEmailResponse(
            invoice=updated_invoice,
            email_sent=False,
            message="Invoice was updated, but no email was sent because the status is not Paid or Partially Paid.",
        )

    try:
        message = send_invoice_email(updated_invoice, str(payload.recipient_email))
        return schemas.InvoicePaidEmailResponse(
            invoice=updated_invoice,
            email_sent=True,
            message=message,
        )
    except InvoiceDeliveryError as exc:
        return schemas.InvoicePaidEmailResponse(
            invoice=updated_invoice,
            email_sent=False,
            message=f"Invoice marked as paid, but email delivery failed: {exc}",
        )


@router.delete("/{invoice_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)
    return crud.delete_entity(db, invoice)


@router.get(
    "/{invoice_id}/download-pdf",
    dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse"]))],
)
def download_invoice_pdf_endpoint(
    invoice_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    """Generate and stream an invoice PDF for download (Admin + Reception only)."""
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)

    try:
        pdf_bytes = download_invoice_pdf(invoice)
    except InvoiceDeliveryError as exc:
        from fastapi import HTTPException
        raise HTTPException(status_code=500, detail=str(exc))

    filename = f"{invoice.invoice_code}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# ── Public Router ─────────────────────────────────────────────────────────────
public_router = APIRouter(
    prefix="/invoices",
    tags=["invoices – public"],
)

@public_router.get("/public", response_model=list[schemas.InvoiceRead])
def list_public_invoices(db: Session = Depends(get_db)):
    return crud.list_entities(db, models.Invoice)

@public_router.get("/public/{invoice_id}", response_model=schemas.InvoiceRead)
def get_public_invoice(invoice_id: PositiveId, db: Session = Depends(get_db)):
    return crud.get_entity_or_404(db, models.Invoice, invoice_id)

@public_router.get("/public/{invoice_id}/download-pdf")
def download_public_invoice_pdf(invoice_id: PositiveId, db: Session = Depends(get_db)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id)
    try:
        pdf_bytes = download_invoice_pdf(invoice)
    except InvoiceDeliveryError as exc:
        raise HTTPException(status_code=500, detail=str(exc))

    filename = f"{invoice.invoice_code}.pdf"
    return StreamingResponse(
        io.BytesIO(pdf_bytes),
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

