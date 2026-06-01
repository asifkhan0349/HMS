import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.core.config import API_PREFIX
from app.core.database import SessionLocal
from app.core.security import create_access_token, hash_password
from app.main import app
from app.models import User


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers():
    import uuid

    suffix = uuid.uuid4().hex[:10]
    with SessionLocal() as db:
        user = User(
            full_name="AI Insight Tester",
            username=f"ai_insight_{suffix}",
            email=f"ai_insight_{suffix}@hms.test",
            role="Admin",
            password_hash=hash_password("StrongPass123!"),
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        token = create_access_token(user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.asyncio
async def test_ai_insights_health_scan_returns_modules(client: AsyncClient, auth_headers: dict):
    response = await client.get(f"{API_PREFIX}/ai-insights?include_health=true", headers=auth_headers)
    assert response.status_code == 200
    insights = response.json()
    assert len(insights) >= 5
    assert {"Beds", "Inventory", "Pharmacy", "Lab", "Billing"}.issubset(
        {insight["module"] for insight in insights}
    )
