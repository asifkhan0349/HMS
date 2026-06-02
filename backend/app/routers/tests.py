from fastapi import APIRouter, Depends, status, BackgroundTasks
from sqlalchemy.orm import Session
import httpx
import logging

from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from ..core.config import settings
from .common import PositiveId

logger = logging.getLogger(__name__)

async def send_lab_test_webhook(lab_test_data: dict):
    url = settings.LAB_STATUS_WEBHOOK_URL
    if not url:
        logger.warning("Lab status webhook URL not configured. Skipping.")
        return

    headers = {"Content-Type": "application/json"}
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(url, json=lab_test_data, headers=headers, timeout=10.0)
            response.raise_for_status()
            logger.info(f"Lab webhook sent to {url} successfully: {response.status_code}")
    except Exception as e:
        logger.error(f"Failed to send lab webhook to {url}: {e}")

# Roles permitted to access Diagnostics & Lab — must stay in sync with
# LAB_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor"]

router = APIRouter(
    prefix="/tests",
    tags=["tests"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.LabTestRead])
def list_tests(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.list_entities(db, models.LabTest, owner_id)


@router.post("", response_model=schemas.LabTestRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exclude_roles(["Patient"]))])
def create_test(
    payload: schemas.LabTestCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user_id: int = Depends(get_current_user_id)
):
    test = crud.create_entity(db, models.LabTest, payload, current_user_id)
    test_data = schemas.LabTestRead.model_validate(test).model_dump(mode='json')
    background_tasks.add_task(send_lab_test_webhook, test_data)
    return test


@router.get("/{test_id}", response_model=schemas.LabTestRead)
def get_test(test_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.get_entity_or_404(db, models.LabTest, test_id, owner_id)


@router.put("/{test_id}", response_model=schemas.LabTestRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_test(
    test_id: PositiveId,
    payload: schemas.LabTestUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering)
):
    test = crud.get_entity_or_404(db, models.LabTest, test_id, owner_id)
    updated_test = crud.update_entity(db, test, payload)
    
    test_data = schemas.LabTestRead.model_validate(updated_test).model_dump(mode='json')
    background_tasks.add_task(send_lab_test_webhook, test_data)
        
    return updated_test


@router.delete("/{test_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_test(test_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    test = crud.get_entity_or_404(db, models.LabTest, test_id, owner_id)
    return crud.delete_entity(db, test)


# ── Public Router ─────────────────────────────────────────────────────────────
public_router = APIRouter(
    prefix="/tests",
    tags=["tests – public"],
)

@public_router.get("/public", response_model=list[schemas.LabTestRead])
def list_public_tests(db: Session = Depends(get_db)):
    return crud.list_entities(db, models.LabTest)

@public_router.get("/public/{test_id}", response_model=schemas.LabTestRead)
def get_public_test(test_id: PositiveId, db: Session = Depends(get_db)):
    return crud.get_entity_or_404(db, models.LabTest, test_id)

