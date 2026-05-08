from fastapi import APIRouter, Depends, status, Request
from ..core.limiter import limiter
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Hospital Logistics — must stay in sync with
# INVENTORY_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Nurse", "Reception"]

router = APIRouter(
    prefix="/inventory",
    tags=["Inventory"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.InventoryItemRead])
def list_inventory(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.list_entities(db, models.InventoryItem, owner_id)


@router.post("", response_model=schemas.InventoryItemRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")
def create_inventory_item(
    request: Request,
    payload: schemas.InventoryItemCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.create_entity(db, models.InventoryItem, payload, user_id)


@router.put("/{item_id}", response_model=schemas.InventoryItemRead, dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
@limiter.limit("20/minute")
def update_inventory_item(
    request: Request,
    item_id: PositiveId,
    payload: schemas.InventoryItemUpdate,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    item = crud.get_entity_or_404(db, models.InventoryItem, item_id, owner_id)
    return crud.update_entity(db, item, payload)


@router.delete("/{item_id}", response_model=schemas.MessageResponse, dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
@limiter.limit("5/minute")
def delete_inventory_item(
    request: Request,
    item_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    item = crud.get_entity_or_404(db, models.InventoryItem, item_id, owner_id)
    return crud.delete_entity(db, item)
