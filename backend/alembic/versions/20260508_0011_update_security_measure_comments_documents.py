"""update security measure comments and documents

Revision ID: 20260508_0011
Revises: 20260508_0010
Create Date: 2026-05-08 00:11:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260508_0011"
down_revision: str | None = "20260508_0010"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("technical_security_measure_records", sa.Column("comment", sa.Text(), nullable=True))
    op.execute(
        """
        UPDATE technical_security_measure_records
        SET comment = NULLIF(BTRIM(justification_text), '')
        WHERE justification_text IS NOT NULL AND BTRIM(justification_text) <> ''
        """
    )
    op.drop_column("technical_security_measure_records", "justification_file_content_type")
    op.drop_column("technical_security_measure_records", "justification_file_name")
    op.drop_column("technical_security_measure_records", "justification_file_path")
    op.drop_column("technical_security_measure_records", "justification_text")

    op.create_table(
        "technical_security_measure_documents",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("file_path", sa.String(length=2048), nullable=False),
        sa.Column("file_name", sa.String(length=255), nullable=False),
        sa.Column("file_content_type", sa.String(length=255), nullable=False),
        sa.Column("file_size_bytes", sa.BigInteger(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_technical_security_measure_documents_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_technical_security_measure_documents_id"),
        "technical_security_measure_documents",
        ["id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_technical_security_measure_documents_ispdn_id"),
        "technical_security_measure_documents",
        ["ispdn_id"],
        unique=False,
    )


def downgrade() -> None:
    op.add_column("technical_security_measure_records", sa.Column("justification_text", sa.Text(), nullable=True))
    op.add_column(
        "technical_security_measure_records",
        sa.Column("justification_file_path", sa.String(length=2048), nullable=True),
    )
    op.add_column(
        "technical_security_measure_records",
        sa.Column("justification_file_name", sa.String(length=255), nullable=True),
    )
    op.add_column(
        "technical_security_measure_records",
        sa.Column("justification_file_content_type", sa.String(length=255), nullable=True),
    )
    op.execute(
        """
        UPDATE technical_security_measure_records
        SET justification_text = comment
        WHERE comment IS NOT NULL AND BTRIM(comment) <> ''
        """
    )

    op.drop_index(op.f("ix_technical_security_measure_documents_ispdn_id"), table_name="technical_security_measure_documents")
    op.drop_index(op.f("ix_technical_security_measure_documents_id"), table_name="technical_security_measure_documents")
    op.drop_table("technical_security_measure_documents")
    op.drop_column("technical_security_measure_records", "comment")
