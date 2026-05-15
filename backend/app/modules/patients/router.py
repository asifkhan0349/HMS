from fastapi import APIRouter, Depends, status, Request
from app.core.limiter import limiter
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.auth_context import get_current_user, require_roles, exclude_roles, get_patient_name_filter, get_owner_id_for_filtering
from app.modules.auth.models import User
from app.routers.common import PositiveId

from . import crud, schemas

# Roles permitted to access the Patient Directory — must stay in sync with
# PATIENT_DIR_ROLES in src/App.jsx and the allowedRoles list in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor", "Patient", "Reception"]

router = APIRouter(
    prefix="/patients",
    tags=["patients"],
    # Router-level guard: every endpoint in this router requires an authenticated
    # user whose role is in _ALLOWED_ROLES.  Requests from any other role (e.g.
    # Pharmacist, Lab Technician, Receptionist) receive HTTP 403 Forbidden even
    # if they supply a valid JWT.
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))],
)

@router.get("", response_model=list[schemas.PatientRead])
def list_patients(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
    patient_name_filter: str | None = Depends(get_patient_name_filter),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.list_patients(db, owner_id, patient_name_filter=patient_name_filter)

@router.post("", response_model=schemas.PatientRead, status_code=status.HTTP_201_CREATED)
@limiter.limit("5/minute")
def create_patient(
    request: Request,
    payload: schemas.PatientCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "Patient":
        payload.name = current_user.full_name
    return crud.create_patient(db, payload, current_user.id)

@router.get("/{patient_id}", response_model=schemas.PatientRead)
def get_patient(
    patient_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.get_patient_or_404(db, patient_id, owner_id)

@router.put("/{patient_id}", response_model=schemas.PatientRead, dependencies=[Depends(require_roles(["Admin"]))])
@limiter.limit("10/minute")
def update_patient(
    request: Request,
    patient_id: PositiveId,
    payload: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    patient = crud.get_patient_or_404(db, patient_id, owner_id)
    return crud.update_patient(db, patient, payload)

@router.delete("/{patient_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
@limiter.limit("5/minute")
def delete_patient(
    request: Request,
    patient_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    patient = crud.get_patient_or_404(db, patient_id, owner_id)
    return crud.delete_patient(db, patient)

