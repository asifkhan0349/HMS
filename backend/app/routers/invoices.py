from fastapi import APIRouter, Depends, status
from fastapi.responses import StreamingResponse
import io
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId
from ..services.invoice_delivery import InvoiceDeliveryError, send_invoice_email, download_invoice_pdf

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
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Invoice, payload, current_user_id)


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
def get_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)


@router.put("/{invoice_id}", response_model=schemas.InvoiceRead, dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
def update_invoice(invoice_id: PositiveId, payload: schemas.InvoiceUpdate, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)
    return crud.update_entity(db, invoice, payload)


@router.post(
    "/{invoice_id}/send-paid-email",
    response_model=schemas.InvoicePaidEmailResponse,
    dependencies=[Depends(exclude_roles(["Patient"]))],
)
def send_paid_invoice_email(
    invoice_id: PositiveId,
    payload: schemas.InvoicePaidEmailRequest,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, owner_id)
    invoice_update_data = payload.model_dump(
        exclude={"recipient_email", "line_items"},
        exclude_none=True,
    )
    updated_invoice = crud.update_entity(
        db,
        invoice,
        schemas.InvoiceUpdate(**invoice_update_data),
    )

    if updated_invoice.status != "Paid":
        return schemas.InvoicePaidEmailResponse(
            invoice=updated_invoice,
            email_sent=False,
            message="Invoice was updated, but no email was sent because the status is not Paid.",
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


@router.delete("/{invoice_id}", response_model=schemas.MessageResponse, dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
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
