from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_role
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId

router = APIRouter(
    prefix="/invoices",
    tags=["invoices"],
    dependencies=[Depends(require_role(["Admin", "Reception", "Patient"]))]
)


@router.get("", response_model=list[schemas.InvoiceRead])
def list_invoices(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.Invoice, current_user_id)


@router.post("", response_model=schemas.InvoiceRead, status_code=status.HTTP_201_CREATED)
def create_invoice(payload: schemas.InvoiceCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Invoice, payload, current_user_id)


@router.get("/{invoice_id}", response_model=schemas.InvoiceRead)
def get_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.Invoice, invoice_id, current_user_id)


@router.put("/{invoice_id}", response_model=schemas.InvoiceRead)
def update_invoice(invoice_id: PositiveId, payload: schemas.InvoiceUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, current_user_id)
    return crud.update_entity(db, invoice, payload)


@router.delete("/{invoice_id}", response_model=schemas.MessageResponse)
def delete_invoice(invoice_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    invoice = crud.get_entity_or_404(db, models.Invoice, invoice_id, current_user_id)
    return crud.delete_entity(db, invoice)
