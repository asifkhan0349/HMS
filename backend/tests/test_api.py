import pytest
from httpx import AsyncClient, ASGITransport
from app.main import app
from app.config import API_PREFIX

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get(f"{API_PREFIX}/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

@pytest.mark.asyncio
async def test_auth_status_unauthorized(client: AsyncClient):
    # This should fail with 401 as we haven't provided a token
    response = await client.get(f"{API_PREFIX}/patients")
    assert response.status_code == 401
