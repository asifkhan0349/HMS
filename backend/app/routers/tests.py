from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Diagnostics & Lab — must stay in sync with
# LAB_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor", "Nurse", "Patient"]

router = APIRouter(
    prefix="/tests",
    tags=["tests"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.LabTestRead])
def list_tests(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.list_entities(db, models.LabTest, current_user_id)


@router.post("", response_model=schemas.LabTestRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exclude_roles(["Patient"]))])
def create_test(payload: schemas.LabTestCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.LabTest, payload, current_user_id)


@router.get("/{test_id}", response_model=schemas.LabTestRead)
def get_test(test_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.get_entity_or_404(db, models.LabTest, test_id, current_user_id)


@router.put("/{test_id}", response_model=schemas.LabTestRead, dependencies=[Depends(exclude_roles(["Patient"]))])
def update_test(test_id: PositiveId, payload: schemas.LabTestUpdate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    test = crud.get_entity_or_404(db, models.LabTest, test_id, current_user_id)
    return crud.update_entity(db, test, payload)


@router.delete("/{test_id}", response_model=schemas.MessageResponse, dependencies=[Depends(exclude_roles(["Patient"]))])
def delete_test(test_id: PositiveId, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    test = crud.get_entity_or_404(db, models.LabTest, test_id, current_user_id)
    return crud.delete_entity(db, test)
