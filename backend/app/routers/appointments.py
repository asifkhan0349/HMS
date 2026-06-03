from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
import httpx
import logging

from ..auth_context import get_current_user, get_current_user_id, require_roles, require_admin, exclude_roles, get_patient_name_filter, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from ..core.config import settings
from .common import PositiveId

logger = logging.getLogger(__name__)

# Roles permitted to access Scheduling — must stay in sync with
# SCHEDULING_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor", "Patient", "Reception"]

router = APIRouter(
    prefix="/appointments",
    tags=["appointments"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)

# ── Public router (no authentication) ─────────────────────────────────────────
# Mounted separately in main.py so it is completely outside the auth dependency
# chain applied to `router` above.
public_router = APIRouter(
    prefix="/appointments",
    tags=["appointments – public"],
)


async def send_appointment_webhook(appointment_data: dict, is_booking: bool = False):
    url = settings.APPOINTMENT_BOOKING_WEBHOOK_URL if is_booking else settings.APPOINTMENT_WEBHOOK_URL
    webhook_name = "Booking" if is_booking else "Confirmation"
    if not url:
        logger.warning(f"Appointment {webhook_name.lower()} webhook URL not configured. Skipping.")
        return

    headers = {"Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=appointment_data, headers=headers, timeout=10.0)
            response.raise_for_status()
            logger.info(f"{webhook_name} webhook sent to {url} successfully: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send {webhook_name.lower()} webhook to {url}: {e}")


@router.get("", response_model=list[schemas.AppointmentRead])
def list_appointments(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    patient_name_filter: str | None = Depends(get_patient_name_filter),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    query = db.query(models.Appointment)

    if current_user.role == "Doctor":
        # Doctors bypass the owner_user_id filter — appointments are owned by
        # the admin who created them, not by the doctor user account.
        # Instead, filter only by the doctor's assigned Staff ID.
        if current_user.staff_id:
            query = query.filter(models.Appointment.doctor_id == current_user.staff_id)
        else:
            # Doctors without a Staff ID cannot see any appointments
            query = query.filter(models.Appointment.doctor_id == "__NONE__")
    elif owner_id is not None:
        # All other non-admin roles: scope to their own data
        query = query.filter(models.Appointment.owner_user_id == owner_id)

    if patient_name_filter is not None:
        query = query.filter(models.Appointment.patient_name == patient_name_filter)
    
    return query.order_by(models.Appointment.id.desc()).all()


@router.post("", response_model=schemas.AppointmentRead, status_code=status.HTTP_201_CREATED)
def create_appointment(
    payload: schemas.AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role == "Patient":
        payload.patient_name = current_user.full_name

    appointment = crud.create_entity(db, models.Appointment, payload, current_user.id)
    appointment_data = schemas.AppointmentRead.model_validate(appointment).model_dump(mode='json')
    background_tasks.add_task(
        send_appointment_webhook,
        appointment_data,
        is_booking=True
    )
    return appointment


@router.get("/{appointment_id}", response_model=schemas.AppointmentRead)
def get_appointment(
    appointment_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering)
):
    return crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=owner_id)


@router.put("/{appointment_id}", response_model=schemas.AppointmentRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_appointment(
    appointment_id: PositiveId,
    payload: schemas.AppointmentUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    owner_id: int | None = Depends(get_owner_id_for_filtering)
):
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=owner_id)

    # Only Admin may edit or update an appointment.
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Admin can edit appointments.",
        )

    updated_appointment = crud.update_entity(db, appointment, payload)

    appointment_data = schemas.AppointmentRead.model_validate(updated_appointment).model_dump(mode='json')
    background_tasks.add_task(
        send_appointment_webhook,
        appointment_data,
        is_booking=False
    )

    return updated_appointment


@router.delete("/{appointment_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_appointment(
    appointment_id: PositiveId,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    owner_id: int | None = Depends(get_owner_id_for_filtering)
):
    # Only Admin may delete an appointment.
    if current_user.role != "Admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied. Only Admin can delete appointments.",
        )
    appointment = crud.get_entity_or_404(db, models.Appointment, appointment_id, owner_id=owner_id)
    return crud.delete_entity(db, appointment)


# ── Public endpoint ────────────────────────────────────────────────────────────

@public_router.post(
    "/public",
    response_model=schemas.AppointmentRead,
    status_code=status.HTTP_201_CREATED,
    summary="Book an appointment (no authentication required)",
)
def create_public_appointment(
    payload: schemas.AppointmentPublicCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Public appointment-booking endpoint.

    * No authentication or role check is applied.
    * The ``status`` field is not accepted from the caller and is always
      forced to ``"pending"`` so that staff can review and approve bookings.
    * All other validation rules (required fields, age-or-dob constraint, etc.)
      remain exactly as for the protected endpoint.
    """
    # Build a full AppointmentCreate by injecting the forced status.
    full_payload = schemas.AppointmentCreate(
        **payload.model_dump(),
        status="Pending",
    )

    # Resolve an owner the same way the protected route does.
    default_user = db.query(models.User).filter(models.User.role.ilike("%admin%")).first()
    if not default_user:
        default_user = db.query(models.User).first()
    owner_id = default_user.id if default_user else 1

    appointment = crud.create_entity(db, models.Appointment, full_payload, owner_id)
    appointment_data = schemas.AppointmentRead.model_validate(appointment).model_dump(mode='json')
    background_tasks.add_task(
        send_appointment_webhook,
        appointment_data,
        is_booking=True
    )
    return appointment
