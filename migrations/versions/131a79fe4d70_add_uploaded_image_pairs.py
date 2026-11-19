"""Store the two roles of uploaded image pairs.

Revision ID: 131a79fe4d70
Revises: 90969defa43d
"""

import sqlalchemy as sa
from alembic import op

revision = "131a79fe4d70"
down_revision = "90969defa43d"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for side in ("before", "after"):
        image_id = f"{side}_image_id"
        op.add_column("messages", sa.Column(image_id, sa.Integer()))
        op.add_column("messages", sa.Column(f"{side}_image_name", sa.String(255)))
        op.create_foreign_key(f"fk_messages_{image_id}", "messages", "images", [image_id], ["id"])


def downgrade() -> None:
    for side in ("after", "before"):
        image_id = f"{side}_image_id"
        op.drop_constraint(f"fk_messages_{image_id}", "messages", type_="foreignkey")
        op.drop_column("messages", f"{side}_image_name")
        op.drop_column("messages", image_id)
