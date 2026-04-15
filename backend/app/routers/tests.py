from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import crud, models, schemas
from ..database import get_db
from .common import PositiveId

router = APIRouter(prefix="/tests", tags=["tests"])


@router.get("", response_model=list[schemas.LabTestRead])
def list_tests(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.LabTest, current_user_id)


@router.post("", response_model=schemas.LabTestRead, status_code=status.HTTP_201_CREATED)
def create_test(payload: schemas.LabTestCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.LabTest, payload, current_user_id)


@router.get("/{test_id}", response_model=schemas.LabTestRead)
def get_test(test_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.LabTest, test_id, current_user_id)


@router.put("/{test_id}", response_model=schemas.LabTestRead)
def update_test(test_id: PositiveId, payload: schemas.LabTestUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    test = crud.get_entity_or_404(db, models.LabTest, test_id, current_user_id)
    return crud.update_entity(db, test, payload)


@router.delete("/{test_id}", response_model=schemas.MessageResponse)
def delete_test(test_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    test = crud.get_entity_or_404(db, models.LabTest, test_id, current_user_id)
    return crud.delete_entity(db, test)
