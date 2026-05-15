from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import uuid
import json
from .core.websockets import manager


def list_entities(db: Session, model, owner_id: int | None = None,
                  skip: int = 0, limit: int = 100):
    """Return a paginated list of entities. Default: first 100 records."""
    query = db.query(model)
    if owner_id is not None:
        query = query.filter(model.owner_user_id == owner_id)
    return query.order_by(model.id.desc()).offset(skip).limit(limit).all()


def get_entity_or_404(db: Session, model, entity_id: int, owner_id: int | None = None):
    query = db.query(model).filter(model.id == entity_id)
    if owner_id is not None:
        query = query.filter(model.owner_user_id == owner_id)

    entity = query.first()
    if entity is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{model.__name__} with id {entity_id} was not found.",
        )
    return entity


# Maps model names to their unique-code field names
# NOTE: MedicalRecord has TWO code fields — handled via _MULTI_CODE_FIELDS below.
_CODE_FIELDS: dict[str, tuple[str, str]] = {
    "Patient":       ("patient_code",   "PAT"),
    "Invoice":       ("invoice_code",   "INV"),
    "Medicine":      ("medicine_code",  "MED"),
    "LabTest":       ("test_code",      "TST"),
    "Staff":         ("staff_code",     "STF"),
    "InventoryItem": ("item_code",      "ITM"),
}

# Models that have TWO code fields (record_code + clinical_id)
_MULTI_CODE_FIELDS: dict[str, list[tuple[str, str]]] = {
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

    # Business Logic Validation: Prevent negative stock
    if "stock" in data and isinstance(data["stock"], (int, float)) and data["stock"] < 0:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock cannot be negative.",
        )

    entity = model(owner_user_id=owner_user_id, **data)
    db.add(entity)
    db.commit()
    db.refresh(entity)

    # Universal Sequential ID handling (01, 02...)
    code_field = _CODE_FIELDS.get(model_name)
    if code_field and not getattr(entity, code_field[0]):
        setattr(entity, code_field[0], f"{entity.id:02d}")
        db.commit()
        db.refresh(entity)
    
    # Handling for Appointment booking_id specifically (if not in _CODE_FIELDS)
    if model_name == "Appointment" and not entity.booking_id:
        entity.booking_id = f"{entity.id:02d}"
        db.commit()
        db.refresh(entity)

    # Handling for multi-code fields (MedicalRecord)
    multi_codes = _MULTI_CODE_FIELDS.get(model_name)
    if multi_codes:
        needs_commit = False
        for field_name, _ in multi_codes:
            if not getattr(entity, field_name):
                setattr(entity, field_name, f"{entity.id:02d}")
                needs_commit = True
        if needs_commit:
            db.commit()
            db.refresh(entity)

    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "create", "entity": model_name}))
    return entity


def update_entity(db: Session, entity, payload):
    data = payload.model_dump(exclude_unset=True)
    if "stock" in data and isinstance(data["stock"], (int, float)) and data["stock"] < 0:
         raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Stock cannot be negative.",
        )
    for field, value in data.items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "update", "entity": entity.__class__.__name__}))
    return entity


def delete_entity(db: Session, entity):
    db.delete(entity)
    db.commit()
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "delete", "entity": entity.__class__.__name__}))
    return {"message": "Deleted successfully"}
