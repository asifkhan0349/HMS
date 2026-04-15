from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import crud, models, schemas
from ..database import get_db
from .common import PositiveId

router = APIRouter(prefix="/medicines", tags=["medicines"])


@router.get("", response_model=list[schemas.MedicineRead])
def list_medicines(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.Medicine, current_user_id)


@router.post("", response_model=schemas.MedicineRead, status_code=status.HTTP_201_CREATED)
def create_medicine(payload: schemas.MedicineCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Medicine, payload, current_user_id)


@router.get("/{medicine_id}", response_model=schemas.MedicineRead)
def get_medicine(medicine_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.Medicine, medicine_id, current_user_id)


@router.put("/{medicine_id}", response_model=schemas.MedicineRead)
def update_medicine(medicine_id: PositiveId, payload: schemas.MedicineUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    medicine = crud.get_entity_or_404(db, models.Medicine, medicine_id, current_user_id)
    return crud.update_entity(db, medicine, payload)


@router.delete("/{medicine_id}", response_model=schemas.MessageResponse)
def delete_medicine(medicine_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    medicine = crud.get_entity_or_404(db, models.Medicine, medicine_id, current_user_id)
    return crud.delete_entity(db, medicine)
