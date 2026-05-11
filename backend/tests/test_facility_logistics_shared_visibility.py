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
    username = f"{role.lower()}_facility_{suffix}"

    with SessionLocal() as db:
        user = User(
            full_name=f"{role} Shared Facility",
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
async def test_beds_are_shared_across_admin_nurse_reception():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        tokens = {
            role: _create_user_and_token(role)
            for role in ("Admin", "Nurse", "Reception")
        }

        created_numbers = []
        batch_suffix = uuid.uuid4().hex[:8]
        for role, token in tokens.items():
            response = await client.post(
                f"{API_PREFIX}/beds",
                json={
                    "bed_number": f"BED-{role[:3].upper()}-{batch_suffix}",
                    "ward_name": "General Ward",
                    "type": "Standard",
                    "status": "Available",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 201
            created_numbers.append(response.json()["bed_number"])

        for role, token in tokens.items():
            response = await client.get(
                f"{API_PREFIX}/beds",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            visible_numbers = {bed["bed_number"] for bed in response.json()}
            assert set(created_numbers).issubset(visible_numbers), role


@pytest.mark.asyncio
async def test_inventory_items_are_shared_across_admin_nurse_reception():
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
                f"{API_PREFIX}/inventory",
                json={
                    "item_code": f"LOG-{role[:3].upper()}-{batch_suffix}",
                    "name": f"{role} Shared Supply {batch_suffix}",
                    "category": "General",
                    "stock": 12,
                    "unit": "Units",
                    "status": "In Stock",
                },
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 201
            created_codes.append(response.json()["item_code"])

        for role, token in tokens.items():
            response = await client.get(
                f"{API_PREFIX}/inventory",
                headers={"Authorization": f"Bearer {token}"},
            )
            assert response.status_code == 200
            visible_codes = {item["item_code"] for item in response.json()}
            assert set(created_codes).issubset(visible_codes), role
