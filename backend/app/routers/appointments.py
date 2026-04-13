from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import crud, models, schemas
from ..database import get_db

router = APIRouter(prefix="/appointments", tags=["appointments"])


@router.get("", response_model=list[schemas.AppointmentRead])
def list_appointments(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.Appointment, current_user_id)


@router.post("", response_model=schemas.AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(payload: schemas.AppointmentCreate, db: Session = Depends(get_db)):
    print("DEBUG: create_appointment called")
    # Allow public appointment booking without an access token
    default_user = db.query(models.User).filter(models.User.role.ilike('%admin%')).first()
    if not default_user:
        default_user = db.query(models.User).first()
    owner_id = default_user.id if default_user else 1
    return crud.create_entity(db, models.Appointment, payload, owner_id)


@router.get("/{appointment_id}", response_model=schemas.AppointmentRead)
def get_appointment(appointment_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.Appointment, appointment_id, current_user_id)


@router.put("/{appointment_id}", response_model=schemas.AppointmentRead)
def update_appointment(appointment_id: int, payload: schemas.AppointmentUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, current_user_id)
    return crud.update_entity(db, appointment, payload)


@router.delete("/{appointment_id}")
def delete_appointment(appointment_id: int, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, current_user_id)
    return crud.delete_entity(db, appointment)
