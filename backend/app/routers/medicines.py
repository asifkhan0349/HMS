from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_pharmacy_owner_id_filter
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Pharmacy — must stay in sync with
# PHARMACY_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Nurse", "Reception", "Pharmacist"]

router = APIRouter(
    prefix="/medicines",
    tags=["medicines"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.MedicineRead])
def list_medicines(db: Session = Depends(get_db), owner_id: int | None = Depends(get_pharmacy_owner_id_filter)):
    return crud.list_entities(db, models.Medicine, owner_id)


@router.post("", response_model=schemas.MedicineRead, status_code=status.HTTP_201_CREATED)
def create_medicine(payload: schemas.MedicineCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Medicine, payload, current_user_id)


@router.get("/{medicine_id}", response_model=schemas.MedicineRead)
def get_medicine(medicine_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_pharmacy_owner_id_filter)):
    return crud.get_entity_or_404(db, models.Medicine, medicine_id, owner_id)


@router.put("/{medicine_id}", response_model=schemas.MedicineRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_medicine(medicine_id: PositiveId, payload: schemas.MedicineUpdate, db: Session = Depends(get_db), owner_id: int | None = Depends(get_pharmacy_owner_id_filter)):
    medicine = crud.get_entity_or_404(db, models.Medicine, medicine_id, owner_id)
    return crud.update_entity(db, medicine, payload)


@router.delete("/{medicine_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_medicine(medicine_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_pharmacy_owner_id_filter)):
    medicine = crud.get_entity_or_404(db, models.Medicine, medicine_id, owner_id)
    return crud.delete_entity(db, medicine)
