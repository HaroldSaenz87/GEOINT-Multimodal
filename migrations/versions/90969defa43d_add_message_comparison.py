"""Add comparison context and retry identifiers to messages.

Revision ID: 90969defa43d
Revises: d6c413e70988
"""

import sqlalchemy as sa
from alembic import op

revision = "90969defa43d"
down_revision = "d6c413e70988"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("messages", sa.Column("client_message_id", sa.String(36)))
    op.add_column("messages", sa.Column("attachment_name", sa.String(255)))
    op.add_column("messages", sa.Column("comparison", sa.JSON()))
    op.create_index("ix_messages_client_message_id", "messages", ["client_message_id"])


def downgrade() -> None:
    op.drop_index("ix_messages_client_message_id", table_name="messages")
    op.drop_column("messages", "comparison")
    op.drop_column("messages", "attachment_name")
    op.drop_column("messages", "client_message_id")
