from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id
from ..database import get_db

router = APIRouter(prefix="/beds", tags=["Beds"])


@router.get("", response_model=list[schemas.BedRead])
def list_beds(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.list_entities(db, models.Bed, user_id)


@router.post("", response_model=schemas.BedRead)
def create_bed(
    payload: schemas.BedCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.create_entity(db, models.Bed, payload, user_id)


@router.put("/{bed_id}", response_model=schemas.BedRead)
def update_bed(
    bed_id: int,
    payload: schemas.BedUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    bed = crud.get_entity_or_404(db, models.Bed, bed_id, user_id)
    return crud.update_entity(db, bed, payload)


@router.delete("/{bed_id}")
def delete_bed(
    bed_id: int,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    bed = crud.get_entity_or_404(db, models.Bed, bed_id, user_id)
    return crud.delete_entity(db, bed)
