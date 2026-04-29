from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId
from ..services.invoice_delivery import InvoiceDeliveryError, send_invoice_email

# Roles permitted to access Revenue Cycle — must stay in sync with
# BILLING_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Reception", "Patient"]

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.InvoiceRead])
def list_invoices(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.Invoice, current_user_id)


@router.post("", response_model=schemas.InvoiceRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exclude_roles(["Patient"]))])
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Invoice, payload, current_user_id)


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
def get_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.Invoice, invoice_id)


@router.put("/{invoice_id}", response_model=schemas.InvoiceRead, dependencies=[Depends(exclude_roles(["Patient"]))])
def update_invoice(invoice_id: PositiveId, payload: schemas.InvoiceUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id)
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
    current_user_id: int = Depends(get_current_user_id),
):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id)
    invoice_update_data = payload.model_dump(
        exclude={"recipient_email"},
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


@router.delete("/{invoice_id}", response_model=schemas.MessageResponse, dependencies=[Depends(exclude_roles(["Patient"]))])
def delete_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id)
    return crud.delete_entity(db, invoice)
