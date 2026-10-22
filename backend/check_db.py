# check the db setup 

# Run:
#   uv users: uv run python -m backend.check_db
#   pip users: python -m backend.check_db (with .venv activated)


from sqlalchemy import inspect, text
from backend.db import engine

# connect and run quick queries
with engine.connect() as conn:

    # the db we're connected to
    print("Connected to:", conn.execute(text("SELECT current_database()")).scalar())

    # PostGIS version just to prove extension is on
    print("PostGIS:", conn.execute(text("SELECT postgis_version()")).scalar())

# list our tables 
tables = sorted(
    t for t in inspect(engine).get_table_names()

    if t not in ("spatial_ref_sys", "alembic_version")
)

print("Tables:", tables)

# warn if Alembic hasnt been run yet
if not tables:
    print("No tables yet. Create them with Alembic:")
    print("    uv users: uv run alembic upgrade head")
    print("    pip users: alembic upgrade head (with .venv activated)")
else:
    print("OK")