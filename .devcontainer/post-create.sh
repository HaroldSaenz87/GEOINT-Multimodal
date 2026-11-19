#!/usr/bin/env bash
# Runs once when the codespace is created.
# Installs dependencies, creates .env, starts the database, and creates the tables.
set -euo pipefail

# 1. Install uv (the Python package manager this repo uses)
if ! command -v uv >/dev/null 2>&1; then
  curl -LsSf https://astral.sh/uv/install.sh | sh
fi
export PATH="$HOME/.local/bin:$PATH"

# 2. Create .env from the example, with a random database password
#    (.env is in .gitignore, so it is never committed)
if [ ! -f .env ]; then
  cp .env.example .env
  pw="$(openssl rand -hex 16)"
  user="$(grep '^POSTGRES_USER=' .env | cut -d= -f2-)"
  sed -i "s|^POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${pw}|" .env
  sed -i "s|^DATABASE_URL=.*|DATABASE_URL=postgresql+psycopg://${user}:${pw}@localhost:5432/geoapp|" .env
  echo "Created .env"
fi

# 3. Install Python and frontend dependencies
uv sync
(cd frontend && npm ci)

# 4. Wait for Docker, start the database, and create the tables
for _ in $(seq 1 30); do
  docker info >/dev/null 2>&1 && break
  sleep 2
done
docker compose up -d --build --wait
uv run alembic upgrade head
uv run python -m backend.check_db
