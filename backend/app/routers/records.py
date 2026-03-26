from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/records", tags=["records"])


@router.get("", response_model=list[schemas.MedicalRecordRead])
def list_records(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.MedicalRecord, current_user_id)


@router.post("", response_model=schemas.MedicalRecordRead, status_code=status.HTTP_201_CREATED)
def create_record(payload: schemas.MedicalRecordCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.MedicalRecord, payload, current_user_id)


@router.get("/{record_id}", response_model=schemas.MedicalRecordRead)
def get_record(record_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.MedicalRecord, record_id, current_user_id)


@router.put("/{record_id}", response_model=schemas.MedicalRecordRead)
def update_record(record_id: int, payload: schemas.MedicalRecordUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    record = crud.get_entity_or_404(db, models.MedicalRecord, record_id, current_user_id)
    return crud.update_entity(db, record, payload)


@router.delete("/{record_id}")
def delete_record(record_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    record = crud.get_entity_or_404(db, models.MedicalRecord, record_id, current_user_id)
    return crud.delete_entity(db, record)
