from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
import uuid
import json
from app.core.websockets import manager

from . import models

def _generate_code(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"

def check_duplicate_patient(db: Session, name: str, blood_group: str, phone_number: str, email: str | None, exclude_id: int | None = None):
    name_clean = name.strip()
    phone_clean = phone_number.strip()
    email_clean = email.strip() if email else None
    
    query = db.query(models.Patient).filter(
        func.lower(models.Patient.name) == name_clean.lower(),
        models.Patient.blood_group == blood_group,
        models.Patient.phone_number == phone_clean
    )
    if email_clean:
        query = query.filter(func.lower(models.Patient.email) == email_clean.lower())
    else:
        query = query.filter((models.Patient.email == None) | (models.Patient.email == ""))

    if exclude_id is not None:
        query = query.filter(models.Patient.id != exclude_id)
        
    existing = query.first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A patient with the exact same combination of Name, Blood Group, Phone Number, and Email already exists."
        )

def list_patients(db: Session, owner_id: int | None, skip: int = 0, limit: int = 100,
                  patient_name_filter: str | None = None):
    query = db.query(models.Patient)
    if owner_id is not None:
        query = query.filter(models.Patient.owner_user_id == owner_id)
    if patient_name_filter is not None:
        # Patient role: only show the record whose name matches the logged-in user
        query = query.filter(models.Patient.name == patient_name_filter)
    return query.order_by(models.Patient.id.desc()).offset(skip).limit(limit).all()

def get_patient_or_404(db: Session, patient_id: int, owner_id: int | None):
    query = db.query(models.Patient).filter(models.Patient.id == patient_id)
    if owner_id is not None:
        query = query.filter(models.Patient.owner_user_id == owner_id)
    patient = query.first()
    if not patient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Patient with id {patient_id} was not found.",
        )
    return patient

def create_patient(db: Session, payload, owner_user_id: int):
    check_duplicate_patient(
        db,
        name=payload.name,
        blood_group=payload.blood_group.value if hasattr(payload.blood_group, 'value') else payload.blood_group,
        phone_number=payload.phone_number,
        email=payload.email
    )
    
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
    data = payload.model_dump(exclude_unset=True)
    new_name = data.get("name", patient.name)
    new_blood_group = data.get("blood_group", patient.blood_group)
    new_phone_number = data.get("phone_number", patient.phone_number)
    new_email = data.get("email", patient.email)
    
    if hasattr(new_blood_group, 'value'):
        new_blood_group = new_blood_group.value
        
    check_duplicate_patient(
        db,
        name=new_name,
        blood_group=new_blood_group,
        phone_number=new_phone_number,
        email=new_email,
        exclude_id=patient.id
    )
    
    for field, value in data.items():
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
