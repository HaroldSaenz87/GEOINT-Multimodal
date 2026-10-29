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

## Run

### 1. Create your `.env`
```bash
cp .env.example .env
```
Open `.env` and set your own password. Use the **same** password in `POSTGRES_PASSWORD` and inside `DATABASE_URL`.

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
