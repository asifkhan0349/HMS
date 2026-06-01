import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import API_PREFIX

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def admin_token(client: AsyncClient) -> str:
    """Log in as the seeded Admin user and return a valid Bearer token."""
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": "admin_hms",
        "password": "ham33dSh@ika7m1n4m5",
    })
    return resp.json()["token"]


@pytest_asyncio.fixture
async def nurse_token(client: AsyncClient, admin_token: str) -> str:
    """Admin creates a Nurse user, then we log in as that Nurse and return a valid Bearer token."""
    username = "nurse_ambulance_test"
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Admin creates the Nurse user (ignore status/conflict if already exists)
    await client.post(f"{API_PREFIX}/auth/create-user", json={
        "full_name": "Nurse User",
        "username": username,
        "email": "nurse_amb@hms.test",
        "password": "StrongPass123!",
        "role": "Nurse",
    }, headers=headers)
    # Log in as Nurse
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": username,
        "password": "StrongPass123!",
    })
    return resp.json()["token"]


@pytest_asyncio.fixture
async def doctor_token(client: AsyncClient, admin_token: str) -> str:
    """Admin creates a Doctor user, then we log in as that Doctor and return a valid Bearer token."""
    username = "doctor_ambulance_test"
    headers = {"Authorization": f"Bearer {admin_token}"}
    # Admin creates the Doctor user (ignore status/conflict if already exists)
    await client.post(f"{API_PREFIX}/auth/create-user", json={
        "full_name": "Doctor User",
        "username": username,
        "email": "doctor_amb@hms.test",
        "password": "StrongPass123!",
        "role": "Doctor",
    }, headers=headers)
    # Log in as Doctor
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": username,
        "password": "StrongPass123!",
    })
    return resp.json()["token"]


@pytest.mark.asyncio
async def test_ambulance_crud_as_admin(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. CREATE
    payload = {
        "vehicle_number": "AMB-TEST-001",
        "type": "ALS",
        "status": "Available",
        "driver_name": "John Driver",
        "driver_contact": "555-0199",
        "paramedic_name": "Jane Medic",
        "equipment_checklist": "Oxygen, AED, First Aid",
    }
    resp = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=headers)
    assert resp.status_code == 201
    created_data = resp.json()
    assert created_data["vehicle_number"] == payload["vehicle_number"]
    assert "ambulance_code" in created_data
    assert created_data["ambulance_code"].startswith("AMB-")
    ambulance_id = created_data["id"]

    # 2. READ LIST
    resp = await client.get(f"{API_PREFIX}/ambulances", headers=headers)
    assert resp.status_code == 200
    ambulances = resp.json()
    assert any(a["id"] == ambulance_id for a in ambulances)

    # 3. UPDATE
    update_payload = {
        "status": "Dispatched",
        "current_trip_patient": "John Doe",
        "current_trip_destination": "123 Main St",
    }
    resp = await client.put(f"{API_PREFIX}/ambulances/{ambulance_id}", json=update_payload, headers=headers)
    assert resp.status_code == 200
    updated_data = resp.json()
    assert updated_data["status"] == "Dispatched"
    assert updated_data["current_trip_patient"] == "John Doe"
    assert updated_data["current_trip_destination"] == "123 Main St"

    # 4. DELETE
    resp = await client.delete(f"{API_PREFIX}/ambulances/{ambulance_id}", headers=headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_ambulance_duplicate_vehicle_number(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    payload = {
        "vehicle_number": "AMB-DUP-999",
        "type": "BLS",
        "status": "Available",
    }
    # Create first time
    resp = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=headers)
    assert resp.status_code == 201
    amb_id = resp.json()["id"]

    # Try creating with duplicate vehicle_number
    resp2 = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=headers)
    assert resp2.status_code == 400
    assert "already exists" in resp2.json()["detail"]

    # Cleanup
    await client.delete(f"{API_PREFIX}/ambulances/{amb_id}", headers=headers)


