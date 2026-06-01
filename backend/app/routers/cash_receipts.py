from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import require_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db

# Roles permitted to access Cash Receipts (sync with frontend sidebars/roles)
_ALLOWED_ROLES = ["Admin", "Reception", "Accountant"]

router = APIRouter(
    prefix="/cash-receipts",
    tags=["cash-receipts"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)

@router.get("", response_model=list[schemas.CashReceiptRead])
def list_cash_receipts(db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.list_entities(db, models.CashReceipt, owner_id)


from .common import PositiveId

# ── Public Router ─────────────────────────────────────────────────────────────
public_router = APIRouter(
    prefix="/cash-receipts",
    tags=["cash-receipts – public"],
)

@public_router.get("/public", response_model=list[schemas.CashReceiptRead])
def list_public_cash_receipts(db: Session = Depends(get_db)):
    return crud.list_entities(db, models.CashReceipt)

@public_router.get("/public/{receipt_id}", response_model=schemas.CashReceiptRead)
def get_public_cash_receipt(receipt_id: PositiveId, db: Session = Depends(get_db)):
    return crud.get_entity_or_404(db, models.CashReceipt, receipt_id)

