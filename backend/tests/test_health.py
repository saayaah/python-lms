from httpx import ASGITransport, AsyncClient

from app.db import Base, engine
from app.main import app


async def setup_db() -> None:
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.create_all)


async def test_health() -> None:
    await setup_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        response = await client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["data"]["status"] == "ok"


async def test_ai_chat_with_valid_token() -> None:
    await setup_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        register = await client.post(
            "/api/v1/auth/register",
            json={"name": "Ada", "email": "ada.ai@example.com", "password": "Password123!"},
        )
        access_token = register.json()["data"]["access_token"]
        response = await client.post(
            "/api/v1/ai/chat",
            json={"message": "Explain list vs tuple", "mode": "socratic"},
            headers={"Authorization": f"Bearer {access_token}"},
        )
    assert response.status_code == 200
    assert "reply" in response.json()["data"]


async def test_dashboard_and_admin_gate() -> None:
    await setup_db()
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        register = await client.post(
            "/api/v1/auth/register",
            json={"name": "Sam", "email": "sam.dashboard@example.com", "password": "Password123!"},
        )
        access_token = register.json()["data"]["access_token"]
        dashboard = await client.get(
            "/api/v1/dashboard",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        restricted = await client.get(
            "/api/v1/admin/overview",
            headers={"Authorization": f"Bearer {access_token}"},
        )
    assert dashboard.status_code == 200
    assert dashboard.json()["data"]["role"] == "student"
    assert restricted.status_code == 403
