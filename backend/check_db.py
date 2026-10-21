# check the db setup and create the tables

# Run:
#   uv users: uv run python -m backend.check_db
#   pip users: python -m backend.check_db (with .venv activated)


from sqlalchemy import inspect, text
from backend.db import create_tables, engine

# connect and run quick queries
with engine.connect() as conn:

    # the db we're connected to
    print("Connected to:", conn.execute(text("SELECT current_database()")).scalar())

    # PostGIS version just to prove extension is on
    print("PostGIS:", conn.execute(text("SELECT postgis_version()")).scalar())

# create any missing tables from schema.py
create_tables()

# list the tables 
tables = sorted(t for t in inspect(engine).get_table_names() if t != "spatial_ref_sys")
print("Tables:", tables)
print("OK")