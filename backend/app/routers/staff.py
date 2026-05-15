from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_admin, exclude_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId

router = APIRouter(
    prefix="/staff",
    tags=["staff"],
)


@router.get("", response_model=list[schemas.StaffRead])
def list_staff(db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    staff_members = crud.list_entities(db, models.Staff, owner_id)

    # Enrich each Doctor staff record with the linked user account's staff_id.
    # The appointment filter compares Appointment.doctor_id == User.staff_id,
    # so we need this value to be written correctly when assigning doctors.
    doctor_users = (
        db.query(models.User)
        .filter(models.User.role == "Doctor", models.User.staff_id.isnot(None))
        .all()
    )
    # Build a name → user.staff_id lookup (case-insensitive)
    name_to_staff_id = {u.full_name.strip().lower(): u.staff_id for u in doctor_users}

    results = []
    for s in staff_members:
        s_dict = {
            "id": s.id,
            "staff_code": s.staff_code,
            "name": s.name,
            "role": s.role,
            "department": s.department,
            "shift": s.shift,
            "status": s.status,
            "created_at": s.created_at,
            "user_staff_id": name_to_staff_id.get(s.name.strip().lower()) if s.role == "Doctor" else None,
        }
        results.append(schemas.StaffRead(**s_dict))
    return results


@router.post("", response_model=schemas.StaffRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
def create_staff_member(payload: schemas.StaffCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Staff, payload, current_user_id)


@router.get("/{staff_id}", response_model=schemas.StaffRead)
def get_staff_member(staff_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.get_entity_or_404(db, models.Staff, staff_id, owner_id)


@router.put("/{staff_id}", response_model=schemas.StaffRead, dependencies=[Depends(require_admin), Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
def update_staff_member(staff_id: PositiveId, payload: schemas.StaffUpdate, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    staff_member = crud.get_entity_or_404(db, models.Staff, staff_id, owner_id)
    return crud.update_entity(db, staff_member, payload)


@router.delete("/{staff_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_admin), Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
def delete_staff_member(staff_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    staff_member = crud.get_entity_or_404(db, models.Staff, staff_id, owner_id)
    return crud.delete_entity(db, staff_member)
