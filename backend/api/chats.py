# Chat routes: the chat list and one chat's message history

from datetime import datetime
from typing import Literal, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from backend.api.deps import CurrentUserId
from backend.services import chat_service

router = APIRouter(prefix="/api/chats", tags=["chats"])


# RESPONSE SHAPES
# what the frontend gets back (other columns like summary and user_id stay private)
#-------------------------------------------------------------------------------------------
class ChatRead(BaseModel):

    # lets pydantic read fields straight from the database objects
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
    image_id: Optional[int] = None
    created_at: datetime


# ROUTES
#-------------------------------------------------------------------------------------------

# GET /api/chats -> this user's chats, newest activity first
@router.get("", response_model=list[ChatRead])
def get_chats(user_id: CurrentUserId):
    return chat_service.list_chats(user_id)


# GET /api/chats/{chat_id}/messages -> every message in one chat, oldest first
@router.get("/{chat_id}/messages", response_model=list[MessageRead])
def get_chat_messages(chat_id: int, user_id: CurrentUserId):
    try:
        return chat_service.load_chat(user_id, chat_id)
    except PermissionError:
        # same 404 whether the chat doesn't exist or belongs to someone else,
        # so nobody can guess which chat ids exist
        raise HTTPException(status_code=404, detail="Chat not found")
