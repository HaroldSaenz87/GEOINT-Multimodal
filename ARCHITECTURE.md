# Architecture

GEOINT Multimodal is a web app for **post-disaster building damage assessment**. A user grabs a satellite image (a map snapshot or an upload), asks questions about it in a chat, and an AI model reports the damage.

> **Status:** early foundation. The database, tables, and Python services exist. The web server runs but has **no API routes yet**, and the frontend is a "Hello, world!" page. The AI models (RemoteCLIP, OWLv2) and login (Keycloak) are planned but not wired in.

---

## The big picture

```text
 Browser
   │
   ▼
 frontend/  (React + Vite, port 5173)
   │   requests to /api/... are forwarded by Vite
   ▼
 backend/   (FastAPI + Python, port 8000)
   │   main.py → api/ (routes, future) → services/ (logic) → db.py
   ▼
 PostgreSQL in Docker (port 5432)
   with PostGIS (map search) + pgvector (AI similarity search)

 Image files themselves live on disk in data/images/
```

**Terms used below:**

- **FastAPI** – Python library for building web APIs (URLs the frontend calls).
- **Uvicorn** – the program that actually runs the FastAPI app and listens on a port.
- **ORM** – lets you work with database rows as Python objects instead of raw SQL. This project uses **SQLModel**.
- **Migration** – a versioned script that changes the database structure (add a table, add a column). Run with **Alembic**.
- **PostGIS** – Postgres add-on for map data (shapes, coordinates, "does this area contain this point?").
- **pgvector** – Postgres add-on for storing *embeddings*: lists of numbers an AI model produces to describe an image, so you can search "images similar to X".
- **Keycloak** – a separate login/account server (planned). The app will store only the user's Keycloak ID, never passwords.

---

## Root folder

| File | What it does |
|---|---|
| `README.md` | Setup and run instructions. |
| `.env.example` | Template for your private `.env` (DB password, DB URL, image folder, backend settings). Copy it to `.env`; never commit `.env`. |
| `.gitignore` | Files Git ignores: `.env`, `data/`, `.venv/`, `__pycache__/`, editor files. |
| `docker-compose.yml` | Starts the database container. Mounts `db-init/` so it runs on first start, and stores data in a Docker volume named `projectdata`. Keycloak will be added here later. |
| `pyproject.toml` | Python project info and dependency list (used by **uv**, a fast Python package manager — like npm for Python). |
| `uv.lock` | Exact locked versions of every Python package (like `package-lock.json`). Don't edit by hand. |
| `requirements.txt` | Same dependencies for people using **pip** instead of uv. Generated from `pyproject.toml`. |
| `alembic.ini` | Config for Alembic (migrations tool). Points it at the `migrations/` folder. The DB URL is read from `.env`, not stored here. |

---

## `backend/` — the Python server

Everything server-side. Run from the repo root as `backend.main:app`.

| Path | What it does |
|---|---|
| `main.py` | **Entry point.** `create_app()` builds the FastAPI app and adds **CORS** settings (CORS = browser rule that decides which websites may call this API; here it allows the Vite dev server on port 5173). API docs pages are turned off. No routes are registered yet. |
| `core/config.py` | Web server settings (`app_name`, `cors_origins`), read from `.env` vars starting with `BACKEND_`. Uses **pydantic-settings**, which validates the types. `get_settings()` is cached so `.env` is read once. |
| `api/` | **Empty for now.** Reserved for HTTP routes (e.g. `POST /api/chats`). Routes will call functions in `services/`. |
| `services/` | **Business logic** — the actual work, kept separate from HTTP so it can be tested on its own. |
| `services/chat_service.py` | Users, chats, and messages: `get_or_create_user`, `create_chat`, `list_chats`, `rename_chat`, `delete_chat`, `add_message`, `load_chat`. Every call takes a `user_id` and checks ownership, so one user can't read another's chat. |
| `services/image_service.py` | Image library: `save_img` (validates size ≤ 20 MB and format PNG/JPEG/TIFF, saves a PNG + 256px thumbnail to `data/images/<user_id>/`, stores the map area), `get_image`, `list_images`, `find_images_at` (PostGIS "which of my images cover this point?"), `delete_image` (deletes files, keeps the row marked as deleted so old chat messages still make sense). |
| `schema.py` | **Database tables** as Python classes (see table list below). |
| `db.py` | Connects to Postgres using `DATABASE_URL` from `.env`. Gives you `get_session()` to read/write rows. Crashes with a clear message if `DATABASE_URL` is missing. |
| `check_db.py` | Quick health check: connects, prints the DB name, PostGIS version, and table list. Run with `uv run python -m backend.check_db`. |

### Database tables (`schema.py`)

```text
users ──< chats ──< messages >── images ──< analyses
  └──────────────────────────────< images
```
(`──<` means "one to many", e.g. one user has many chats.)

