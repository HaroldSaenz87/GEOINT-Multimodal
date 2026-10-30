# GEOINT Multimodal - Team L12

Post-disaster building damage assessment from satellite imagery, with a chat interface.

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (open and running)
- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (or pip)
- Git

---

## Clone

```bash
git clone https://github.com/HaroldSaenz87/GEOINT-Multimodal.git
cd GEOINT-Multimodal
```

---

## Run the FastAPI foundation

From the repository root:

```bash
uv sync
uv run uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

With pip, install `requirements.txt` in your virtual environment, then run the
same command without `uv run`.

The server starts without PostgreSQL or a `.env` file. It currently has no
endpoints, including no `/docs`, `/redoc`, or `/openapi.json`. A request to
`http://127.0.0.1:8000/` returns `404 Not Found`; this is expected.

Optional application settings are listed in `.env.example`. They use the
`BACKEND_` prefix and are loaded from the repo-root `.env`; environment variables
take precedence. `BACKEND_CORS_ORIGINS` must be a JSON array of origins. Its
defaults allow the future Vite frontend on localhost port 5173. This configures
browser access only; it does not add routes or authentication.

Backend structure:

```text
backend/
  main.py          # application factory and Uvicorn entry point
  core/config.py   # validated application settings
  api/             # reserved for future HTTP routes
  services/        # existing image and chat logic
  db.py            # existing database connection helpers
  schema.py        # existing SQLModel tables
```

Database setup remains separate. Starting the web server does not run migrations,
create tables, or import the existing database services.

## Run the database and existing services

### 1. Create your `.env`
```bash
cp .env.example .env
```
Open `.env` and set your own password. Use the **same** password in `POSTGRES_PASSWORD` and inside `DATABASE_URL`.
If port 5432 is already in use, set `POSTGRES_PORT` to a free port (for example,
5433) and use that same port in `DATABASE_URL`. If port 8000 is occupied, run
Uvicorn with `--port 8001` instead.

### 2. Start the database (PostgreSQL + PostGIS + pgvector)
```bash
docker compose up -d --build    # first time or after db/Dockerfile changes
docker compose up -d            # every other time
```

### 3. Install Python packages

**uv:**
```bash
uv sync
```

**pip:**
```bash
python -m venv .venv
source .venv/Scripts/activate     # Windows (Git Bash)
source .venv/bin/activate         # Mac / Linux
pip install -r requirements.txt
```

### 4. Create the tables
```bash
uv run alembic upgrade head
```

### 5. Check it works
```bash
uv run python -m backend.check_db
```
Should end with `OK`.

**pip users:** leave out `uv run` from the commands above (with `.venv` activated).

**To stop the database:** `docker compose down`

---
