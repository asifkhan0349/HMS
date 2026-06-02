from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from .. import crud, models, schemas
from ..core.database import get_db
from .common import PositiveId

_ALLOWED_ROLES = ["Admin", "Doctor", "Nurse"]

router = APIRouter(
    prefix="/discharge-summaries",
    tags=["discharge-summaries"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


@router.get("", response_model=list[schemas.DischargeSummaryRead])
def list_summaries(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.list_entities(db, models.DischargeSummary, owner_id)


@router.post("", response_model=schemas.DischargeSummaryRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(exclude_roles(["Patient", "Reception"]))])
def create_summary(payload: schemas.DischargeSummaryCreate, db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return crud.create_entity(db, models.DischargeSummary, payload, current_user_id)


@router.get("/{summary_id}", response_model=schemas.DischargeSummaryRead)
def get_summary(summary_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    return crud.get_entity_or_404(db, models.DischargeSummary, summary_id, owner_id)


@router.put("/{summary_id}", response_model=schemas.DischargeSummaryRead, dependencies=[Depends(require_roles(["Admin"]))])
def update_summary(summary_id: PositiveId, payload: schemas.DischargeSummaryUpdate, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    summary = crud.get_entity_or_404(db, models.DischargeSummary, summary_id, owner_id)
    return crud.update_entity(db, summary, payload)


@router.delete("/{summary_id}", response_model=schemas.MessageResponse, dependencies=[Depends(require_roles(["Admin"]))])
def delete_summary(summary_id: PositiveId, db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    summary = crud.get_entity_or_404(db, models.DischargeSummary, summary_id, owner_id)
    return crud.delete_entity(db, summary)


# ── Public Router ─────────────────────────────────────────────────────────────
public_router = APIRouter(
    prefix="/discharge-summaries",
    tags=["discharge-summaries – public"],
)

@public_router.get("/public", response_model=list[schemas.DischargeSummaryRead])
def list_public_summaries(db: Session = Depends(get_db)):
    return crud.list_entities(db, models.DischargeSummary)

@public_router.get("/public/{summary_id}", response_model=schemas.DischargeSummaryRead)
def get_public_summary(summary_id: PositiveId, db: Session = Depends(get_db)):
    return crud.get_entity_or_404(db, models.DischargeSummary, summary_id)
