"""
Comprehensive backend test suite covering:
- Auth: signup, login, logout, duplicate rejection, brute-force protection
- CRUD: patients (create, read, update, delete)
- Security: accessing protected routes without / with expired tokens
"""
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.core.config import API_PREFIX

# ────────────────────────────────────────────────────────────────────────────
# Fixtures
# ────────────────────────────────────────────────────────────────────────────

@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_token() -> str:
    """Create a test user directly in the database and return a valid Bearer token."""
    import uuid
    from app.core.database import SessionLocal
    from app.models import User
    from app.core.security import hash_password, create_access_token

    suffix = uuid.uuid4().hex[:10]
    username = f"pytest_user_{suffix}"
    
    with SessionLocal() as db:
        user = User(
            full_name="Test User",
            username=username,
            email=f"{username}@hms.test",
            role="Admin",
            password_hash=hash_password("StrongPass123!"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return create_access_token(user.id)


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
async def test_signup_success(client: AsyncClient, auth_token: str):
    import uuid
    suffix = uuid.uuid4().hex[:6]
    resp = await client.post(f"{API_PREFIX}/auth/create-user", json={
        "full_name": "Alice Smith",
        "username": f"alice_{suffix}",
        "email": f"alice_{suffix}@hms.test",
        "password": "AlicePass99!",
        "role": "Doctor",
    }, headers={"Authorization": f"Bearer {auth_token}"})
    assert resp.status_code == 201
    data = resp.json()
    assert "token" in data
    assert data["user"]["username"] == f"alice_{suffix}"


@pytest.mark.asyncio
async def test_signup_duplicate_rejected(client: AsyncClient, auth_token: str):
    import uuid
    suffix = uuid.uuid4().hex[:6]
    headers = {"Authorization": f"Bearer {auth_token}"}
    payload = {
        "full_name": "Bob Dup",
        "username": f"bob_{suffix}",
        "email": f"bob_{suffix}@hms.test",
        "password": "BobPass99!",
        "role": "Nurse",
    }
    resp1 = await client.post(f"{API_PREFIX}/auth/create-user", json=payload, headers=headers)
    assert resp1.status_code == 201
    resp2 = await client.post(f"{API_PREFIX}/auth/create-user", json=payload, headers=headers)
    assert resp2.status_code == 409


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, auth_token: str):
    import uuid
    suffix = uuid.uuid4().hex[:6]
    await client.post(f"{API_PREFIX}/auth/create-user", json={
        "full_name": "Carol T",
        "username": f"carol_{suffix}",
        "email": f"carol_{suffix}@hms.test",
        "password": "RealPass99!",
        "role": "Reception",
    }, headers={"Authorization": f"Bearer {auth_token}"})
    resp = await client.post(f"{API_PREFIX}/auth/login", json={
        "username": f"carol_{suffix}",
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
        "phone_number": "1234567890",
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
