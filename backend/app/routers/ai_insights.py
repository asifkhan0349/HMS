from datetime import datetime, timezone
from decimal import Decimal

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from .. import models, schemas
from ..auth_context import get_current_user, get_owner_id_for_filtering
from ..core.database import get_db

router = APIRouter(
    prefix="/ai-insights",
    tags=["ai-insights"],
    dependencies=[Depends(get_current_user)],
)


def _filter_owner(query, model, owner_id: int | None):
    if owner_id is None:
        return query
    return query.filter(model.owner_user_id == owner_id)


def _insight(
    insight_id: str,
    product: str,
    module: str,
    severity: schemas.InsightSeverity,
    title: str,
    message: str,
    recommendation: str,
    trigger: str,
    source: str,
) -> schemas.AIInsightRead:
    return schemas.AIInsightRead(
        id=insight_id,
        product=product,
        module=module,
        severity=severity,
        title=title,
        message=message,
        recommendation=recommendation,
        trigger=trigger,
        source=source,
        created_at=datetime.now(timezone.utc),
    )


@router.get("", response_model=list[schemas.AIInsightRead])
def list_ai_insights(
    db: Session = Depends(get_db),
    owner_id: int | None = Depends(get_owner_id_for_filtering),
    module: str | None = Query(default=None, max_length=80),
    include_health: bool = Query(default=False),
):
    insights: list[schemas.AIInsightRead] = []
    modules_with_alerts: set[str] = set()

    beds = _filter_owner(db.query(models.Bed), models.Bed, owner_id).all()
    total_beds = len(beds)
    occupied_beds = sum(1 for bed in beds if (bed.status or "").lower() == "occupied")
    if total_beds:
        occupancy = occupied_beds / total_beds
        if occupancy >= 0.85:
            severity = "critical" if occupancy >= 0.95 else "warning"
            insights.append(_insight(
                "bed-occupancy-pressure",
                "Hospital Management System",
                "Beds",
                severity,
                "Bed occupancy pressure",
                f"{occupied_beds} of {total_beds} beds are occupied.",
                "Review discharge readiness and prepare alternate admission routing.",
                f"Occupancy is {occupancy:.0%}; warning threshold is 85%.",
                "beds.status",
            ))
            modules_with_alerts.add("Beds")

    inventory_items = _filter_owner(db.query(models.InventoryItem), models.InventoryItem, owner_id).all()
    low_inventory = [
        item for item in inventory_items
        if item.stock <= 10 or (item.status or "").lower() in {"low stock", "critical", "reorder"}
    ]
    if low_inventory:
        sample = ", ".join(item.name for item in low_inventory[:3])
        insights.append(_insight(
            "inventory-reorder-forecast",
            "Advanced Analytics",
            "Inventory",
            "warning",
            "Inventory reorder forecast",
            f"{len(low_inventory)} inventory items need replenishment review.",
            "Prioritize reorder planning for low-stock and operationally critical items.",
            f"Detected low stock/status signals; examples: {sample}.",
            "inventory.stock",
        ))
        modules_with_alerts.add("Inventory")

    medicines = _filter_owner(db.query(models.Medicine), models.Medicine, owner_id).all()
    low_medicines = [
        medicine for medicine in medicines
        if medicine.stock <= 10 or (medicine.status or "").lower() in {"low stock", "critical", "reorder"}
    ]
    if low_medicines:
        sample = ", ".join(medicine.name for medicine in low_medicines[:3])
        insights.append(_insight(
            "pharmacy-reorder-forecast",
            "Pharmacy Management",
            "Pharmacy",
            "warning",
            "Medicine reorder forecast",
            f"{len(low_medicines)} medicines need stock review.",
            "Create a pharmacy reorder list and check expiry-sensitive stock before purchase.",
            f"Detected low stock/status signals; examples: {sample}.",
            "medicines.stock",
        ))
        modules_with_alerts.add("Pharmacy")

    lab_tests = _filter_owner(db.query(models.LabTest), models.LabTest, owner_id).all()
    critical_labs = [
        test for test in lab_tests
        if any(token in f"{test.status} {test.test_name}".lower() for token in ["critical", "abnormal", "urgent"])
    ]
    if critical_labs:
        sample = ", ".join(f"{test.patient_name}: {test.test_name}" for test in critical_labs[:3])
        insights.append(_insight(
            "lab-critical-value-flags",
            "Lab Management",
            "Lab",
            "critical",
            "Critical lab value review",
            f"{len(critical_labs)} lab workflows are flagged as critical, abnormal, or urgent.",
            "Notify the responsible clinician and confirm critical-result escalation.",
            f"Critical status/name tokens detected; examples: {sample}.",
            "lab_tests.status",
        ))
        modules_with_alerts.add("Lab")

    invoices = _filter_owner(db.query(models.Invoice), models.Invoice, owner_id).all()
    total_revenue = sum((invoice.amount or Decimal("0")) for invoice in invoices)
    unpaid_total = sum((invoice.due_amount or Decimal("0")) for invoice in invoices)
    unpaid_count = sum(1 for invoice in invoices if (invoice.due_amount or Decimal("0")) > 0)
    if invoices and unpaid_total > 0:
        unpaid_ratio = float(unpaid_total / total_revenue) if total_revenue else 1.0
        if unpaid_ratio >= 0.25 or unpaid_count >= 5:
            severity = "critical" if unpaid_ratio >= 0.5 else "warning"
            insights.append(_insight(
                "revenue-anomaly-unpaid",
                "Advanced Analytics",
                "Billing",
                severity,
                "Revenue collection anomaly",
                f"{unpaid_count} invoices have pending dues totaling INR {unpaid_total:,.0f}.",
                "Review pending collections and expected payment dates before month-end close.",
                f"Pending dues are {unpaid_ratio:.0%} of billed revenue; warning threshold is 25%.",
                "invoices.due_amount",
            ))
            modules_with_alerts.add("Billing")

    if include_health:
        health_checks = [
            (
                "bed-occupancy-healthy",
                "Hospital Management System",
                "Beds",
                "Bed occupancy normal",
                f"{occupied_beds} of {total_beds} beds are occupied." if total_beds else "No beds are configured yet.",
                "Continue monitoring bed status and admission pressure.",
                "No occupancy pressure alert is active.",
                "beds.status",
            ),
            (
                "inventory-reorder-healthy",
                "Advanced Analytics",
                "Inventory",
                "Inventory stock normal",
                "No general inventory items are currently below the AI reorder threshold.",
                "Continue routine stock review and procurement planning.",
                "No low-stock inventory alert is active.",
                "inventory.stock",
            ),
            (
                "pharmacy-reorder-healthy",
                "Pharmacy Management",
                "Pharmacy",
                "Medicine stock normal",
                "No medicines are currently below the AI reorder threshold.",
                "Continue routine pharmacy stock and expiry checks.",
                "No low-stock medicine alert is active.",
                "medicines.stock",
            ),
            (
                "lab-critical-healthy",
                "Lab Management",
                "Lab",
                "No critical lab flags",
                "No lab workflows currently contain critical, abnormal, or urgent flags.",
                "Continue standard result review and escalation procedures.",
                "No critical lab token is active.",
                "lab_tests.status",
            ),
            (
                "revenue-anomaly-healthy",
                "Advanced Analytics",
                "Billing",
                "Revenue collection stable",
                "Pending dues are below the configured anomaly threshold.",
                "Continue normal billing and collection follow-up.",
                "No revenue anomaly alert is active.",
                "invoices.due_amount",
            ),
        ]
        for health in health_checks:
            insight_id, product, module_name, title, message, recommendation, trigger, source = health
            if module_name not in modules_with_alerts:
                insights.append(_insight(
                    insight_id,
                    product,
                    module_name,
                    "info",
                    title,
                    message,
                    recommendation,
                    trigger,
                    source,
                ))

    if module:
        module_key = module.lower()
        insights = [insight for insight in insights if insight.module.lower() == module_key]

    return insights
