"""refactor processing processes

Revision ID: 20260511_0017
Revises: 20260511_0016
Create Date: 2026-05-11 01:17:00.000000

"""

from collections.abc import Mapping, Sequence

import hashlib
import json
from typing import Any

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "20260511_0017"
down_revision: str | None = "20260511_0016"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "processing_processes_new",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("purpose_name", sa.String(length=255), nullable=False),
        sa.Column("processing_period", sa.String(length=1000), nullable=False),
        sa.Column("subject_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("data_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("legal_bases", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("personal_data_actions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("processing_type", sa.String(length=32), nullable=False),
        sa.Column("internal_network_transfer", sa.String(length=64), nullable=False),
        sa.Column("internet_transfer", sa.String(length=64), nullable=False),
        sa.Column("cross_border_transfer", sa.Boolean(), nullable=False),
        sa.Column("process_signature", sa.String(length=64), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_processing_processes_name_not_empty"),
        sa.CheckConstraint("length(trim(purpose_name)) > 0", name="ck_processing_processes_purpose_name_not_empty"),
        sa.CheckConstraint(
            "length(trim(processing_period)) > 0",
            name="ck_processing_processes_processing_period_not_empty",
        ),
        sa.CheckConstraint(
            "processing_type IN ('automated', 'non_automated', 'mixed')",
            name="ck_processing_processes_processing_type",
        ),
        sa.CheckConstraint(
            "internal_network_transfer IN ('no_internal_network_transfer', 'with_internal_network_transfer')",
            name="ck_processing_processes_internal_network_transfer",
        ),
        sa.CheckConstraint(
            "internet_transfer IN ('no_internet_transfer', 'with_internet_transfer')",
            name="ck_processing_processes_internet_transfer",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("process_signature", name="uq_processing_processes_process_signature"),
    )

    op.create_table(
        "ispdn_processing_processes",
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("processing_process_id", sa.Integer(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(
            ["ispdn_id"],
            ["ispdn_cards.id"],
            name="fk_ispdn_processing_processes_ispdn_id_ispdn_cards",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["processing_process_id"],
            ["processing_processes_new.id"],
            name="fk_ispdn_processing_processes_process_id_processes",
            ondelete="RESTRICT",
        ),
        sa.PrimaryKeyConstraint("ispdn_id", "processing_process_id"),
    )

    bind = op.get_bind()
    old_rows = bind.execute(
        sa.text(
            """
            SELECT
                pp.id,
                pp.ispdn_id,
                pp.subject_categories,
                pp.data_categories,
                pp.legal_bases,
                pp.personal_data_actions,
                pp.processing_type,
                pp.internal_network_transfer,
                pp.internet_transfer,
                pp.cross_border_transfer,
                pp.created_at,
                pp.updated_at,
                purpose.name AS purpose_name,
                purpose.processing_period
            FROM processing_processes pp
            JOIN processing_purposes purpose ON purpose.id = pp.processing_purpose_id
            ORDER BY pp.id ASC
            """,
        ),
    ).mappings()

    signature_to_new_id: dict[str, int] = {}
    for row in old_rows:
        payload = {
            "name": row["purpose_name"],
            "purpose_name": row["purpose_name"],
            "processing_period": row["processing_period"],
            "subject_categories": row["subject_categories"],
            "data_categories": row["data_categories"],
            "legal_bases": row["legal_bases"],
            "personal_data_actions": row["personal_data_actions"],
            "processing_type": row["processing_type"],
            "internal_network_transfer": row["internal_network_transfer"],
            "internet_transfer": row["internet_transfer"],
            "cross_border_transfer": row["cross_border_transfer"],
        }
        signature = _build_processing_process_signature(payload)
        new_id = signature_to_new_id.get(signature)
        if new_id is None:
            new_id = row["id"]
            bind.execute(
                sa.text(
                    """
                    INSERT INTO processing_processes_new (
                        id,
                        name,
                        purpose_name,
                        processing_period,
                        subject_categories,
                        data_categories,
                        legal_bases,
                        personal_data_actions,
                        processing_type,
                        internal_network_transfer,
                        internet_transfer,
                        cross_border_transfer,
                        process_signature,
                        created_at,
                        updated_at
                    )
                    VALUES (
                        :id,
                        :name,
                        :purpose_name,
                        :processing_period,
                        CAST(:subject_categories AS jsonb),
                        CAST(:data_categories AS jsonb),
                        CAST(:legal_bases AS jsonb),
                        CAST(:personal_data_actions AS jsonb),
                        :processing_type,
                        :internal_network_transfer,
                        :internet_transfer,
                        :cross_border_transfer,
                        :process_signature,
                        :created_at,
                        :updated_at
                    )
                    """,
                ),
                {
                    "id": new_id,
                    "name": payload["name"],
                    "purpose_name": payload["purpose_name"],
                    "processing_period": payload["processing_period"],
                    "subject_categories": json.dumps(payload["subject_categories"]),
                    "data_categories": json.dumps(payload["data_categories"]),
                    "legal_bases": json.dumps(payload["legal_bases"]),
                    "personal_data_actions": json.dumps(payload["personal_data_actions"]),
                    "processing_type": payload["processing_type"],
                    "internal_network_transfer": payload["internal_network_transfer"],
                    "internet_transfer": payload["internet_transfer"],
                    "cross_border_transfer": payload["cross_border_transfer"],
                    "process_signature": signature,
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                },
            )
            signature_to_new_id[signature] = new_id

        bind.execute(
            sa.text(
                """
                INSERT INTO ispdn_processing_processes (ispdn_id, processing_process_id, created_at)
                VALUES (:ispdn_id, :processing_process_id, :created_at)
                ON CONFLICT (ispdn_id, processing_process_id) DO NOTHING
                """,
            ),
            {
                "ispdn_id": row["ispdn_id"],
                "processing_process_id": new_id,
                "created_at": row["created_at"],
            },
        )

    op.drop_table("processing_processes")
    op.rename_table("processing_processes_new", "processing_processes")

    op.create_index(op.f("ix_processing_processes_id"), "processing_processes", ["id"], unique=False)
    op.create_index(op.f("ix_processing_processes_name"), "processing_processes", ["name"], unique=False)
    op.create_index(
        op.f("ix_processing_processes_purpose_name"),
        "processing_processes",
        ["purpose_name"],
        unique=False,
    )
    op.create_index(
        op.f("ix_processing_processes_process_signature"),
        "processing_processes",
        ["process_signature"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ispdn_processing_processes_ispdn_id"),
        "ispdn_processing_processes",
        ["ispdn_id"],
        unique=False,
    )
    op.create_index(
        op.f("ix_ispdn_processing_processes_processing_process_id"),
        "ispdn_processing_processes",
        ["processing_process_id"],
        unique=False,
    )
    bind.execute(
        sa.text(
            "SELECT setval(pg_get_serial_sequence('processing_processes', 'id'), "
            "COALESCE((SELECT max(id) FROM processing_processes), 1), true)"
        )
    )

    op.drop_table("ispdn_processing_purposes")
    op.drop_table("processing_purposes")
    op.drop_column("ispdn_cards", "processing_purposes")


def downgrade() -> None:
    # Full semantic downgrade is lossy: ProcessingPurpose no longer has a stable separate identity
    # after processes have been edited with copy-on-write. Recreate the old shape from current
    # process purpose_name + processing_period pairs and keep one old process row per link.
    op.add_column("ispdn_cards", sa.Column("processing_purposes", sa.Text(), nullable=True))

    op.create_table(
        "processing_purposes",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("processing_period", sa.String(length=1000), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.CheckConstraint("length(trim(name)) > 0", name="ck_processing_purposes_name_not_empty"),
        sa.CheckConstraint(
            "length(trim(processing_period)) > 0",
            name="ck_processing_purposes_processing_period_not_empty",
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name", name="uq_processing_purposes_name"),
    )
    op.create_index(op.f("ix_processing_purposes_id"), "processing_purposes", ["id"], unique=False)

    op.create_table(
        "processing_processes_old",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("processing_purpose_id", sa.Integer(), nullable=False),
        sa.Column("subject_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("data_categories", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("legal_bases", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("personal_data_actions", postgresql.JSONB(astext_type=sa.Text()), nullable=False),
        sa.Column("processing_type", sa.String(length=32), nullable=False),
        sa.Column("internal_network_transfer", sa.String(length=64), nullable=False),
        sa.Column("internet_transfer", sa.String(length=64), nullable=False),
        sa.Column("cross_border_transfer", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["ispdn_id"], ["ispdn_cards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["processing_purpose_id"], ["processing_purposes.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("id"),
    )

    op.create_table(
        "ispdn_processing_purposes",
        sa.Column("ispdn_id", sa.Integer(), nullable=False),
        sa.Column("processing_purpose_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["ispdn_id"], ["ispdn_cards.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["processing_purpose_id"], ["processing_purposes.id"], ondelete="RESTRICT"),
        sa.PrimaryKeyConstraint("ispdn_id", "processing_purpose_id"),
    )

    bind = op.get_bind()
    rows = bind.execute(
        sa.text(
            """
            SELECT
                ipp.ispdn_id,
                pp.*
            FROM ispdn_processing_processes ipp
            JOIN processing_processes pp ON pp.id = ipp.processing_process_id
            ORDER BY ipp.ispdn_id ASC, ipp.created_at ASC, pp.id ASC
            """,
        ),
    ).mappings()

    purpose_name_to_id: dict[str, int] = {}
    next_purpose_id = 1
    next_process_id = 1
    card_purpose_names: dict[int, list[str]] = {}

    for row in rows:
        purpose_id = purpose_name_to_id.get(row["purpose_name"])
        if purpose_id is None:
            purpose_id = next_purpose_id
            next_purpose_id += 1
            purpose_name_to_id[row["purpose_name"]] = purpose_id
            bind.execute(
                sa.text(
                    """
                    INSERT INTO processing_purposes (id, name, processing_period, created_at, updated_at)
                    VALUES (:id, :name, :processing_period, :created_at, :updated_at)
                    """,
                ),
                {
                    "id": purpose_id,
                    "name": row["purpose_name"],
                    "processing_period": row["processing_period"],
                    "created_at": row["created_at"],
                    "updated_at": row["updated_at"],
                },
            )

        bind.execute(
            sa.text(
                """
                INSERT INTO processing_processes_old (
                    id,
                    ispdn_id,
                    processing_purpose_id,
                    subject_categories,
                    data_categories,
                    legal_bases,
                    personal_data_actions,
                    processing_type,
                    internal_network_transfer,
                    internet_transfer,
                    cross_border_transfer,
                    created_at,
                    updated_at
                )
                VALUES (
                    :id,
                    :ispdn_id,
                    :processing_purpose_id,
                    CAST(:subject_categories AS jsonb),
                    CAST(:data_categories AS jsonb),
                    CAST(:legal_bases AS jsonb),
                    CAST(:personal_data_actions AS jsonb),
                    :processing_type,
                    :internal_network_transfer,
                    :internet_transfer,
                    :cross_border_transfer,
                    :created_at,
                    :updated_at
                )
                """,
            ),
            {
                "id": next_process_id,
                "ispdn_id": row["ispdn_id"],
                "processing_purpose_id": purpose_id,
                "subject_categories": json.dumps(row["subject_categories"]),
                "data_categories": json.dumps(row["data_categories"]),
                "legal_bases": json.dumps(row["legal_bases"]),
                "personal_data_actions": json.dumps(row["personal_data_actions"]),
                "processing_type": row["processing_type"],
                "internal_network_transfer": row["internal_network_transfer"],
                "internet_transfer": row["internet_transfer"],
                "cross_border_transfer": row["cross_border_transfer"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            },
        )
        next_process_id += 1
        bind.execute(
            sa.text(
                """
                INSERT INTO ispdn_processing_purposes (ispdn_id, processing_purpose_id)
                VALUES (:ispdn_id, :processing_purpose_id)
                ON CONFLICT (ispdn_id, processing_purpose_id) DO NOTHING
                """,
            ),
            {"ispdn_id": row["ispdn_id"], "processing_purpose_id": purpose_id},
        )
        card_purpose_names.setdefault(row["ispdn_id"], []).append(row["purpose_name"])

    for ispdn_id, names in card_purpose_names.items():
        bind.execute(
            sa.text("UPDATE ispdn_cards SET processing_purposes = :value WHERE id = :ispdn_id"),
            {"ispdn_id": ispdn_id, "value": "\n".join(dict.fromkeys(names))},
        )
    bind.execute(sa.text("UPDATE ispdn_cards SET processing_purposes = '' WHERE processing_purposes IS NULL"))
    op.alter_column("ispdn_cards", "processing_purposes", nullable=False)

    op.drop_index(op.f("ix_ispdn_processing_processes_processing_process_id"), table_name="ispdn_processing_processes")
    op.drop_index(op.f("ix_ispdn_processing_processes_ispdn_id"), table_name="ispdn_processing_processes")
    op.drop_table("ispdn_processing_processes")
    op.drop_index(op.f("ix_processing_processes_process_signature"), table_name="processing_processes")
    op.drop_index(op.f("ix_processing_processes_purpose_name"), table_name="processing_processes")
    op.drop_index(op.f("ix_processing_processes_name"), table_name="processing_processes")
    op.drop_index(op.f("ix_processing_processes_id"), table_name="processing_processes")
    op.drop_table("processing_processes")
    op.rename_table("processing_processes_old", "processing_processes")
    op.create_index(op.f("ix_processing_processes_id"), "processing_processes", ["id"], unique=False)
    op.create_index(op.f("ix_processing_processes_ispdn_id"), "processing_processes", ["ispdn_id"], unique=False)
    op.create_index(
        op.f("ix_processing_processes_processing_purpose_id"),
        "processing_processes",
        ["processing_purpose_id"],
        unique=False,
    )
    op.create_index(op.f("ix_ispdn_processing_purposes_ispdn_id"), "ispdn_processing_purposes", ["ispdn_id"])
    op.create_index(
        op.f("ix_ispdn_processing_purposes_processing_purpose_id"),
        "ispdn_processing_purposes",
        ["processing_purpose_id"],
    )


def _build_processing_process_signature(payload: Mapping[str, Any]) -> str:
    normalized_payload = {
        "name": _normalize_string(payload["name"]),
        "purpose_name": _normalize_string(payload["purpose_name"]),
        "processing_period": _normalize_string(payload["processing_period"]),
        "subject_categories": _normalize_json_value(payload["subject_categories"]),
        "data_categories": _normalize_json_value(payload["data_categories"]),
        "legal_bases": _normalize_json_value(payload["legal_bases"]),
        "personal_data_actions": _normalize_json_value(payload["personal_data_actions"]),
        "processing_type": _normalize_string(payload["processing_type"]),
        "internal_network_transfer": _normalize_string(payload["internal_network_transfer"]),
        "internet_transfer": _normalize_string(payload["internet_transfer"]),
        "cross_border_transfer": payload["cross_border_transfer"],
    }
    stable_json = json.dumps(normalized_payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()


def _normalize_json_value(value: Any) -> Any:
    if isinstance(value, str):
        return _normalize_string(value)
    if isinstance(value, Mapping):
        return {str(key): _normalize_json_value(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [_normalize_json_value(item) for item in value]
    return value


def _normalize_string(value: str) -> str:
    return value.strip()
