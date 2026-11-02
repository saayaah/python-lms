"""store refresh token expiry timestamps"""

import sqlalchemy as sa

from alembic import op

revision = "0002_refresh_token_expiry"
down_revision = "0001_initial"
branch_labels = None
depends_on = None


def upgrade() -> None:
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = {column["name"] for column in inspector.get_columns("refresh_tokens")}
    indexes = {index["name"] for index in inspector.get_indexes("refresh_tokens")}

    if "expires_at" not in columns:
        op.add_column(
            "refresh_tokens",
            sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        )
    if "ix_refresh_tokens_expires_at" not in indexes:
        op.create_index(
            "ix_refresh_tokens_expires_at",
            "refresh_tokens",
            ["expires_at"],
            unique=False,
        )


def downgrade() -> None:
    op.drop_index("ix_refresh_tokens_expires_at", table_name="refresh_tokens")
    op.drop_column("refresh_tokens", "expires_at")
