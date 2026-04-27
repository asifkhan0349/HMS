from fastapi import APIRouter, Depends, status, Request
from app.core.limiter import limiter
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth_context import get_current_user_id, require_role
from app.routers.common import PositiveId

from . import crud, schemas

router = APIRouter(
    prefix="/patients", 
    tags=["patients"],
    dependencies=[Depends(require_role("patients"))]
)

@router.get("", response_model=list[schemas.PatientRead])
def list_patients(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_patients(db, current_user_id)

@router.post("", response_model=schemas.PatientRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_patient(request: Request, payload: schemas.PatientCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id), _=Depends(require_role(["Admin", "Doctor", "Nurse"]))):
    return crud.create_patient(db, payload, current_user_id)

@router.get("/{patient_id}", response_model=schemas.PatientRead)
def get_patient(patient_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_patient_or_404(db, patient_id, current_user_id)

@router.put("/{patient_id}", response_model=schemas.PatientRead)
@limiter.limit("10/minute")
def update_patient(request: Request, patient_id: PositiveId, payload: schemas.PatientUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id), _=Depends(require_role(["Admin", "Doctor", "Nurse"]))):
    patient = crud.get_patient_or_404(db, patient_id, current_user_id)
    return crud.update_patient(db, patient, payload)

@router.delete("/{patient_id}", response_model=schemas.MessageResponse)
@limiter.limit("5/minute")
def delete_patient(request: Request, patient_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id), _=Depends(require_role(["Admin"]))):
    patient = crud.get_patient_or_404(db, patient_id, current_user_id)
    return crud.delete_patient(db, patient)
