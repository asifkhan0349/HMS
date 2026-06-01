from fastapi import APIRouter, Depends, HTTPException

from .. import schemas
from ..auth_context import get_current_user
from ..models import User

router = APIRouter(
    prefix="/products",
    tags=["products"],
    dependencies=[Depends(get_current_user)],
)

_ALL_ROLES = ["Admin", "Doctor", "Nurse", "Patient", "Reception", "Pharmacist", "Lab Technician", "Accountant"]

_PRODUCTS = [
    {
        "id": "pharmacy",
        "title": "Pharmacy Management",
        "status": "Operational shell",
        "summary": "Stock, expiry, dispensing, reorder risk, and pharmacy revenue operations.",
        "allowed_roles": ["Admin", "Pharmacist"],
        "connected_routes": ["/pharmacy", "/billing", "/reports"],
        "metrics": ["Medicine stock", "Expiry risk", "Reorder queue", "Dispensing revenue"],
    },
    {
        "id": "clinic",
        "title": "Clinic Management",
        "status": "Operational shell",
        "summary": "Appointments, OPD flow, consultations, patient records, and clinic collections.",
        "allowed_roles": ["Admin", "Doctor", "Reception"],
        "connected_routes": ["/appointments", "/patients", "/billing", "/doctor-calendar"],
        "metrics": ["Today appointments", "Consultation flow", "Follow-ups", "Collections"],
    },
    {
        "id": "lab",
        "title": "Lab Management",
        "status": "Operational shell",
        "summary": "Diagnostic orders, report progress, critical-value review, and lab revenue.",
        "allowed_roles": ["Admin", "Doctor", "Lab Technician"],
        "connected_routes": ["/lab", "/patients", "/billing", "/reports"],
        "metrics": ["Pending tests", "Critical flags", "Completed reports", "Lab revenue"],
    },
    {
        "id": "doctor-app",
        "title": "Doctor App",
        "status": "Operational shell",
        "summary": "Doctor schedule, patient history, EMR notes, and clinical alerts.",
        "allowed_roles": ["Admin", "Doctor"],
        "connected_routes": ["/doctor-calendar", "/patients", "/emr"],
        "metrics": ["Today schedule", "Patient history", "Open notes", "Critical alerts"],
    },
    {
        "id": "hms",
        "title": "Hospital Management System",
        "status": "Live core",
        "summary": "Full hospital operations across clinical, facility, financial, and logistics teams.",
        "allowed_roles": _ALL_ROLES,
        "connected_routes": ["/dashboard", "/patients", "/appointments", "/beds", "/billing"],
        "metrics": ["Admissions", "Beds", "Revenue", "Clinical queue"],
    },
    {
        "id": "distribution",
        "title": "Medical Distribution ERP",
        "status": "Planned module",
        "summary": "Purchase orders, dispatch planning, supplier stock, and receivables.",
        "allowed_roles": ["Admin", "Accountant"],
        "connected_routes": ["/inventory", "/billing", "/reports"],
        "metrics": ["Purchase orders", "Dispatches", "Supplier stock", "Receivables"],
    },
    {
        "id": "equipment",
        "title": "Medical Equipment ERP",
        "status": "Planned module",
        "summary": "Equipment assets, serial numbers, warranties, service, rentals, and maintenance.",
        "allowed_roles": ["Admin"],
        "connected_routes": ["/inventory", "/reports"],
        "metrics": ["Asset register", "Warranty status", "Maintenance due", "Rental usage"],
    },
    {
        "id": "supplier",
        "title": "Supplier ERP",
        "status": "Planned module",
        "summary": "Supplier catalog, stock commitment, fulfillment status, and payments.",
        "allowed_roles": ["Admin", "Accountant"],
        "connected_routes": ["/inventory", "/billing", "/reports"],
        "metrics": ["Catalog", "Order pipeline", "Committed stock", "Payments"],
    },
    {
        "id": "online-pharmacy",
        "title": "Online Pharmacy",
        "status": "Planned module",
        "summary": "Medicine catalog, prescriptions, carts, orders, delivery status, and notifications.",
        "allowed_roles": ["Admin", "Pharmacist"],
        "connected_routes": ["/pharmacy", "/billing"],
        "metrics": ["Catalog readiness", "Prescription queue", "Orders", "Delivery status"],
    },
    {
        "id": "analytics",
        "title": "Advanced Analytics",
        "status": "Operational shell",
        "summary": "Cross-product reporting, AI insights, revenue, operations, patient flow, and inventory risk.",
        "allowed_roles": ["Admin", "Accountant"],
        "connected_routes": ["/reports", "/ai-insights"],
        "metrics": ["AI alerts", "Revenue trend", "Patient flow", "Inventory risk"],
    },
]


@router.get("", response_model=list[schemas.ProductModuleRead])
def list_products(user: User = Depends(get_current_user)):
    if user.role == "Admin":
        return _PRODUCTS
    return [product for product in _PRODUCTS if user.role in product["allowed_roles"]]


@router.get("/{product_id}", response_model=schemas.ProductModuleRead)
def get_product(product_id: str, user: User = Depends(get_current_user)):
    for product in _PRODUCTS:
        if product["id"] == product_id:
            if user.role == "Admin" or user.role in product["allowed_roles"]:
                return product
            raise HTTPException(status_code=403, detail="You do not have access to this product module.")
    raise HTTPException(status_code=404, detail="Product module not found.")
