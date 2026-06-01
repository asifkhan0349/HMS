from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from .. import crud, models, schemas
from ..auth_context import (
    get_current_user_id,
    get_facility_owner_id_filter,
    require_roles,
)
from ..core.database import get_db
from .common import PositiveId

_ALLOWED_ROLES = ["Admin", "Reception", "Nurse"]

router = APIRouter(
    prefix="/ambulances",
    tags=["ambulances"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.AmbulanceRead])
def list_ambulances(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    return crud.list_entities(db, models.Ambulance, owner_id)


@router.get("/trips", response_model=list[schemas.AmbulanceTripRead])
def list_completed_trips(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    query = db.query(models.AmbulanceTrip)
    if owner_id is not None:
        query = query.filter(models.AmbulanceTrip.owner_user_id == owner_id)
    return query.order_by(models.AmbulanceTrip.id.desc()).all()


@router.post("", response_model=schemas.AmbulanceRead, status_code=status.HTTP_201_CREATED)
def create_ambulance(
    payload: schemas.AmbulanceCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    from fastapi import HTTPException
    existing_ambulance = db.query(models.Ambulance).filter(
        models.Ambulance.vehicle_number == payload.vehicle_number
    ).first()
    if existing_ambulance:
        raise HTTPException(
            status_code=400,
            detail=f"Ambulance with vehicle number '{payload.vehicle_number}' already exists."
        )
    return crud.create_entity(db, models.Ambulance, payload, user_id)


@router.put("/{ambulance_id}", response_model=schemas.AmbulanceRead)
def update_ambulance(
    ambulance_id: PositiveId,
    payload: schemas.AmbulanceUpdate,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    from fastapi import HTTPException
    ambulance = crud.get_entity_or_404(db, models.Ambulance, ambulance_id, owner_id)
    
    if payload.vehicle_number and payload.vehicle_number != ambulance.vehicle_number:
        existing_ambulance = db.query(models.Ambulance).filter(
            models.Ambulance.vehicle_number == payload.vehicle_number,
            models.Ambulance.id != ambulance_id
        ).first()
        if existing_ambulance:
            raise HTTPException(
                status_code=400,
                detail=f"Ambulance with vehicle number '{payload.vehicle_number}' already exists."
            )

    print(f"DEBUG update_ambulance: id={ambulance_id}, current_status={ambulance.status}, payload_status={payload.status}, patient={ambulance.current_trip_patient}, dest={ambulance.current_trip_destination}")

    # Check status transition from Dispatched to Available to create a trip record
    if ambulance.status == "Dispatched" and payload.status == "Available":
        trip = models.AmbulanceTrip(
            owner_user_id=ambulance.owner_user_id,
            ambulance_id=ambulance.id,
            ambulance_code=ambulance.ambulance_code,
            vehicle_number=ambulance.vehicle_number,
            patient_name=ambulance.current_trip_patient or "Unknown",
            destination=ambulance.current_trip_destination or "Unknown",
            driver_name=ambulance.driver_name,
            paramedic_name=ambulance.paramedic_name,
            completed_at=datetime.now(timezone.utc)
        )
        db.add(trip)
        db.commit()
            
    return crud.update_entity(db, ambulance, payload)


@router.delete("/{ambulance_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_ambulance(
    ambulance_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_facility_owner_id_filter),
):
    ambulance = crud.get_entity_or_404(db, models.Ambulance, ambulance_id, owner_id)
    return crud.delete_entity(db, ambulance)

