# Saving and loading chat history
# The frontend will call these functons

from typing import Optional
from sqlalchemy import delete
from sqlmodel import select
from backend.db import get_session
from backend.schema import Chat, Image, Message, User, now

# the only allowed values for a message's role
VALID_ROLES = {"user", "assistant"}



# USERS
#-------------------------------------------------------------------------------------------
def get_or_create_user(keycloak_id: str, email: Optional[str] = None) -> User:

    
    with get_session() as session:
        
        user = session.exec(select(User).where(User.keycloak_id == keycloak_id)).first()

        if user is None:
            user = User(keycloak_id=keycloak_id, email=email)
            session.add(user)
            session.commit()
            session.refresh(user)

        return user




# CHATS
#-------------------------------------------------------------------------------------------
def create_chat(user_id: int, title: str = "New chat") -> Chat:

    with get_session() as session:
        chat = Chat(user_id=user_id, title=title)
        session.add(chat)
        session.commit()
        session.refresh(chat)

        return chat

def list_chats(user_id: int) -> list[Chat]:

    with get_session() as session:
        statement = (
            select(Chat)
            .where(Chat.user_id == user_id)
            .order_by(Chat.updated_at.desc())
        )
        return list(session.exec(statement).all())

def _get_owned_chat(session, user_id: int, chat_id: int) -> Chat:

    chat = session.get(Chat, chat_id)

    if chat is None or chat.user_id != user_id:

        raise PermissionError("Chat not found")

    return chat

def rename_chat(user_id: int, chat_id: int, new_title: str) -> Chat:

    with get_session() as session:
        chat = _get_owned_chat(session, user_id, chat_id)
        chat.title = new_title
        session.add(chat)
        session.commit()
        session.refresh(chat)

        return chat

def delete_chat(user_id: int, chat_id: int) -> None:

    with get_session() as session:

        chat = _get_owned_chat(session, user_id, chat_id)

        session.execute(delete(Message).where(Message.chat_id == chat_id))

        session.delete(chat)

        session.commit()





# MESSAGES
#-----------------------------------------------------------------------------------------------------------
def add_message(
        user_id: int,
        chat_id: int,
        role: str,
        content: str,
        image_id: Optional[int] = None,
) -> Message:

    if role not in VALID_ROLES:
        raise ValueError(f"role must be one of {VALID_ROLES}")

    with get_session() as session:

        chat = _get_owned_chat(session, user_id, chat_id)

        if image_id is not None:
            image = session.get(Image, image_id)
            if image is None or image.user_id != user_id:
                raise PermissionError("Image not found")


        message = Message(chat_id=chat_id, role=role, content=content, image_id=image_id)

        chat.updated_at = now()

        session.add(message)
        session.add(chat)
        session.commit()
        session.refresh(message)
        return message

def load_chat(user_id: int, chat_id: int) -> list[Message]:

    with get_session() as session:
        _get_owned_chat(session, user_id, chat_id)

        statement = (
            select(Message)
            .where(Message.chat_id == chat_id)
            .order_by(Message.created_at, Message.id)
        )

        return list(session.exec(statement).all())
