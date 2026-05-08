from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth_context import get_owner_id_for_filtering, require_admin
from .. import models, schemas
from ..core.database import get_db

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    # Require a valid JWT *and* Admin role for every endpoint in this router.
    # require_admin internally calls get_current_user which calls get_current_user_id,
    # so listing only require_admin here is sufficient — no double dependency needed.
    dependencies=[Depends(require_admin)]
)


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), owner_id: int | None = Depends(get_owner_id_for_filtering)):
    def count_model(model):
        query = db.query(model)
        if owner_id is not None:
            query = query.filter(model.owner_user_id == owner_id)
        return query.count()

    return schemas.DashboardStats(
        patients=count_model(models.Patient),
        appointments=count_model(models.Appointment),
        records=count_model(models.MedicalRecord),
        invoices=count_model(models.Invoice),
        medicines=count_model(models.Medicine),
        tests=count_model(models.LabTest),
        staff=count_model(models.Staff),
    )
