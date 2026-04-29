import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import API_PREFIX
from app.main import app
from app.routers import invoices as invoices_router
from app.services.invoice_delivery import InvoiceDeliveryError


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
async def test_send_paid_invoice_email_success(client: AsyncClient, auth_headers: dict, monkeypatch):
    monkeypatch.setattr(
        invoices_router,
        "send_invoice_email",
        lambda invoice, recipient_email: f"Invoice {invoice.invoice_code} emailed to {recipient_email}.",
    )

    create_response = await client.post(
        f"{API_PREFIX}/invoices",
        headers=auth_headers,
        json={
            "patient_name": "John Doe",
            "invoice_date": "2026-04-29",
            "amount": 2500,
            "status": "Pending",
            "payment_method": "Card",
        },
    )
    assert create_response.status_code == 201
    invoice_id = create_response.json()["id"]

    response = await client.post(
        f"{API_PREFIX}/invoices/{invoice_id}/send-paid-email",
        headers=auth_headers,
        json={
            "patient_name": "John Doe",
            "amount": 2500,
            "status": "Paid",
            "payment_method": "Card",
            "recipient_email": "john@example.com",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email_sent"] is True
    assert payload["invoice"]["status"] == "Paid"
    assert "john@example.com" in payload["message"]


@pytest.mark.asyncio
async def test_send_paid_invoice_email_failure_still_updates_invoice(
    client: AsyncClient,
    auth_headers: dict,
    monkeypatch,
):
    def fail_delivery(invoice, recipient_email):
        raise InvoiceDeliveryError("SMTP connection failed.")

    monkeypatch.setattr(invoices_router, "send_invoice_email", fail_delivery)

    create_response = await client.post(
        f"{API_PREFIX}/invoices",
        headers=auth_headers,
        json={
            "patient_name": "Jane Smith",
            "invoice_date": "2026-04-29",
            "amount": 1800,
            "status": "Pending",
            "payment_method": "UPI",
        },
    )
    assert create_response.status_code == 201
    invoice_id = create_response.json()["id"]

    response = await client.post(
        f"{API_PREFIX}/invoices/{invoice_id}/send-paid-email",
        headers=auth_headers,
        json={
            "patient_name": "Jane Smith",
            "amount": 1800,
            "status": "Paid",
            "payment_method": "UPI",
            "recipient_email": "jane@example.com",
        },
    )

    assert response.status_code == 200
    payload = response.json()
    assert payload["email_sent"] is False
    assert payload["invoice"]["status"] == "Paid"
    assert "email delivery failed" in payload["message"].lower()
