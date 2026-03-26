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


def create_entity(db: Session, model, payload, owner_user_id: int):
    entity = model(owner_user_id=owner_user_id, **payload.model_dump())
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
