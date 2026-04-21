from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import httpx
import logging

from ..auth_context import get_current_user
from .. import crud, models, schemas
from ..core.database import get_db
from ..core.config import settings
from .common import PositiveId

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/appointments", tags=["appointments"])


async def send_appointment_webhook(status: str, telegram_chat_id: str | None):
    url = settings.APPOINTMENT_WEBHOOK_URL
    if not url:
        logger.warning("Appointment webhook URL not configured. Skipping.")
        return

    payload = {
        "status": status,
        "telegram_chat_id": str(telegram_chat_id) if telegram_chat_id is not None else None
    }
    headers = {"Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=payload, headers=headers, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Webhook sent to {url} successfully: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send webhook to {url}: {e}")


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
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db), 
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role.lower() != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only administrators can update appointments."
        )
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=None)
    
    old_status = appointment.status
    updated_appointment = crud.update_entity(db, appointment, payload)
    
    if payload.status is not None and payload.status != old_status:
        background_tasks.add_task(
            send_appointment_webhook, 
            updated_appointment.status, 
            updated_appointment.telegram_chat_id
        )
        
    return updated_appointment


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
