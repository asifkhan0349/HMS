from fastapi import HTTPException, status
from sqlalchemy.orm import Session


def list_entities(db: Session, model, owner_user_id: int):
    return db.query(model).filter(model.owner_user_id == owner_user_id).order_by(model.id.desc()).all()


def get_entity_or_404(db: Session, model, entity_id: int, owner_user_id: int):
    entity = db.query(model).filter(model.id == entity_id, model.owner_user_id == owner_user_id).first()
    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{model.__name__} with id {entity_id} was not found.",
        )
    return entity


import uuid

# Maps model names to their unique-code field names
_CODE_FIELDS = {
    "Patient":       ("patient_code",      "PAT"),
    "Appointment":   ("appointment_code",  "APT"),
    "MedicalRecord": ("record_code",       "REC"),
    "MedicalRecord": ("clinical_id",       "CLN"),
    "Invoice":       ("invoice_code",      "INV"),
    "Medicine":      ("medicine_code",     "MED"),
    "LabTest":       ("test_code",         "TST"),
    "Staff":         ("staff_code",        "STF"),
    "InventoryItem": ("item_code",         "ITM"),
}

# Models that have TWO code fields (record_code + clinical_id)
_MULTI_CODE_FIELDS = {
    "MedicalRecord": [("record_code", "REC"), ("clinical_id", "CLN")],
}


def _generate_code(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def create_entity(db, model, payload, owner_user_id: int):
    data = payload.model_dump()
    model_name = model.__name__

    # Auto-generate any missing code fields
    if model_name in _MULTI_CODE_FIELDS:
        for field, prefix in _MULTI_CODE_FIELDS[model_name]:
            if not data.get(field):
                data[field] = _generate_code(prefix)
    elif model_name in _CODE_FIELDS:
        field, prefix = _CODE_FIELDS[model_name]
        if not data.get(field):
            data[field] = _generate_code(prefix)

    entity = model(owner_user_id=owner_user_id, **data)
    db.add(entity)
    db.commit()
    db.refresh(entity)
    return entity


def update_entity(db: Session, entity, payload):
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity


def delete_entity(db: Session, entity):
    db.delete(entity)
    db.commit()
    return {"message": "Deleted successfully"}
