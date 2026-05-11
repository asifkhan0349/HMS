import uuid

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.config import API_PREFIX
from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models import User


def _create_user_and_token(role: str) -> str:
    suffix = uuid.uuid4().hex[:10]
    username = f"{role.lower()}_{suffix}"

    with SessionLocal() as db:
        user = User(
            full_name=f"{role} Shared Pharmacy",
            username=username,
            email=f"{username}@hms.test",
            role=role,
            password_hash=hash_password("StrongPass123!"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        return create_access_token(user.id)


@pytest.mark.asyncio
async def test_pharmacy_entries_are_shared_across_admin_nurse_reception():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tokens = {
            role: _create_user_and_token(role)
            for role in ("Admin", "Nurse", "Reception")
        }

        created_codes = []
        batch_suffix = uuid.uuid4().hex[:8]
        for role, token in tokens.items():
            response = await client.post(
                f"{API_PREFIX}/medicines",
                json={
                    "name": f"{role} Shared Medicine {batch_suffix}",
                    "batch": f"SH-{role[:3].upper()}-{batch_suffix}",
                    "stock": 12,
                    "price": "10.00",
                    "expiry_date": "2031-12-31",
                    "status": "In Stock",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 201
            created_codes.append(response.json()["medicine_code"])

        for role, token in tokens.items():
            response = await client.get(
                f"{API_PREFIX}/medicines",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            visible_codes = {medicine["medicine_code"] for medicine in response.json()}
            assert set(created_codes).issubset(visible_codes), role
