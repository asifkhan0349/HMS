import pytest
import asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import API_PREFIX

import pytest_asyncio

# Test data
VALID_ADMIN = {"username": "admin_hms", "password": "ham33dSh@ika7m1n4m5"}
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
    import random
    rand_num = random.randint(1000, 9999)
    payload = {
        "name": f"Integration Test Patient {rand_num}",
        "age": 30,
        "gender": "Female",
        "blood_group": "B+",
        "status": "Inpatient",
        "phone_number": f"123456{rand_num}"
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

@pytest.mark.asyncio
async def test_create_patient_duplicate_booking_id(client: AsyncClient, auth_headers: dict):
    import random
    rand_num = random.randint(1000, 9999)
    booking_id = f"BK-TEST-{rand_num}"
    
    payload1 = {
        "name": f"Booking Test Patient A {rand_num}",
        "age": 25,
        "gender": "Male",
        "blood_group": "A+",
        "status": "Outpatient",
        "phone_number": f"123457{rand_num}",
        "booking_id": booking_id
    }
    response1 = await client.post(f"{API_PREFIX}/patients", json=payload1, headers=auth_headers)
    assert response1.status_code == 201
    
    payload2 = {
        "name": f"Booking Test Patient B {rand_num}",
        "age": 28,
        "gender": "Female",
        "blood_group": "O-",
        "status": "Inpatient",
        "phone_number": f"987654{rand_num}",
        "booking_id": booking_id
    }
    response2 = await client.post(f"{API_PREFIX}/patients", json=payload2, headers=auth_headers)
    assert response2.status_code == 400
    assert "already been registered" in response2.json()["detail"]

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
    update_payload = {"status": "Scheduled"}
    response = await client.put(f"{API_PREFIX}/appointments/{app_id}", json=update_payload, headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["status"] == "Scheduled"

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


# --- BED ASSIGNMENT UNIQUE CONSTRAINT TESTS ---

@pytest.mark.asyncio
async def test_bed_assignment_unique_constraint(client: AsyncClient, auth_headers: dict):
    # 1. Create a patient who will be assigned a bed
    patient_name = "Bed Unique Test Patient"
    
    # 2. Create Bed 1 as Occupied by that patient
    bed1_payload = {
        "ward_name": "ICU",
        "type": "ICU",
        "status": "Occupied",
        "patient_name": patient_name,
        "allotment_reason": "Post-surgery observation",
        "bed_number": "BED-TESTUNIQUE-1"
    }
    res_bed1 = await client.post(f"{API_PREFIX}/beds", json=bed1_payload, headers=auth_headers)
    assert res_bed1.status_code == 201
    bed1_data = res_bed1.json()
    bed1_id = bed1_data["id"]

    try:
        # 3. Try to create Bed 2 as Occupied by the SAME patient (Should Fail!)
        bed2_payload = {
            "ward_name": "General Ward",
            "type": "Standard",
            "status": "Occupied",
            "patient_name": patient_name,
            "allotment_reason": "Minor recovery",
            "bed_number": "BED-TESTUNIQUE-2"
        }
        res_bed2 = await client.post(f"{API_PREFIX}/beds", json=bed2_payload, headers=auth_headers)
        assert res_bed2.status_code == 400
        assert "already assigned" in res_bed2.json()["detail"]

        # 4. Create Bed 2 as Available
        bed2_payload["status"] = "Available"
        bed2_payload["patient_name"] = None
        bed2_payload["allotment_reason"] = None
        res_bed2_avail = await client.post(f"{API_PREFIX}/beds", json=bed2_payload, headers=auth_headers)
        assert res_bed2_avail.status_code == 201
        bed2_id = res_bed2_avail.json()["id"]

        # 5. Try to UPDATE Bed 2 to Occupied by the SAME patient (Should Fail!)
        update_payload = {
            "status": "Occupied",
            "patient_name": patient_name,
            "allotment_reason": "Relocated"
        }
        res_update_fail = await client.put(f"{API_PREFIX}/beds/{bed2_id}", json=update_payload, headers=auth_headers)
        assert res_update_fail.status_code == 400
        assert "already assigned" in res_update_fail.json()["detail"]

        # 6. Try to UPDATE Bed 1 itself (Should Succeed!)
        update_payload_success = {
            "status": "Occupied",
            "patient_name": patient_name,
            "allotment_reason": "Updated Reason"
        }
        res_update_success = await client.put(f"{API_PREFIX}/beds/{bed1_id}", json=update_payload_success, headers=auth_headers)
        assert res_update_success.status_code == 200
        assert res_update_success.json()["allotment_reason"] == "Updated Reason"

    finally:
        # Clean up by deleting the beds created during test
        await client.delete(f"{API_PREFIX}/beds/{bed1_id}", headers=auth_headers)
        if 'bed2_id' in locals():
            await client.delete(f"{API_PREFIX}/beds/{bed2_id}", headers=auth_headers)

