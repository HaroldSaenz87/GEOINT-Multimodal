# Connection to postgre database

# Reads DATABASE_URL from env 
# Give the app two helper:
#       create_tables() -> creates any missing tables
#       get_session() -> opens a session for reading or writing rows



import os
from dotenv import load_dotenv
from sqlmodel import Session, SQLModel, create_engine

# imports schema
from backend import schema

# loading env
load_dotenv()

# db address
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL is not set. Copy env.example to env and fill it in.")

# manage connection to db
# pre ping check connection still works before using it
engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def create_tables() -> None:

    # create tables that don't exist yet but existing tables are left alone
    # Basically to make sure tables exist
    SQLModel.metadata.create_all(engine)

def get_session() -> Session:

    # session is one batch of work to add/read rows, then session.commit() to save
    # use it like this: with get_session() as session: ...

    return Session(engine)