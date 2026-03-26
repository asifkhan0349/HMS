from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id
from ..database import get_db

router = APIRouter(prefix="/inventory", tags=["Inventory"])


@router.get("", response_model=list[schemas.InventoryItemRead])
def list_inventory(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.list_entities(db, models.InventoryItem, user_id)


@router.post("", response_model=schemas.InventoryItemRead)
def create_inventory_item(
    payload: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.create_entity(db, models.InventoryItem, payload, user_id)


@router.put("/{item_id}", response_model=schemas.InventoryItemRead)
def update_inventory_item(
    item_id: int,
    payload: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    item = crud.get_entity_or_404(db, models.InventoryItem, item_id, user_id)
    return crud.update_entity(db, item, payload)


@router.delete("/{item_id}")
def delete_inventory_item(
    item_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    item = crud.get_entity_or_404(db, models.InventoryItem, item_id, user_id)
    return crud.delete_entity(db, item)
