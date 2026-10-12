# Architecture

FastAPI exposes versioned routes under `/api/v1`, with SQLAlchemy models and service/provider boundaries. PostgreSQL is the production database and Redis is reserved for rate limiting, sessions, and jobs. The React client uses TanStack Query and talks only to the API. AI, TTS, and STT are interfaces so external providers can be added without changing routes.
