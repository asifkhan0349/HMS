from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user
from .. import crud, models, schemas
from ..database import get_db
from .common import PositiveId

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=list[schemas.AppointmentRead])
def list_appointments(
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators can view appointments."
        )
    # Admins can see all appointments (owner_id=None)
    return crud.list_entities(db, models.Appointment, owner_id=None)


@router.post("", response_model=schemas.AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    # Public booking remains allowed. We assign to a default admin owner.
    default_user = db.query(models.User).filter(models.User.role.ilike('%admin%')).first()
    if not default_user:
        default_user = db.query(models.User).first()
    owner_id = default_user.id if default_user else 1
    return crud.create_entity(db, models.Appointment, payload, owner_id)


@router.get("/{appointment_id}", response_model=schemas.AppointmentRead)
def get_appointment(
    appointment_id: PositiveId, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators can view appointment details."
        )
    return crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=None)


@router.put("/{appointment_id}", response_model=schemas.AppointmentRead)
def update_appointment(
    appointment_id: PositiveId, 
    payload: schemas.AppointmentUpdate, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators can update appointments."
        )
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=None)
    return crud.update_entity(db, appointment, payload)


@router.delete("/{appointment_id}", response_model=schemas.MessageResponse)
def delete_appointment(
    appointment_id: PositiveId, 
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators can delete appointments."
        )
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=None)
    return crud.delete_entity(db, appointment)
