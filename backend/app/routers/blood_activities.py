from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from .. import crud, models, schemas
from ..auth_context import get_current_user_id, require_roles, exclude_roles, get_owner_id_for_filtering
from ..core.database import get_db
from .common import PositiveId

# Roles permitted to access Emergency Blood Bank — must stay in sync with
# BLOOD_BANK_ROLES in src/App.jsx and allowedRoles in Sidebar.jsx.
_ALLOWED_ROLES = ["Admin", "Doctor", "Nurse", "Reception"]

router = APIRouter(
    prefix="/blood_activities",
    tags=["Blood Bank"],
    dependencies=[Depends(require_roles(_ALLOWED_ROLES))]
)


def refresh_inventory_status(inventory_item):
    """Helper to update status based on current units."""
    if inventory_item.units < 10:
        inventory_item.status = "Critical"
    elif inventory_item.units < 25:
        inventory_item.status = "Low"
    else:
        inventory_item.status = "Stable"


def resolve_shared_blood_owner_id(db: Session, current_user_id: int, blood_group: str) -> int:
    existing_inventory = db.query(models.BloodInventory).filter(
        models.BloodInventory.blood_group == blood_group
    ).first()
    if existing_inventory:
        return existing_inventory.owner_user_id

    admin_user = db.query(models.User).filter(models.User.role == "Admin").order_by(models.User.id.asc()).first()
    if admin_user:
        return admin_user.id

    return current_user_id


def sync_activity_to_inventory(db: Session, user_id: int, blood_group: str, units: int, activity_type: str, revert: bool = False):
    """
    Adjusts inventory for a specific activity.
    If revert=True: undoes the impact of the activity.
    """
    inv = db.query(models.BloodInventory).filter(
        models.BloodInventory.blood_group == blood_group,
        models.BloodInventory.owner_user_id == user_id
    ).first()

    if not inv and not revert:
        inv = models.BloodInventory(
            blood_group=blood_group,
            units=0,
            status="Stable",
            trend="Stable",
            owner_user_id=user_id
        )
        db.add(inv)

    if inv:
        impact = units
        if activity_type == "Donation":
            # If creating a donation, add units. If reverting, subtract them.
            inv.units += (impact if not revert else -impact)
        elif activity_type in ["Usage", "Transfer"]:
            # If creating usage/transfer, subtract units. If reverting, add them.
            inv.units += (-impact if not revert else impact)

        # Guard against negatives
        inv.units = max(0, inv.units)
        refresh_inventory_status(inv)
        print(f"DEBUG SYNC: {activity_type} {'REVERT' if revert else 'APPLY'} {blood_group} {units} units. New Total: {inv.units}")


@router.get("", response_model=list[schemas.BloodActivityRead])
def list_blood_activities(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    return crud.list_entities(db, models.BloodActivity, owner_id)


@router.post("", response_model=schemas.BloodActivityRead, status_code=status.HTTP_201_CREATED)
def create_blood_activity(
    payload: schemas.BloodActivityCreate,
    db: Session = Depends(get_db),
    user_id: int = Depends(get_current_user_id),
):
    owner_user_id = resolve_shared_blood_owner_id(db, user_id, payload.blood_group)
    activity = models.BloodActivity(**payload.model_dump(), owner_user_id=owner_user_id)
    db.add(activity)
    sync_activity_to_inventory(db, owner_user_id, activity.blood_group, activity.units, activity.type)
    db.commit()
    db.refresh(activity)
    return activity


@router.put("/{act_id}", response_model=schemas.BloodActivityRead, dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
def update_blood_activity(
    act_id: PositiveId,
    payload: schemas.BloodActivityUpdate,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    activity = crud.get_entity_or_404(db, models.BloodActivity, act_id, owner_id)
    inventory_owner_id = activity.owner_user_id

    # 1. Revert OLD impact completely
    sync_activity_to_inventory(db, inventory_owner_id, activity.blood_group, activity.units, activity.type, revert=True)

    # 2. Update the activity record fields
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(activity, field, value)
    db.flush()  # Ensure the new group/units reflect in the object

    # 3. Apply NEW impact
    sync_activity_to_inventory(db, inventory_owner_id, activity.blood_group, activity.units, activity.type, revert=False)

    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/{act_id}", response_model=schemas.MessageResponse, dependencies=[Depends(exclude_roles(["Patient", "Doctor", "Nurse", "Reception"]))])
def delete_blood_activity(
    act_id: PositiveId,
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
):
    activity = crud.get_entity_or_404(db, models.BloodActivity, act_id, owner_id)
    sync_activity_to_inventory(db, activity.owner_user_id, activity.blood_group, activity.units, activity.type, revert=True)
    db.delete(activity)
    db.commit()
    return {"message": "Activity deleted successfully"}
