from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_blood_bank_owner_id_filter
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Emergency Blood Bank — must stay in sync with
# BLOOD_BANK_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor", "Nurse"]

router = APIRouter(
    prefix="/blood_inventory",
    tags=["Blood Bank"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.BloodInventoryRead])
def list_blood_inventory(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_blood_bank_owner_id_filter),
):
    return crud.list_entities(db, models.BloodInventory, owner_id)


@router.post("", response_model=schemas.BloodInventoryRead, status_code=status.HTTP_201_CREATED)
def create_blood_inventory(
    payload: schemas.BloodInventoryCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.create_entity(db, models.BloodInventory, payload, user_id)


@router.put("/{item_id}", response_model=schemas.BloodInventoryRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_blood_inventory(
    item_id: PositiveId,
    payload: schemas.BloodInventoryUpdate,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_blood_bank_owner_id_filter),
):
    item = crud.get_entity_or_404(db, models.BloodInventory, item_id, owner_id)
    return crud.update_entity(db, item, payload)


@router.delete("/{item_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_blood_inventory(
    item_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_blood_bank_owner_id_filter),
):
    item = crud.get_entity_or_404(db, models.BloodInventory, item_id, owner_id)
    return crud.delete_entity(db, item)
