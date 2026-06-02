from datetime import datetime, timezone
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
import uuid
import json
import threading
from .core.websockets import manager

_id_lock = threading.Lock()


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
    "Ambulance":     ("ambulance_code", "AMB"),
    "DischargeSummary": ("discharge_code", "DSG"),
}

# Models that have TWO code fields (record_code + clinical_id)
_MULTI_CODE_FIELDS: dict[str, list[tuple[str, str]]] = {
    "MedicalRecord": [("record_code", "REC"), ("clinical_id", "CLN")],
}


def _generate_code(prefix: str) -> str:
    return f"{prefix}-{uuid.uuid4().hex[:8].upper()}"


def _generate_booking_id(db, now: datetime) -> str:
    """Generate BK{MM}{YY}{SEQ} — e.g., BK0626001. SEQ is scoped per calendar month."""
    from .models import Appointment
    mm = now.strftime("%m")
    yy = now.strftime("%y")
    prefix = f"BK{mm}{yy}"
    # Find all booking_ids with this month/year prefix and extract sequence numbers
    existing = (
        db.query(Appointment.booking_id)
        .filter(Appointment.booking_id.like(f"{prefix}%"))
        .all()
    )
    used = set()
    for (bid,) in existing:
        if bid and len(bid) > len(prefix):
            try:
                used.add(int(bid[len(prefix):]))
            except ValueError:
                pass
    seq = 1
    while seq in used:
        seq += 1
    return f"{prefix}{seq:03d}"


def _generate_appointment_code(db) -> str:
    """Generate AP-{SEQ} — e.g., AP-001. SEQ is global and auto-increments."""
    from .models import Appointment
    existing = (
        db.query(Appointment.appointment_code)
        .filter(Appointment.appointment_code.like("AP-%"))
        .all()
    )
    used = set()
    for (code,) in existing:
        if code and len(code) > 3:
            try:
                used.add(int(code[3:]))
            except ValueError:
                pass
    seq = 1
    while seq in used:
        seq += 1
    return f"AP-{seq:03d}"


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

    # Universal Sequential ID handling (01, 02...) for standard _CODE_FIELDS
    code_field = _CODE_FIELDS.get(model_name)
    if code_field and not getattr(entity, code_field[0]):
        setattr(entity, code_field[0], f"{entity.id:02d}")
        db.commit()
        db.refresh(entity)

    # Appointment-specific ID generation
    if model_name == "Appointment":
        with _id_lock:
            now = datetime.now(timezone.utc)
            needs_commit = False
            if not entity.booking_id:
                entity.booking_id = _generate_booking_id(db, now)
                needs_commit = True
            print(f"[DEBUG create_entity] status: {entity.status}, appointment_code: {entity.appointment_code}")
            if not entity.appointment_code and entity.status and entity.status.lower() in ("scheduled", "scheduled later"):
                entity.appointment_code = _generate_appointment_code(db)
                needs_commit = True
                print(f"[DEBUG create_entity] generated appointment_code: {entity.appointment_code}")
            if needs_commit:
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
    
    # Handle generating/clearing appointment_code on status update
    if entity.__class__.__name__ == "Appointment" or hasattr(entity, "appointment_code"):
        status_val = getattr(entity, "status", None)
        status_lower = status_val.lower() if status_val else ""
        if status_lower in ("scheduled", "scheduled later"):
            if not getattr(entity, "appointment_code", None):
                with _id_lock:
                    entity.appointment_code = _generate_appointment_code(db)
                    db.commit()
                    db.refresh(entity)
        else:
            entity.appointment_code = None
            db.commit()
            db.refresh(entity)
    else:
        db.commit()
        db.refresh(entity)
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "update", "entity": entity.__class__.__name__}))
    return entity


def delete_entity(db: Session, entity):
    db.delete(entity)
    db.commit()
    manager.broadcast_sync(json.dumps({"event": "data_updated", "action": "delete", "entity": entity.__class__.__name__}))
    return {"message": "Deleted successfully"}
