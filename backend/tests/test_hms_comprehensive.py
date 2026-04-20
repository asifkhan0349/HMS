import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import API_PREFIX

import pytest_asyncio

# Test data
VALID_ADMIN = {"username": "admin", "password": "hrmsadmin123"}
INVALID_ADMIN = {"username": "admin", "password": "wrongpassword"}

@pytest_asyncio.fixture(scope="session")
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest_asyncio.fixture(scope="session")
async def auth_headers(client: AsyncClient):
    response = await client.post(f"{API_PREFIX}/auth/login", json=VALID_ADMIN)
    assert response.status_code == 200
    token = response.json()["token"]
    return {"Authorization": f"Bearer {token}"}

# --- AUTH TESTS ---

@pytest.mark.asyncio
async def test_login_success(client: AsyncClient):
    response = await client.post(f"{API_PREFIX}/auth/login", json=VALID_ADMIN)
    assert response.status_code == 200
    assert "token" in response.json()

@pytest.mark.asyncio
async def test_login_failure(client: AsyncClient):
    response = await client.post(f"{API_PREFIX}/auth/login", json=INVALID_ADMIN)
    assert response.status_code == 401

@pytest.mark.asyncio
async def test_unauthorized_access(client: AsyncClient):
    response = await client.get(f"{API_PREFIX}/patients")
    assert response.status_code == 401

# --- PATIENT TESTS ---

@pytest.mark.asyncio
async def test_list_patients(client: AsyncClient, auth_headers: dict):
    response = await client.get(f"{API_PREFIX}/patients", headers=auth_headers)
    assert response.status_code == 200
    assert isinstance(response.json(), list)

@pytest.mark.asyncio
async def test_create_patient_success(client: AsyncClient, auth_headers: dict):
    payload = {
        "name": "Integration Test Patient",
        "age": 30,
        "gender": "Female",
        "blood_group": "B+",
        "status": "Inpatient"
    }
    response = await client.post(f"{API_PREFIX}/patients", json=payload, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == payload["name"]
    return data["id"]

@pytest.mark.asyncio
async def test_get_patient_404(client: AsyncClient, auth_headers: dict):
    response = await client.get(f"{API_PREFIX}/patients/99999", headers=auth_headers)
    assert response.status_code == 404

@pytest.mark.asyncio
async def test_create_patient_validation_error(client: AsyncClient, auth_headers: dict):
    payload = {"age": 30} # Missing name, gender, etc.
    response = await client.post(f"{API_PREFIX}/patients", json=payload, headers=auth_headers)
    assert response.status_code == 422

# --- APPOINTMENT TESTS ---

@pytest.mark.asyncio
async def test_create_appointment_success(client: AsyncClient, auth_headers: dict):
    payload = {
        "patient_name": "John Appointment",
        "patient_age": 40,
        "appointment_date": "2024-12-25",
        "appointment_type": "Consultation",
        "status": "Pending"
    }
    response = await client.post(f"{API_PREFIX}/appointments", json=payload, headers=auth_headers)
    assert response.status_code == 201
    return response.json()["id"]

@pytest.mark.asyncio
async def test_update_appointment_status(client: AsyncClient, auth_headers: dict):
    # First create one
    payload = {
        "patient_name": "Update Test",
        "patient_age": 20,
        "appointment_date": "2024-12-26",
        "appointment_type": "Surgery",
        "status": "Pending"
    }
    res_create = await client.post(f"{API_PREFIX}/appointments", json=payload, headers=auth_headers)
    app_id = res_create.json()["id"]
    
    # Now update it
    update_payload = {"status": "Approved"}
    response = await client.put(f"{API_PREFIX}/appointments/{app_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Approved"

# --- MODULE GET TESTS ---

@pytest.mark.parametrize("endpoint", [
    "records",
    "invoices",
    "medicines",
    "tests",
    "staff",
    "beds",
    "blood_inventory",
    "inventory",
    "dashboard/stats"
])
@pytest.mark.asyncio
async def test_get_endpoints(client: AsyncClient, auth_headers: dict, endpoint: str):
    response = await client.get(f"{API_PREFIX}/{endpoint}", headers=auth_headers)
    assert response.status_code == 200
