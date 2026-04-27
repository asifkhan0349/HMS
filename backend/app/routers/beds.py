from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id
from ..core.database import get_db
from .common import PositiveId

router = APIRouter(
    prefix="/beds",
    tags=["beds"],
    dependencies=[Depends(get_current_user_id)]
)


@router.get("", response_model=list[schemas.BedRead])
def list_beds(
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.list_entities(db, models.Bed, user_id)


@router.post("", response_model=schemas.BedRead, status_code=status.HTTP_201_CREATED)
def create_bed(
    payload: schemas.BedCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    return crud.create_entity(db, models.Bed, payload, user_id)


@router.put("/{bed_id}", response_model=schemas.BedRead)
def update_bed(
    bed_id: PositiveId,
    payload: schemas.BedUpdate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    bed = crud.get_entity_or_404(db, models.Bed, bed_id, user_id)
    return crud.update_entity(db, bed, payload)


@router.delete("/{bed_id}", response_model=schemas.MessageResponse)
def delete_bed(
    bed_id: PositiveId,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    bed = crud.get_entity_or_404(db, models.Bed, bed_id, user_id)
    return crud.delete_entity(db, bed)
