"""Save chat messages with their imagery context and read them back."""

from datetime import date, datetime
from hashlib import sha256
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel, ConfigDict, Field, Json, PositiveInt, StringConstraints, UUID4, model_validator

from backend.services import chat_service
from backend.services.image_service import MAX_UPLOAD

router = APIRouter(prefix="/api/chats", tags=["chats"])


def browser_identity(credentials: Annotated[HTTPAuthorizationCredentials, Depends(HTTPBearer())]) -> str:
    try:
        token = UUID(credentials.credentials)
    except ValueError as error:
        raise HTTPException(401, "Invalid browser session.", headers={"WWW-Authenticate": "Bearer"}) from error
    if token.version != 4:
        raise HTTPException(401, "Invalid browser session.", headers={"WWW-Authenticate": "Bearer"})
    return "browser:" + sha256(token.bytes).hexdigest()


BrowserIdentity = Annotated[str, Depends(browser_identity)]
ChatId = Annotated[int, Field(gt=0, le=2_147_483_647)]
Longitude = Annotated[float, Field(ge=-180, le=180)]
Latitude = Annotated[float, Field(ge=-90, le=90)]
Coordinate = tuple[Longitude, Latitude]
Ring = Annotated[list[Coordinate], Field(min_length=5, max_length=5)]


class Rectangle(BaseModel):
    type: Literal["Polygon"]
    coordinates: tuple[Ring]

    @model_validator(mode="after")
    def check_ring(self):
        ring = self.coordinates[0]
        if ring[0] != ring[-1] or len(set(ring[:-1])) != 4:
            raise ValueError("The rectangle must have four distinct corners and a closed ring.")
        turns = []
        for index, corner in enumerate(ring[:-1]):
            x1, y1 = ring[(index + 1) % 4]
            x2, y2 = ring[(index + 2) % 4]
            turns.append((x1 - corner[0]) * (y2 - y1) - (y1 - corner[1]) * (x2 - x1))
        if not (all(turn > 0 for turn in turns) or all(turn < 0 for turn in turns)):
            raise ValueError("The rectangle corners must enclose an area in order.")
        return self


class WaybackRelease(BaseModel):
    release_num: PositiveInt
    release_date: date


class Comparison(BaseModel):
    source: Literal["esri-wayback"]
    before: WaybackRelease
    after: WaybackRelease
    area: Rectangle | None = None


class SendMessage(BaseModel):
    client_message_id: UUID4
    chat_id: ChatId | None = None
    content: Annotated[str, StringConstraints(strip_whitespace=True, max_length=2000)] = ""
    comparison: Comparison | None = None


class ChatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    created_at: datetime
    updated_at: datetime


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    role: Literal["user", "assistant"]
    content: str
    image_id: int | None
    attachment_name: str | None
    comparison: Comparison | None
    created_at: datetime


class SendResult(BaseModel):
    chat: ChatRead
    message: MessageRead


@router.get("", response_model=list[ChatRead])
def list_chats(identity: BrowserIdentity):
    user_id = chat_service.find_user_id(identity)
    return chat_service.list_chats(user_id) if user_id is not None else []


@router.get("/{chat_id}/messages", response_model=list[MessageRead])
def get_messages(chat_id: ChatId, identity: BrowserIdentity):
    user_id = chat_service.find_user_id(identity)
    if user_id is None:
        raise HTTPException(404, "Chat not found.")
    try:
        return chat_service.load_chat(user_id, chat_id)
    except chat_service.ChatNotFoundError as error:
        raise HTTPException(404, "Chat not found.") from error


@router.post("/messages", response_model=SendResult)
def send_message(
    identity: BrowserIdentity,
    payload: Annotated[Json[SendMessage], Form()],
    imagery: Annotated[UploadFile | None, File()] = None,
):
    if not payload.content and imagery is None and not (payload.comparison and payload.comparison.area):
        raise HTTPException(422, "Enter a message, select an area, or attach imagery.")
    if "\x00" in payload.content:
        raise HTTPException(422, "Remove invalid characters from the message.")

    attachment = None
    if imagery is not None:
        data = imagery.file.read(MAX_UPLOAD + 1)
        if len(data) > MAX_UPLOAD:
            raise HTTPException(413, "Imagery must be 20 MB or smaller.")
        name = (imagery.filename or "Imagery").replace("\x00", "")[:255] or "Imagery"
        attachment = (name, data)

    try:
        chat, message = chat_service.submit_message(
            identity,
            str(payload.client_message_id),
            payload.chat_id,
            payload.content,
            payload.comparison.model_dump(mode="json") if payload.comparison else None,
            attachment,
        )
    except chat_service.ChatNotFoundError as error:
        raise HTTPException(404, "Chat not found.") from error
    except ValueError as error:
        raise HTTPException(422, str(error)) from error
    return {"chat": chat, "message": message}
