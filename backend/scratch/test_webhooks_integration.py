import pytest
import pytest_asyncio
import unittest.mock as mock
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import API_PREFIX

VALID_ADMIN = {"username": "admin_hms", "password": "ham33dSh@ika7m1n4m5"}

@pytest.fixture(scope="module")
def anyio_backend():
    return "asyncio"

@pytest_asyncio.fixture(scope="module")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="module")
async def auth_headers(client: AsyncClient):
    response = await client.post(f"{API_PREFIX}/auth/login", json=VALID_ADMIN)
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.mark.asyncio
async def test_webhook_dispatches(client: AsyncClient, auth_headers: dict):
    # Mock the router webhook dispatch helpers
    mock_app_webhook = mock.AsyncMock()
    mock_lab_webhook = mock.AsyncMock()
    mock_inv_webhook = mock.AsyncMock()
    
    with mock.patch("app.routers.appointments.send_appointment_webhook", mock_app_webhook), \
         mock.patch("app.routers.tests.send_lab_test_webhook", mock_lab_webhook), \
         mock.patch("app.routers.invoices.send_invoice_webhook", mock_inv_webhook):
         
        # 1. Test Appointment webhook on create
        app_payload = {
            "patient_name": "Test Appointment Webhook Patient",
            "patient_age": 30,
            "appointment_date": "2026-12-25",
            "appointment_type": "Consultation",
            "status": "Pending"
        }
        res = await client.post(f"{API_PREFIX}/appointments", json=app_payload, headers=auth_headers)
        assert res.status_code == 201
        app_id = res.json()["id"]
        
        # 2. Test Appointment webhook on update
        res = await client.put(f"{API_PREFIX}/appointments/{app_id}", json={"status": "Confirmed"}, headers=auth_headers)
        assert res.status_code == 200
        
        # 3. Test Lab Test webhook on create
        lab_payload = {
            "patient_name": "Test Lab Webhook Patient",
            "test_name": "Blood sugar",
            "doctor_name": "Dr. Smith",
            "status": "Pending",
            "test_code": "BS-101"
        }
        res = await client.post(f"{API_PREFIX}/tests", json=lab_payload, headers=auth_headers)
        assert res.status_code == 201
        test_id = res.json()["id"]
        
        # 4. Test Lab Test webhook on update
        res = await client.put(f"{API_PREFIX}/tests/{test_id}", json={"status": "Completed"}, headers=auth_headers)
        assert res.status_code == 200
        
        # 5. Test Invoice webhook on create
        invoice_payload = {
            "patient_name": "Test Invoice Webhook Patient",
            "invoice_date": "2026-12-25",
            "amount": 100.00,
            "amount_paid": 0.00,
            "due_amount": 100.00,
            "status": "Pending",
            "payment_method": "Cash",
            "payment_status": "Pending",
            "invoice_code": "INV-WEBHOOK-TEST-1",
            "line_items": []
        }
        res = await client.post(f"{API_PREFIX}/invoices", json=invoice_payload, headers=auth_headers)
        assert res.status_code == 201
        invoice_id = res.json()["id"]
        
        # 6. Test Invoice webhook on update
        res = await client.put(f"{API_PREFIX}/invoices/{invoice_id}", json={"status": "Paid", "amount_paid": 100.00}, headers=auth_headers)
        assert res.status_code == 200
        
        # Give async background tasks a brief moment to run
        await asyncio.sleep(0.5)
        
        # Assert that the mocked webhook functions were called
        assert mock_app_webhook.call_count >= 2  # create + update
        assert mock_lab_webhook.call_count >= 2  # create + update
        assert mock_inv_webhook.call_count >= 2  # create + update
        
        # Clean up created resources
        await client.delete(f"{API_PREFIX}/appointments/{app_id}", headers=auth_headers)
        await client.delete(f"{API_PREFIX}/tests/{test_id}", headers=auth_headers)
        await client.delete(f"{API_PREFIX}/invoices/{invoice_id}", headers=auth_headers)
