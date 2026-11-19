# Saving and loading chat history
# The frontend will call these functons

from contextlib import ExitStack
from typing import Any, Optional
from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlmodel import select
from backend.db import get_session
from backend.schema import Chat, Image, Message, User, now
from backend.services.image_service import prepare_img

# the only allowed values for a message's role
VALID_ROLES = {"user", "assistant"}


class ChatNotFoundError(PermissionError):
    pass

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
def find_user_id(identity: str) -> int | None:
    with get_session() as session:
        return session.exec(select(User.id).where(User.keycloak_id == identity)).one_or_none()


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

        raise ChatNotFoundError("Chat not found")

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
def submit_message(
    identity: str,
    client_message_id: str,
    chat_id: int | None,
    content: str,
    comparison: dict[str, Any] | None,
    attachment: tuple[str, bytes] | None,
) -> tuple[Chat, Message]:
    """Create a chat if needed and save this message and its attachment together."""
    with get_session() as session:
        session.execute(
            insert(User).values(keycloak_id=identity, created_at=now())
            .on_conflict_do_nothing(index_elements=["keycloak_id"])
        )
        # Serialize sends for this browser, including retries from another tab.
        user_id = session.exec(
            select(User.id).where(User.keycloak_id == identity).with_for_update()
        ).one()
        saved = session.exec(
            select(Chat, Message).join(Message, Chat.id == Message.chat_id).where(
                Chat.user_id == user_id, Message.client_message_id == client_message_id
            )
        ).one_or_none()
        if saved is not None:
            return saved[0], saved[1]

        attachment_name = attachment[0] if attachment else None
        if chat_id is None:
            title = (content.splitlines()[0] if content else attachment_name or "Imagery comparison")[:80]
            chat = Chat(user_id=user_id, title=title)
            session.add(chat)
            session.flush()
        else:
            chat = _get_owned_chat(session, user_id, chat_id)

        with ExitStack() as staged:
            image_id = None
            if attachment:
                image = staged.enter_context(prepare_img(user_id, attachment[1], "upload"))
                session.add(image)
                session.flush()
                image_id = image.id

            message = Message(
                chat_id=chat.id,
                role="user",
                content=content,
                image_id=image_id,
                attachment_name=attachment_name,
                comparison=comparison,
                client_message_id=client_message_id,
            )
            chat.updated_at = message.created_at
            session.add(message)
            session.commit()

        session.refresh(chat)
        session.refresh(message)
        return chat, message


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
