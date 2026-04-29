from sqlalchemy.orm import Session
from fastapi import HTTPException, status
import uuid
import json
from app.core.websockets import manager

from . import models

def _generate_code(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def list_patients(db: Session, owner_id: int, skip: int = 0, limit: int = 100):
    # Removing owner_user_id filter to ensure data is "visible to all other users" as requested.
    return (
        db.query(models.Patient)
        .order_by(models.Patient.id.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

def get_patient_or_404(db: Session, patient_id: int, owner_id: int):
    patient = (
        db.query(models.Patient)
        .filter(models.Patient.id == patient_id, models.Patient.owner_user_id == owner_id)
        .first()
    )
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} was not found.",
        )
    return patient

def create_patient(db: Session, payload, owner_user_id: int):
    data = payload.model_dump()
    if not data.get("patient_code"):
        data["patient_code"] = _generate_code("PAT")
    
    patient = models.Patient(owner_user_id=owner_user_id, **data)
    db.add(patient)
    db.commit()
    db.refresh(patient)
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "create", "entity": "Patient"}))
    return patient

def update_patient(db: Session, patient, payload):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(patient, field, value)
    db.commit()
    db.refresh(patient)
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "update", "entity": "Patient"}))
    return patient

def delete_patient(db: Session, patient):
    db.delete(patient)
    db.commit()
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "delete", "entity": "Patient"}))
    return {"message": "Deleted successfully"}
