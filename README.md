# GEOINT Multimodal - Team L12

Post-disaster building damage assessment from satellite imagery, with a chat interface.

---

## Requirements

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (open and running)
- Python 3.10+
- [uv](https://docs.astral.sh/uv/) (or pip)
- Git
- Node.js 22.12+ and npm (for the frontend)

---

## Clone

```bash
git clone https://github.com/HaroldSaenz87/GEOINT-Multimodal.git
cd GEOINT-Multimodal
```

---

## Run the FastAPI chat API

For chat, start PostgreSQL using the [database setup below](#run-the-database-and-existing-services).
Then run from the repository root:

```bash
uv sync
uv run alembic upgrade head
uv run uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

With pip, install `requirements.txt` in your virtual environment, then run the
same command without `uv run`.

The chat API is documented at `http://127.0.0.1:8000/docs`. Starting the server
without PostgreSQL is useful for viewing the API docs. Chat requests need the
database and the current migration.

Optional application settings are listed in `.env.example`. They use the
`BACKEND_` prefix and are loaded from the repo-root `.env`; environment variables
take precedence. `BACKEND_CORS_ORIGINS` must be a JSON array of origins. Its
defaults allow the Vite frontend on localhost port 5173.

Backend structure:

```text
backend/
  main.py          # application factory and Uvicorn entry point
  core/config.py   # validated application settings
  api/             # chat history and message submission routes
  services/        # existing image and chat logic
  db.py            # existing database connection helpers
  schema.py        # existing SQLModel tables
```

The browser keeps a session key for access to its saved chats. History follows
that browser and site address. This setup is intended for the local team MVP.

## Run the React frontend

The map runs in the browser with public Esri imagery. From the repository root:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://127.0.0.1:5173`. The comparison starts with the newest local Wayback
release on the After side and the previous release on the Before side. Drag the
divider to compare them. The date menus update as you pan or zoom. Choose **Select area**
in the composer and drag a rectangle on the map to select it. Sending saves the
message along with the selected rectangle and both Wayback release IDs and dates.
To use your own imagery, choose **Upload image pair** and select one **Before image**
and one **After image**. Each can be a PNG, JPEG, or TIFF up to 20 MiB. Clear the
mapped area to switch to uploads, or cancel the image pair to return to area
selection. **History** reopens messages with their saved imagery context.

Wayback dates identify map releases. The selected rectangle and release IDs give
the later analysis step the inputs to fetch matching before and after imagery.
At this stage, sending a message saves it and displays it in the conversation.

Vite forwards requests under `/api` to `http://127.0.0.1:8000`, preserving the
path. If FastAPI is using port 8001, create `frontend/.env.local` containing:

```dotenv
API_PROXY_TARGET=http://127.0.0.1:8001
```

Restart Vite after changing this setting. For deployment, serve the frontend and
route `/api` to FastAPI on the same origin.

See [frontend/README.md](frontend/README.md) for the folder structure and checks.

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

## Add something to the schema

### 1. Get the latest code and make a branch:
   ```bash
   git checkout main
   git pull origin main
   git checkout -b <your-branch-name>
   docker compose up -d
   ```

### 2. Make sure your database is up to date:

   **uv:**
   ```bash
   uv run alembic upgrade head
   ```
   **pip** (with `.venv` activated):
   ```bash
   alembic upgrade head
   ```

### 3. Add your column or table in `backend/schema.py`:
   ```python
   new_column: Optional[str] = None
   ```

### 4. Create the migration:

   **uv:**
   ```bash
   uv run alembic revision --autogenerate -m "add new_column"
   ```
   **pip:**
   ```bash
   alembic revision --autogenerate -m "add new_column"
   ```

### 5. Apply it:

   **uv:**
   ```bash
   uv run alembic upgrade head
   ```
   **pip:**
   ```bash
   alembic upgrade head
   ```

### 6. Commit and push:
   ```bash
   git add backend/schema.py migrations/versions/
   git commit -m "Add new_column"
   git push -u origin <your-branch-name>
   ```
   Then open a PR.

After it's merged, everyone runs `uv run alembic upgrade head` (uv) or `alembic upgrade head` (pip).
