from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import crud, models, schemas
from ..database import get_db
from .common import PositiveId

router = APIRouter(prefix="/patients", tags=["patients"])


@router.get("", response_model=list[schemas.PatientRead])
def list_patients(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.Patient, current_user_id)


@router.post("", response_model=schemas.PatientRead, status_code=status.HTTP_201_CREATED)
def create_patient(payload: schemas.PatientCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Patient, payload, current_user_id)


@router.get("/{patient_id}", response_model=schemas.PatientRead)
def get_patient(patient_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.Patient, patient_id, current_user_id)


@router.put("/{patient_id}", response_model=schemas.PatientRead)
def update_patient(patient_id: PositiveId, payload: schemas.PatientUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    patient = crud.get_entity_or_404(db, models.Patient, patient_id, current_user_id)
    return crud.update_entity(db, patient, payload)


@router.delete("/{patient_id}", response_model=schemas.MessageResponse)
def delete_patient(patient_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    patient = crud.get_entity_or_404(db, models.Patient, patient_id, current_user_id)
    return crud.delete_entity(db, patient)
