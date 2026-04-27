from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..auth_context import get_current_user_id
from .. import models, schemas
from ..core.database import get_db

router = APIRouter(
    prefix="/dashboard",
    tags=["dashboard"],
    dependencies=[Depends(get_current_user_id)]
)


@router.get("/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db), current_user_id: int = Depends(get_current_user_id)):
    return schemas.DashboardStats(
        patients=db.query(models.Patient).filter(models.Patient.owner_user_id == current_user_id).count(),
        appointments=db.query(models.Appointment).filter(models.Appointment.owner_user_id == current_user_id).count(),
        records=db.query(models.MedicalRecord).filter(models.MedicalRecord.owner_user_id == current_user_id).count(),
        invoices=db.query(models.Invoice).filter(models.Invoice.owner_user_id == current_user_id).count(),
        medicines=db.query(models.Medicine).filter(models.Medicine.owner_user_id == current_user_id).count(),
        tests=db.query(models.LabTest).filter(models.LabTest.owner_user_id == current_user_id).count(),
        staff=db.query(models.Staff).filter(models.Staff.owner_user_id == current_user_id).count(),
    )
