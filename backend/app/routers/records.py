from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Medical Records — must stay in sync with
# EMR_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor", "Nurse"]

router = APIRouter(
    prefix="/records",
    tags=["records"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.MedicalRecordRead])
def list_records(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.list_entities(db, models.MedicalRecord, owner_id)


@router.post("", response_model=schemas.MedicalRecordRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exclude_roles(["Patient", "Reception"]))])
def create_record(payload: schemas.MedicalRecordCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.MedicalRecord, payload, current_user_id)


@router.get("/{record_id}", response_model=schemas.MedicalRecordRead)
def get_record(record_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.get_entity_or_404(db, models.MedicalRecord, record_id, owner_id)


@router.put("/{record_id}", response_model=schemas.MedicalRecordRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_record(record_id: PositiveId, payload: schemas.MedicalRecordUpdate, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    record = crud.get_entity_or_404(db, models.MedicalRecord, record_id, owner_id)
    return crud.update_entity(db, record, payload)


@router.delete("/{record_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_record(record_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    record = crud.get_entity_or_404(db, models.MedicalRecord, record_id, owner_id)
    return crud.delete_entity(db, record)


# ── Public Router ─────────────────────────────────────────────────────────────
public_router = APIRouter(
    prefix="/records",
    tags=["records – public"],
)

@public_router.get("/public", response_model=list[schemas.MedicalRecordRead])
def list_public_records(db: Session = Depends(get_db)):
    return crud.list_entities(db, models.MedicalRecord)

@public_router.get("/public/{record_id}", response_model=schemas.MedicalRecordRead)
def get_public_record(record_id: PositiveId, db: Session = Depends(get_db)):
    return crud.get_entity_or_404(db, models.MedicalRecord, record_id)

