from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import crud, models, schemas
from ..database import get_db
from .common import PositiveId

router = APIRouter(prefix="/staff", tags=["staff"])


@router.get("", response_model=list[schemas.StaffRead])
def list_staff(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.Staff, current_user_id)


@router.post("", response_model=schemas.StaffRead, status_code=status.HTTP_201_CREATED)
def create_staff_member(payload: schemas.StaffCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.Staff, payload, current_user_id)


@router.get("/{staff_id}", response_model=schemas.StaffRead)
def get_staff_member(staff_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.Staff, staff_id, current_user_id)


@router.put("/{staff_id}", response_model=schemas.StaffRead)
def update_staff_member(staff_id: PositiveId, payload: schemas.StaffUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    staff_member = crud.get_entity_or_404(db, models.Staff, staff_id, current_user_id)
    return crud.update_entity(db, staff_member, payload)


@router.delete("/{staff_id}", response_model=schemas.MessageResponse)
def delete_staff_member(staff_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    staff_member = crud.get_entity_or_404(db, models.Staff, staff_id, current_user_id)
    return crud.delete_entity(db, staff_member)
