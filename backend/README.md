# Backend

The Python backend for GEOINT Multimodal. It is a **FastAPI** web server that stores data in **PostgreSQL**, using the **PostGIS** extension for map shapes and **pgvector** for image embeddings.

Run every command below from the **repo root**, not from inside `backend/`.

## Folder layout

```
backend/
├── main.py              # starts the FastAPI app
├── db.py                # database connection + sessions
├── schema.py            # database tables (as Python classes)
├── check_db.py          # quick script to test the database setup
├── core/
│   └── config.py        # app settings (name, allowed frontend URLs)
├── api/                 # HTTP routes (empty for now)
└── services/
    ├── chat_service.py  # save/load chats and messages
    └── image_service.py # save/list/search/delete images
```

## Files

### `main.py`: app entry point
- Builds the FastAPI app with `create_app()`.
- Adds **CORS** rules, which tell the browser which other websites (here, the Vite frontend on port 5173) may call this API.
- Auto-generated API docs pages (`/docs`, `/redoc`) are turned off.
- Run it with:
  ```powershell
  uv run uvicorn backend.main:app --reload
  ```

### `db.py`: database connection
- Reads `DATABASE_URL` from `.env`. It stops with an error if that value is missing.
- `engine` manages the connections to Postgres.
- `create_tables()` creates any tables that are missing. Use Alembic for real schema changes (see [Migrations](#migrations)).
- `get_session()` opens a session, which is one batch of reads and writes. Use it like this:
  ```python
  with get_session() as session:
      ...
      session.commit()
  ```

### `schema.py`: database tables
Each class here is one table, written with **SQLModel**, a library that lets one Python class define both a database table and its data shape.

| Class | Table | What one row is |
|---|---|---|
| `User` | `users` | A person using the app. Logins are handled by Keycloak, so only their Keycloak ID is stored. |
| `Image` | `images` | A map snapshot or uploaded image. The file itself is on disk; the row holds the owner, the file path, the map area and an embedding. |
| `Chat` | `chats` | One conversation in a user's chat list. |
| `Message` | `messages` | One message in a chat, from the user or the model. |
| `Analysis` | `analyses` | The saved result of one damage analysis on an image, so the model doesn't have to run again. |

`now()` is a helper that returns the current UTC time for timestamp fields.

### `check_db.py`: database health check
Connects to the database, prints the database name, the PostGIS version and the list of tables, and warns you if Alembic hasn't been run yet.
```powershell
uv run python -m backend.check_db
```

### `core/config.py`: app settings
- `Settings` reads values from `.env` that start with `BACKEND_`. For example, `BACKEND_APP_NAME` overrides `app_name`.
- `get_settings()` loads the settings once and reuses them after that.

### `api/`: HTTP routes (placeholder)
This folder is reserved for the API endpoints the frontend will call. No routes exist yet.

### `services/`: business logic
These functions do the real work, and the API routes will call them later. Every function takes a `user_id`, so a user can only touch their own data.

**`chat_service.py`**
- `get_or_create_user()`: finds a user by Keycloak ID, or creates one if none exists.
- `create_chat()`, `list_chats()`, `rename_chat()`, `delete_chat()`: manage a user's chats.
- `add_message()`: saves a message. The role must be one of the allowed values.
- `load_chat()`: returns all messages in a chat, in order.

**`image_service.py`**
- `save_img()`: checks an image and saves it, then makes a thumbnail and adds a row to the `images` table.
  - Accepted formats: PNG, JPEG and TIFF, up to 20 MB.
  - Source must be `snapshot` or `upload`.
  - Thumbnails are 256×256.
  - Files go to `IMAGE_DIR` (default `data/images`).
- `get_image()`, `list_images()`: read one image, or all of a user's images (you can filter by source).
- `find_images_at()`: finds the snapshots whose map area covers a given longitude/latitude. Uploads have no map area, so they are skipped.
- `delete_image()`: deletes the image file and its database row.

### `__init__.py` files
These mark each folder as a Python package so imports like `from backend.db import engine` work. They contain no logic.

## Related folders outside `backend/`
- `migrations/`: **Alembic** migrations, which are versioned scripts that change the database tables over time. To apply them:
  ```powershell
  uv run alembic upgrade head
  ```
- `tests/`: backend tests.
- `.env`: holds `DATABASE_URL`, `IMAGE_DIR` and any `BACKEND_*` settings. Copy it from the example env file.
