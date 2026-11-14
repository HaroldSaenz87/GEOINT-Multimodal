"""add before_image_id to messages and analyses

Revision ID: 87867df7a3e9
Revises: d6c413e70988
Create Date: 2026-11-14 16:43:17.184312

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
import sqlmodel
import geoalchemy2
import pgvector.sqlalchemy


# revision identifiers, used by Alembic.
revision: str = '87867df7a3e9'
down_revision: Union[str, Sequence[str], None] = 'd6c413e70988'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # before image for before/after comparisons (None = after image only)
    # foreign keys are named so downgrade() can find and remove them
    op.add_column('analyses', sa.Column('before_image_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_analyses_before_image_id', 'analyses', 'images', ['before_image_id'], ['id'])
    op.add_column('messages', sa.Column('before_image_id', sa.Integer(), nullable=True))
    op.create_foreign_key('fk_messages_before_image_id', 'messages', 'images', ['before_image_id'], ['id'])


def downgrade() -> None:
    """Downgrade schema."""
    # remove the foreign keys (by name) first, then the columns
    op.drop_constraint('fk_messages_before_image_id', 'messages', type_='foreignkey')
    op.drop_column('messages', 'before_image_id')
    op.drop_constraint('fk_analyses_before_image_id', 'analyses', type_='foreignkey')
    op.drop_column('analyses', 'before_image_id')