@pytest.mark.asyncio
async def test_ambulance_nurse_permissions(client: AsyncClient, nurse_token: str, admin_token: str):
    # Nurse headers
    nurse_headers = {"Authorization": f"Bearer {nurse_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Nurse can CREATE
    payload = {
        "vehicle_number": "AMB-NURSE-01",
        "type": "Patient Transport",
        "status": "Available",
    }
    resp = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=nurse_headers)
    assert resp.status_code == 201
    ambulance_id = resp.json()["id"]

    # 2. Nurse can READ
    resp = await client.get(f"{API_PREFIX}/ambulances", headers=nurse_headers)
    assert resp.status_code == 200

    # 3. Nurse can UPDATE
    update_payload = {"status": "Maintenance"}
    resp = await client.put(f"{API_PREFIX}/ambulances/{ambulance_id}", json=update_payload, headers=nurse_headers)
    assert resp.status_code == 200

    # 4. Nurse CANNOT DELETE (should receive 403 Forbidden)
    resp = await client.delete(f"{API_PREFIX}/ambulances/{ambulance_id}", headers=nurse_headers)
    assert resp.status_code == 403

    # Cleanup using Admin
    resp = await client.delete(f"{API_PREFIX}/ambulances/{ambulance_id}", headers=admin_headers)
    assert resp.status_code == 200


@pytest.mark.asyncio
async def test_ambulance_doctor_unauthorized(client: AsyncClient, doctor_token: str, admin_token: str):
    doctor_headers = {"Authorization": f"Bearer {doctor_token}"}
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Pre-create an ambulance as admin
    payload = {
        "vehicle_number": "AMB-DOC-UNAUTH",
        "type": "ALS",
        "status": "Available",
    }
    resp = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=admin_headers)
    assert resp.status_code == 201
    ambulance_id = resp.json()["id"]

    # 1. Doctor cannot READ
    resp = await client.get(f"{API_PREFIX}/ambulances", headers=doctor_headers)
    assert resp.status_code == 403

    # 2. Doctor cannot CREATE
    resp = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=doctor_headers)
    assert resp.status_code == 403

    # 3. Doctor cannot UPDATE
    resp = await client.put(f"{API_PREFIX}/ambulances/{ambulance_id}", json={"status": "Maintenance"}, headers=doctor_headers)
    assert resp.status_code == 403

    # 4. Doctor cannot DELETE
    resp = await client.delete(f"{API_PREFIX}/ambulances/{ambulance_id}", headers=doctor_headers)
    assert resp.status_code == 403

    # Cleanup
    await client.delete(f"{API_PREFIX}/ambulances/{ambulance_id}", headers=admin_headers)


@pytest.mark.asyncio
async def test_ambulance_trip_creation_on_complete_trip(client: AsyncClient, admin_token: str):
    headers = {"Authorization": f"Bearer {admin_token}"}

    # 1. Create an ambulance
    payload = {
        "vehicle_number": "AMB-TRIP-TEST",
        "type": "ALS",
        "status": "Available",
    }
    resp = await client.post(f"{API_PREFIX}/ambulances", json=payload, headers=headers)
    assert resp.status_code == 201
    amb_id = resp.json()["id"]

    # 2. Dispatch the ambulance
    dispatch_payload = {
        "status": "Dispatched",
        "current_trip_patient": "Test Patient",
        "current_trip_destination": "Test Destination",
    }
    resp = await client.put(f"{API_PREFIX}/ambulances/{amb_id}", json=dispatch_payload, headers=headers)
    assert resp.status_code == 200

    # 3. Complete the trip (change status back to Available)
    complete_payload = {
        "status": "Available",
        "current_trip_patient": None,
        "current_trip_destination": None,
    }
    resp = await client.put(f"{API_PREFIX}/ambulances/{amb_id}", json=complete_payload, headers=headers)
    assert resp.status_code == 200

    # 4. Fetch trips and assert the trip was logged
    resp = await client.get(f"{API_PREFIX}/ambulances/trips", headers=headers)
    assert resp.status_code == 200
    trips = resp.json()
    assert len(trips) > 0
    
    # Check that our test trip is logged
    test_trip = next((t for t in trips if t["vehicle_number"] == "AMB-TRIP-TEST"), None)
    assert test_trip is not None
    assert test_trip["patient_name"] == "Test Patient"
    assert test_trip["destination"] == "Test Destination"
    assert test_trip["ambulance_id"] == amb_id

    # Cleanup ambulance
    await client.delete(f"{API_PREFIX}/ambulances/{amb_id}", headers=headers)