| Table | One row per… | Notable columns |
|---|---|---|
| `users` | person using the app | `keycloak_id` (link to the login system), `email` |
| `images` | snapshot or upload | `file_path`, `thumb_path`, `area` (map polygon, PostGIS), `zoom`, `embedding` (768 numbers from RemoteCLIP, pgvector), `deleted_at` |
| `chats` | conversation | `title`, `summary` (of older messages, for long chats), `updated_at` (sorts the chat list) |
| `messages` | chat message | `role` (`user` or `assistant`), `content`, optional `image_id` |
| `analyses` | damage analysis of an image | `damage_pct`, `findings` (text summary), `detections` (OWLv2 boxes as JSON), `model_name` |

---

## `frontend/` — the React app

What runs in the browser. Has its own `package.json` and its own [README](frontend/README.md). Run `npm run dev` from inside `frontend/`.

**Stack:** React 19 + TypeScript, **Vite** (dev server and bundler), **Tailwind CSS** (style with class names like `p-4`), **shadcn/ui** (copy-in UI components you own and edit).

| Path | What it does |
|---|---|
| `index.html` | The single HTML page. Has a `<div id="root">` that React fills in. |
| `src/main.tsx` | Starts React and mounts `<App />` into `#root`. |
| `src/App.tsx` | Top-level component. Currently just "Hello, world!". |
| `src/index.css` | Tailwind import, global styles, and theme colors (light in `:root`, dark in `.dark`). |
| `src/vite-env.d.ts` | TypeScript types for Vite features and any future `VITE_` env vars. |
| `src/components/ui/` | Where shadcn components go (`npx shadcn add button`). Empty for now. |
| `src/hooks/` | Shared React hooks (reusable `useSomething()` functions). Empty for now. |
| `src/lib/utils.ts` | `cn()` helper for combining CSS class names. |
| `vite.config.ts` | Vite setup: React + Tailwind plugins, `@/` = `src/` shortcut, dev server on `127.0.0.1:5173`, and a **proxy** that forwards `/api/...` requests to the backend on port 8000 (avoids CORS issues in dev). |
| `components.json` | shadcn settings (style preset, where components and utils go). |
| `.env.example` | Template for `.env.local`. Only setting: `API_PROXY_TARGET` (change it if the backend runs on another port). |
| `tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | TypeScript settings. `app` = code in `src/` (runs in browser); `node` = config files like `vite.config.ts` (run in Node). |
| `.oxlintrc.json` | Rules for **Oxlint**, a fast linter (checks code for mistakes/style). Run with `npm run lint`. |
| `package.json` / `package-lock.json` | npm scripts (`dev`, `build`, `typecheck`, `lint`, `preview`) and dependencies. |

---

## `db/` — custom database image

| File | What it does |
|---|---|
| `Dockerfile` | Builds the Postgres image: starts from the official **pgvector** image (Postgres 16) and installs **PostGIS** on top. Rebuild with `docker compose up -d --build` after changing it. |

## `db-init/` — first-start SQL

| File | What it does |
|---|---|
| `01-init.sql` | Runs **only the first time** the DB container starts with an empty volume. Creates two databases: `geoapp` (the app) and `keycloak` (future logins), and turns on PostGIS in `geoapp`. Doesn't create tables — that's Alembic's job. |

## `migrations/` — database version history (Alembic)

| Path | What it does |
|---|---|
| `env.py` | Tells Alembic how to connect (reads `DATABASE_URL` from `.env`) and where the table definitions are (`backend/schema.py`). Also stops Alembic from deleting PostGIS's own tables. |
| `script.py.mako` | Template Alembic uses when generating a new migration file. |
| `versions/d6f0a7ee1c2c_initial_tables.py` | Migration 1: creates `users`, `chats`, `messages`, `images`, `analyses`. |
| `versions/d6c413e70988_add_image_embedding.py` | Migration 2: turns on pgvector and adds `images.embedding`. |

**Workflow:** edit `schema.py` → `uv run alembic revision --autogenerate -m "what changed"` → check the new file in `versions/` → `uv run alembic upgrade head`.

## `tests/` — service tests

Plain Python scripts (not pytest) that run against the **real database**, print each step, and end with `OK`. They create test users (`test-bob`, `test-tom`) and clean up after themselves.

| File | What it checks |
|---|---|
| `test_chat_service.py` | Create users/chats/messages, chat list order, reloading a chat, privacy (Tom can't read Bob's chat), rename/delete. Run: `uv run python -m tests.test_chat_service` |
| `test_image_service.py` | Saving snapshots/uploads, rejecting bad files, image library, PostGIS location search, attaching images to messages, privacy, deleting. Run: `uv run python -m tests.test_image_service` |

---

## Not in Git (created locally)

| Folder/File | What it is |
|---|---|
| `.env` | Your real secrets and settings. |
| `.venv/` | Installed Python packages (made by `uv sync`). |
| `data/images/` | Saved image files and thumbnails, one subfolder per user ID. |
| `frontend/node_modules/` | Installed npm packages. |
| `frontend/dist/` | Production build output from `npm run build`. |

---

## How a request will flow (once routes exist)

1. User clicks something in the React app → `fetch("/api/chats")`.
2. Vite's dev proxy forwards it to FastAPI on port 8000.
3. A route in `backend/api/` receives it and calls e.g. `chat_service.list_chats(user_id)`.
4. The service opens a session via `db.py` and queries tables defined in `schema.py`.
5. Postgres returns rows → service returns Python objects → route sends JSON back to the browser.
