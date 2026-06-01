from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import (
    exclude_roles,
    get_current_user_id,
    get_facility_owner_id_filter,
    require_roles,
)
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Facility Management — must stay in sync with
# BEDS_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Nurse", "Reception"]

router = APIRouter(
    prefix="/beds",
    tags=["beds"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.BedRead])
def list_beds(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    return crud.list_entities(db, models.Bed, owner_id)


@router.post("", response_model=schemas.BedRead, status_code=status.HTTP_201_CREATED)
def create_bed(
    payload: schemas.BedCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    from fastapi import HTTPException
    if payload.status == "Occupied" and payload.patient_name:
        existing_bed = db.query(models.Bed).filter(
            models.Bed.patient_name == payload.patient_name,
            models.Bed.status == "Occupied"
        ).first()
        if existing_bed:
            raise HTTPException(
                status_code=400,
                detail=f"Patient '{payload.patient_name}' is already assigned to Bed '{existing_bed.bed_number}'."
            )
    return crud.create_entity(db, models.Bed, payload, user_id)


@router.put("/{bed_id}", response_model=schemas.BedRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_bed(
    bed_id: PositiveId,
    payload: schemas.BedUpdate,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    from fastapi import HTTPException
    bed = crud.get_entity_or_404(db, models.Bed, bed_id, owner_id)
    if payload.status == "Occupied" and payload.patient_name:
        existing_bed = db.query(models.Bed).filter(
            models.Bed.patient_name == payload.patient_name,
            models.Bed.status == "Occupied",
            models.Bed.id != bed_id
        ).first()
        if existing_bed:
            raise HTTPException(
                status_code=400,
                detail=f"Patient '{payload.patient_name}' is already assigned to Bed '{existing_bed.bed_number}'."
            )
    return crud.update_entity(db, bed, payload)


@router.delete("/{bed_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_bed(
    bed_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    bed = crud.get_entity_or_404(db, models.Bed, bed_id, owner_id)
    return crud.delete_entity(db, bed)
