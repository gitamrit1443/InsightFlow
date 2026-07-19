"""Initial InsightFlow schema."""

from typing import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260612_0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

file_status = postgresql.ENUM(
    "uploaded", "processing", "parsed", "failed", name="file_status", create_type=False
)
chat_role = postgresql.ENUM(
    "user", "assistant", "system", name="chat_role", create_type=False
)


def timestamps() -> list[sa.Column]:
    return [
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
    ]


def upgrade() -> None:
    file_status.create(op.get_bind(), checkfirst=True)
    chat_role.create(op.get_bind(), checkfirst=True)
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(320), nullable=False),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        *timestamps(),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("category", sa.String(120)),
        sa.Column("goal", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_projects_user_id", "projects", ["user_id"])
    op.create_table(
        "workspace_settings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("organization_name", sa.String(180)),
        sa.Column("theme", sa.String(20), nullable=False),
        sa.Column("notification_enabled", sa.Boolean(), nullable=False),
        sa.Column("billing_plan", sa.String(30), nullable=False),
        sa.Column("data_retention_days", sa.Integer(), nullable=False),
        *timestamps(),
    )
    op.create_table(
        "uploaded_files",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("file_name", sa.String(255), nullable=False),
        sa.Column("original_name", sa.String(255), nullable=False),
        sa.Column("file_type", sa.String(20), nullable=False),
        sa.Column("file_path", sa.String(1024), nullable=False),
        sa.Column("file_size", sa.BigInteger(), nullable=False),
        sa.Column("status", file_status, nullable=False),
        sa.Column("extracted_text", sa.Text()),
        sa.Column("parsed_data", postgresql.JSONB()),
        sa.Column("error_message", sa.Text()),
        *timestamps(),
    )
    op.create_index("ix_uploaded_files_project_id", "uploaded_files", ["project_id"])
    op.create_index("ix_uploaded_files_user_id", "uploaded_files", ["user_id"])
    op.create_table(
        "insights",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("type", sa.String(80), nullable=False),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("confidence_score", sa.Float()),
        sa.Column("metadata", postgresql.JSONB()),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_insights_project_id", "insights", ["project_id"])
    op.create_index("ix_insights_user_id", "insights", ["user_id"])
    op.create_table(
        "dashboards",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(180), nullable=False),
        sa.Column("layout_config", postgresql.JSONB(), nullable=False),
        *timestamps(),
    )
    op.create_index("ix_dashboards_project_id", "dashboards", ["project_id"])
    op.create_index("ix_dashboards_user_id", "dashboards", ["user_id"])
    op.create_table(
        "reports",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(240), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("export_url", sa.String(1024)),
        *timestamps(),
    )
    op.create_index("ix_reports_project_id", "reports", ["project_id"])
    op.create_index("ix_reports_user_id", "reports", ["user_id"])
    op.create_table(
        "chat_messages",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id", ondelete="CASCADE"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("role", chat_role, nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_chat_messages_project_id", "chat_messages", ["project_id"])
    op.create_index("ix_chat_messages_user_id", "chat_messages", ["user_id"])
    op.create_table(
        "api_usage",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("route", sa.String(255), nullable=False),
        sa.Column("method", sa.String(12), nullable=False),
        sa.Column("ip_address", sa.String(64), nullable=False),
        sa.Column("tokens_used", sa.Integer(), nullable=False),
        sa.Column("status_code", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
    )
    op.create_index("ix_api_usage_user_id", "api_usage", ["user_id"])
    op.create_index("ix_api_usage_created_at", "api_usage", ["created_at"])


def downgrade() -> None:
    for table in [
        "api_usage",
        "chat_messages",
        "reports",
        "dashboards",
        "insights",
        "uploaded_files",
        "workspace_settings",
        "projects",
        "users",
    ]:
        op.drop_table(table)
    chat_role.drop(op.get_bind(), checkfirst=True)
    file_status.drop(op.get_bind(), checkfirst=True)
