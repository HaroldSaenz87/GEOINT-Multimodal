# Alembic settings basically how Alembic connects to the database and finds our tables

# Commands:
#   uv run alembic revision --autogenerate -m "describe the change"   (make a migration)
#   uv run alembic upgrade head                                        (apply migrations)

import os
from logging.config import fileConfig

from alembic import context
from dotenv import load_dotenv
from geoalchemy2 import alembic_helpers
from sqlalchemy import engine_from_config, pool
from sqlmodel import SQLModel

# importing schema registers our tables with SQLModel
from backend import schema

# load DATABASE_URL from .env (so the password isn't stored in alembic.ini)
load_dotenv()

# Alembic's config object (reads alembic.ini)
config = context.config
config.set_main_option("sqlalchemy.url", os.environ["DATABASE_URL"])

# set up logging from alembic.ini
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# the tables Alembic compares against the database
target_metadata = SQLModel.metadata


def include_object(obj, name, type_, reflected, compare_to):
    # skip tables that exist in the database but aren't ours
    # (PostGIS adds its own, like spatial_ref_sys so Alembic must never delete them)
    if type_ == "table" and reflected and compare_to is None:

        return False
    
    # let GeoAlchemy2 handle PostGIS columns and their spatial indexes correctly
    return alembic_helpers.include_object(obj, name, type_, reflected, compare_to)


# settings shared by both modes below
CONFIGURE = dict(
    
    target_metadata=target_metadata,
    
    include_object=include_object,
    
    process_revision_directives=alembic_helpers.writer,
    
    render_item=alembic_helpers.render_item,
    compare_type=True,
)


def run_migrations_offline() -> None:
    
    # "offline" write the SQL out instead of running it
    context.configure(url=config.get_main_option("sqlalchemy.url"), literal_binds=True, **CONFIGURE)
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    # "online" connect to the database and apply the changes
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, **CONFIGURE)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():

    run_migrations_offline()
    
else:
    run_migrations_online()