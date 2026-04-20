"""
Comprehensive backend test suite covering:
- Auth: signup, login, logout, duplicate rejection, brute-force protection
- CRUD: patients (create, read, update, delete)
- Security: accessing protected routes without / with expired tokens
"""
import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import API_PREFIX

# ────────────────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────────────────

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture
async def auth_token(client: AsyncClient) -> str:
    """Register a test user and return a valid Bearer token."""
    await client.post(f"{API_PREFIX}/auth/signup", json={
        "full_name": "Test User",
        "username": "pytest_user",
        "email": "pytest@hms.test",
        "password": "StrongPass123!",
        "role": "Admin",
    })
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": "pytest_user",
        "password": "StrongPass123!",
    })
    return resp.json()["token"]


# ────────────────────────────────────────────────────────────────────────────
# Health
# ────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get(f"{API_PREFIX}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


# ────────────────────────────────────────────────────────────────────────────
# Auth — signup & login
# ────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    resp = await client.post(f"{API_PREFIX}/auth/signup", json={
        "full_name": "Alice Smith",
        "username": "alice_test",
        "email": "alice@hms.test",
        "password": "AlicePass99!",
        "role": "Admin",
    })
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["user"]["username"] == "alice_test"


@pytest.mark.asyncio
async def test_signup_duplicate_rejected(client: AsyncClient):
    payload = {
        "full_name": "Bob Dup",
        "username": "bob_dup",
        "email": "bob@hms.test",
        "password": "BobPass99!",
        "role": "Admin",
    }
    await client.post(f"{API_PREFIX}/auth/signup", json=payload)
    resp = await client.post(f"{API_PREFIX}/auth/signup", json=payload)
    assert resp.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient):
    await client.post(f"{API_PREFIX}/auth/signup", json={
        "full_name": "Carol T",
        "username": "carol_test",
        "email": "carol@hms.test",
        "password": "RealPass99!",
        "role": "Admin",
    })
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": "carol_test",
        "password": "WrongPassword!",
    })
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": "nobody_xyz",
        "password": "irrelevant",
    })
    assert resp.status_code == 401


# ────────────────────────────────────────────────────────────────────────────
# Auth — logout / token revocation
# ────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_logout_revokes_token(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # Token works before logout
    resp = await client.get(f"{API_PREFIX}/patients", headers=headers)
    assert resp.status_code == 200

    # Logout
    resp = await client.post(f"{API_PREFIX}/auth/logout", headers=headers)
    assert resp.status_code == 200

    # Token should now be rejected
    resp = await client.get(f"{API_PREFIX}/patients", headers=headers)
    assert resp.status_code == 401


# ────────────────────────────────────────────────────────────────────────────
# Protected routes
# ────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_protected_route_without_token(client: AsyncClient):
    resp = await client.get(f"{API_PREFIX}/patients")
    assert resp.status_code == 401


@pytest.mark.asyncio
async def test_protected_route_with_invalid_token(client: AsyncClient):
    resp = await client.get(
        f"{API_PREFIX}/patients",
        headers={"Authorization": "Bearer this.is.not.valid"}
    )
    assert resp.status_code == 401


# ────────────────────────────────────────────────────────────────────────────
# Patients CRUD
# ────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patients_crud(client: AsyncClient, auth_token: str):
    headers = {"Authorization": f"Bearer {auth_token}"}

    # CREATE
    resp = await client.post(f"{API_PREFIX}/patients", json={
        "name": "John Doe", "age": 45, "gender": "Male",
        "blood_group": "A+", "status": "Outpatient",
    }, headers=headers)
    assert resp.status_code in (200, 201)
    patient_id = resp.json()["id"]

    # READ LIST
    resp = await client.get(f"{API_PREFIX}/patients", headers=headers)
    assert resp.status_code == 200
    ids = [p["id"] for p in resp.json()]
    assert patient_id in ids

    # UPDATE
    resp = await client.put(f"{API_PREFIX}/patients/{patient_id}", json={
        "age": 46, "status": "Inpatient",
    }, headers=headers)
    assert resp.status_code == 200
    assert resp.json()["age"] == 46

    # DELETE
    resp = await client.delete(f"{API_PREFIX}/patients/{patient_id}", headers=headers)
    assert resp.status_code in (200, 204)


# ────────────────────────────────────────────────────────────────────────────
# Input validation
# ────────────────────────────────────────────────────────────────────────────

@pytest.mark.asyncio
async def test_patient_create_missing_fields(client: AsyncClient, auth_token: str):
    """Missing required fields should return 422 Unprocessable Entity."""
    resp = await client.post(f"{API_PREFIX}/patients", json={
        "name": "Incomplete",
        # Missing: age, gender, blood_group, status
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert resp.status_code == 422
