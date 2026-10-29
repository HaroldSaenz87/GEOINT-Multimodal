# database tables for chat history and image library.

from datetime import datetime, timezone
from typing import Any, Optional
from geoalchemy2 import Geometry
from pgvector.sqlalchemy import Vector
from sqlalchemy import Column, Index, Text
from sqlmodel import Field, SQLModel

def now() -> datetime:

    # current time in UTC
    return datetime.now(timezone.utc)



# USERS TABLE
# one row per person who is using the app
# Passwords and logins are handled by keycloak, so we just store user keycloak id to link chat and images
#--------------------------------------------------------------------

class User(SQLModel, table=True):

    # table name in the database
    __tablename__ = "users"

    # unique ID, set automatically for example 1, 2, 3, and so on
    id: Optional[int] = Field(default=None, primary_key=True)

    # user's ID from keycloak: one row per keycloak user
    keycloak_id: str = Field(unique=True, index=True)

    # copied from keycloak
    email: Optional[str] = None

    # user first used the app
    created_at: datetime = Field(default_factory=now)



# IMAGES table
# one row per map snapshot or uploaded image      
# picture itself is a FILE on disk (image_dir) this table stores who owns it, where it is, and where on map
# Used for the image library (preview, resuse in chats or just delete it)
#-------------------------------------------------------------------------

class Image(SQLModel, table=True):

    __tablename__ = "images"

    id: Optional[int] = Field(default=None, primary_key=True)

    # owner... this links to user table
    user_id: int = Field(foreign_key="users.id", index=True)

    # the image is snapshot or upload 
    source: str

    # where the image file is and if it got deleted itll be None
    file_path: Optional[str] = None

    # small preview for image library
    thumb_path: Optional[str] = None

    # formats (png, jpg, tif)
    format: Optional[str] = None

    # width in pixels
    width: Optional[int] = None

    # height in pixels
    height: Optional[int] = None

    # outline on the map (lon/lat uses PostGIS)
    area: Any = Field( default=None, sa_column=Column(Geometry("POLYGON", srid=4326)))

    # map zoom level when the snapshot was taken
    zoom: Optional[int] = None

    # which online tile server it came from
    tile_provider: Optional[str] = None

    # meters per pixel (ground resolution)
    pixel_size_m: Optional[float] = None
    
    # when the satellite took the image, if known
    capture_date: Optional[datetime] = None

    # when it was saved in the app
    created_at: datetime = Field(default_factory=now)

    # set when the user deletes it
    deleted_at: Optional[datetime] = None


    # remoteCLIP numbers describing whats in the image... should hold 768 numbers per image
    # none until the model processes the image for "search by descriptio"
    embedding: Any = Field(default=None, sa_column=Column(Vector(768)))



# CHATS table
# one row per convo, shown in users chat list
# The messages themselves are in the messages table
#------------------------------------------------------------------------------------------

class Chat(SQLModel, table=True):

    __tablename__ = "chats"

    # fast look up for a user's chat, newest first
    __table_args__ = (Index("ix_chat_user_updated", "user_id", "updated_at"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    user_id: int = Field(foreign_key="users.id")

    # name shown in chat list
    title: str = "New chat"

    # summary of older messages which is sent to the model for long chats
    summary: Optional[str] = Field(default=None, sa_column=Column(Text))

    # when the chat was started
    created_at: datetime = Field(default_factory=now)

    # last activity which will make the chat move to the top of the list
    updated_at: datetime = Field(default_factory=now)



# MESSAGES table
# One row per message in a chat, from the user or the model
# stores the full text so a chat can be reloaded exactly as it was
#--------------------------------------------------------------------------------------------

class Message(SQLModel, table= True):

    __tablename__ = "messages"

    __table_args__ = (Index("ix_messages_chat_created", "chat_id", "created_at"),)
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    chat_id: int = Field(foreign_key="chats.id")

    # user or assistant aka the model
    role: str

    # full message text, no length limit
    content: str = Field(sa_column=Column(Text, nullable=False))

    # image this message is about
    image_id: Optional[int] = Field(default=None, foreign_key="images.id")
    
    # when it was sent... this can show messages in order
    created_at: datetime = Field(default_factory=now)




# ANALYSIS table
# One row per damage analysis of an image
# Saves the model's results so they can be shown again and reused as context in possible future questions without reruns on the model
#------------------------------------------------------------------------------------------------------------------

class Analysis(SQLModel, table= True):

    __tablename__ = "analyses"
    
    id: Optional[int] = Field(default=None, primary_key=True)
    
    image_id: int = Field(foreign_key="images.id", index=True)
    
    # overall damage percentage
    damage_pct: Optional[float] = None

    # plain language summary of the damage
    findings: str = Field(default="", sa_column=Column(Text))

    # OWLv2 boxes + labels, stored as JSON text
    detections: Optional[str] = Field(default=None, sa_column=Column(Text))
    
    # which model produced the result
    model_name: str = ""

    # when the analysis was run
    created_at: datetime = Field(default_factory=now)