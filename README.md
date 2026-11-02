# Python LMS

An extensible learning platform for Python and data structures. The first vertical slice provides JWT authentication, course/lesson progress, coding exercises, provider interfaces for AI and voice features, and a React client shell.

## Quick start

1. Copy `.env.example` to `.env`.
2. Run `docker compose -f infra/docker-compose.yml up --build`.
3. Open `http://localhost:5173` and the API docs at `http://localhost:8000/docs`.

For local backend work, install `backend` with `pip install -e ".[dev]"`, then run
`python -m uvicorn app.main:app --reload` from `backend`. Development defaults to
`sqlite:///./lms.db`, so the database file is `backend/lms.db` when the command is
run from that directory.

Initialize sample content locally with `python seed.py` from `backend`. The local
development startup creates missing tables automatically. For Docker or deployed
databases, the container runs `alembic upgrade head` before starting the API;
run the same command manually from `backend` when applying migrations outside
Docker.

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
