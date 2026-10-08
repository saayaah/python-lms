# Python LMS

An extensible learning platform for Python and data structures. The first vertical slice provides JWT authentication, course/lesson progress, coding exercises, provider interfaces for AI and voice features, and a React client shell.

## Quick start

1. Copy `.env.example` to `.env`.
2. Run `docker compose -f infra/docker-compose.yml up --build`.
3. Open `http://localhost:5173` and the API docs at `http://localhost:8000/docs`.

For local backend work, install `backend` with `pip install -e ".[dev]"`, then run `uvicorn app.main:app --reload` from `backend`.

Initialize sample content locally with `python seed.py` from `backend`. For a deployed database, run `alembic upgrade head` before starting application workers.

The execution service is intentionally isolated behind an interface. Production deployments must connect it to a hardened, network-disabled worker/container rather than executing arbitrary code in the API process.

## Project layout

- `backend/` FastAPI API, SQLAlchemy models, migrations, services, and tests
- `frontend/` strict TypeScript React/Vite client
- `infra/` Docker Compose and reverse proxy configuration
- `docs/` architecture, security, and deployment notes

## Checks

```text
cd backend
pytest
ruff check app tests
```
