import pytest_asyncio

from app.db import Base, engine


@pytest_asyncio.fixture(autouse=True)
async def isolated_database():
    async with engine.begin() as connection:
        await connection.run_sync(Base.metadata.drop_all)
        await connection.run_sync(Base.metadata.create_all)
    yield
