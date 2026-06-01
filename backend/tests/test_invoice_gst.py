import pytest
import pytest_asyncio
from decimal import Decimal
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import API_PREFIX
from app.core.database import SessionLocal
from app import models

VALID_ADMIN = {"username": "admin_hms", "password": "ham33dSh@ika7m1n4m5"}

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    response = await client.post(f"{API_PREFIX}/auth/login", json=VALID_ADMIN)
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_create_and_update_invoice_gst(client: AsyncClient, auth_headers: dict):
    # 1. Create Invoice with CGST + SGST (Intra-state)
    payload_intra = {
        "patient_name": "GST Intra State Patient",
        "billing_type": "OP",
        "invoice_date": "2026-05-22",
        "amount": 1180.00,
        "amount_paid": 1180.00,
        "due_amount": 0.00,
        "tax_total": 180.00,
        "discount_total": 0.00,
        "cgst": 90.00,
        "sgst": 90.00,
        "igst": 0.00,
        "status": "Paid",
        "payment_method": "Cash",
        "payment_status": "Paid",
        "line_items": [
            {
                "category": "Consultation",
                "name": "General Checkup",
                "quantity": 1,
                "unit_price": 1000.00,
                "tax_percentage": 18.00,
                "discount_percentage": 0.00,
                "subtotal": 1000.00,
                "tax_amount": 180.00,
                "discount_amount": 0.00,
                "total": 1180.00
            }
        ]
    }
    
    response = await client.post(f"{API_PREFIX}/invoices", json=payload_intra, headers=auth_headers)
    assert response.status_code == 201
    res_data = response.json()
    invoice_id = res_data["id"]
    
    # Assert return fields
    assert Decimal(str(res_data["cgst"])) == Decimal("90.00")
    assert Decimal(str(res_data["sgst"])) == Decimal("90.00")
    assert Decimal(str(res_data["igst"])) == Decimal("0.00")
    assert Decimal(str(res_data["tax_total"])) == Decimal("180.00")
    
    # Verify in DB directly
    db = SessionLocal()
    try:
        db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        assert db_invoice is not None
        assert db_invoice.cgst == Decimal("90.00")
        assert db_invoice.sgst == Decimal("90.00")
        assert db_invoice.igst == Decimal("0.00")
        assert db_invoice.tax_total == Decimal("180.00")
    finally:
        db.close()

    # 2. Create Invoice with IGST (Inter-state)
    payload_inter = {
        "patient_name": "GST Inter State Patient",
        "billing_type": "OP",
        "invoice_date": "2026-05-22",
        "amount": 1180.00,
        "amount_paid": 1180.00,
        "due_amount": 0.00,
        "tax_total": 180.00,
        "discount_total": 0.00,
        "cgst": 0.00,
        "sgst": 0.00,
        "igst": 180.00,
        "status": "Paid",
        "payment_method": "Cash",
        "payment_status": "Paid",
        "line_items": [
            {
                "category": "Consultation",
                "name": "General Checkup",
                "quantity": 1,
                "unit_price": 1000.00,
                "tax_percentage": 18.00,
                "discount_percentage": 0.00,
                "subtotal": 1000.00,
                "tax_amount": 180.00,
                "discount_amount": 0.00,
                "total": 1180.00
            }
        ]
    }
    
    response2 = await client.post(f"{API_PREFIX}/invoices", json=payload_inter, headers=auth_headers)
    assert response2.status_code == 201
    res_data2 = response2.json()
    invoice2_id = res_data2["id"]
    
    assert Decimal(str(res_data2["cgst"])) == Decimal("0.00")
    assert Decimal(str(res_data2["sgst"])) == Decimal("0.00")
    assert Decimal(str(res_data2["igst"])) == Decimal("180.00")
    assert Decimal(str(res_data2["tax_total"])) == Decimal("180.00")

    # 3. Update Invoice manually (simulate modal edit)
    update_payload = {
        "cgst": 100.00,
        "sgst": 100.00,
        "igst": 0.00,
        "tax_total": 200.00,
        "amount": 1200.00
    }
    response3 = await client.put(f"{API_PREFIX}/invoices/{invoice_id}", json=update_payload, headers=auth_headers)
    assert response3.status_code == 200
    res_data3 = response3.json()
    
    assert Decimal(str(res_data3["cgst"])) == Decimal("100.00")
    assert Decimal(str(res_data3["sgst"])) == Decimal("100.00")
    assert Decimal(str(res_data3["igst"])) == Decimal("0.00")
    assert Decimal(str(res_data3["tax_total"])) == Decimal("200.00")
    assert Decimal(str(res_data3["amount"])) == Decimal("1200.00")

    # 4. Download PDF and check that it generates correctly
    pdf_response = await client.get(f"{API_PREFIX}/invoices/{invoice_id}/download-pdf", headers=auth_headers)
    assert pdf_response.status_code == 200
    assert pdf_response.headers.get("content-type") == "application/pdf"
    assert len(pdf_response.content) > 0


@pytest.mark.asyncio
async def test_create_partial_invoice_expected_payment_date(client: AsyncClient, auth_headers: dict):
    # 1. Create Partial Invoice with expected_payment_date
    payload = {
        "patient_name": "Partial Payment Patient",
        "billing_type": "OP",
        "invoice_date": "2026-05-22",
        "amount": 1000.00,
        "amount_paid": 400.00,
        "due_amount": 600.00,
        "tax_total": 0.00,
        "discount_total": 0.00,
        "cgst": 0.00,
        "sgst": 0.00,
        "igst": 0.00,
        "status": "Partially Paid",
        "payment_method": "Cash",
        "payment_status": "Partial",
        "expected_payment_date": "2026-06-15",
        "line_items": [
            {
                "category": "Consultation",
                "name": "General Checkup",
                "quantity": 1,
                "unit_price": 1000.00,
                "tax_percentage": 0.00,
                "discount_percentage": 0.00,
                "subtotal": 1000.00,
                "tax_amount": 0.00,
                "discount_amount": 0.00,
                "total": 1000.00
            }
        ]
    }
    
    response = await client.post(f"{API_PREFIX}/invoices", json=payload, headers=auth_headers)
    assert response.status_code == 201
    res_data = response.json()
    invoice_id = res_data["id"]
    
    # Assert expected_payment_date is saved and returned
    assert res_data["expected_payment_date"] == "2026-06-15"
    
    # Verify in DB
    db = SessionLocal()
    try:
        db_invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
        assert db_invoice is not None
        assert db_invoice.expected_payment_date.isoformat() == "2026-06-15"
    finally:
        db.close()

    # 2. Update expected_payment_date
    update_payload = {
        "expected_payment_date": "2026-06-20",
        "amount_paid": 500.00,
        "due_amount": 500.00
    }
    response2 = await client.put(f"{API_PREFIX}/invoices/{invoice_id}", json=update_payload, headers=auth_headers)
    assert response2.status_code == 200
    res_data2 = response2.json()
    assert res_data2["expected_payment_date"] == "2026-06-20"
    
    # 3. Pay fully, expect expected_payment_date to be set to null
    pay_full_payload = {
        "amount_paid": 1000.00,
        "due_amount": 0.00,
        "status": "Paid",
        "expected_payment_date": None
    }
    response3 = await client.put(f"{API_PREFIX}/invoices/{invoice_id}", json=pay_full_payload, headers=auth_headers)
    assert response3.status_code == 200
    res_data3 = response3.json()
    assert res_data3["expected_payment_date"] is None
