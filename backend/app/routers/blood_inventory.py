from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id, require_role
from ..core.database import get_db
from .common import PositiveId

router = APIRouter(
    prefix="/blood_inventory",
    tags=["Blood Bank"],
    dependencies=[Depends(require_role("blood_bank"))]
)


@router.get("", response_model=list[schemas.BloodInventoryRead])
def list_blood_inventory(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.list_entities(db, models.BloodInventory, user_id)


@router.post("", response_model=schemas.BloodInventoryRead, status_code=status.HTTP_201_CREATED)
def create_blood_inventory(
    payload: schemas.BloodInventoryCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.create_entity(db, models.BloodInventory, payload, user_id)


@router.put("/{bg_id}", response_model=schemas.BloodInventoryRead)
def update_blood_inventory(
    bg_id: PositiveId,
    payload: schemas.BloodInventoryUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    item = crud.get_entity_or_404(db, models.BloodInventory, bg_id, user_id)
    return crud.update_entity(db, item, payload)


@router.delete("/{bg_id}", response_model=schemas.MessageResponse)
def delete_blood_inventory(
    bg_id: PositiveId,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    item = crud.get_entity_or_404(db, models.BloodInventory, bg_id, user_id)
    return crud.delete_entity(db, item)
