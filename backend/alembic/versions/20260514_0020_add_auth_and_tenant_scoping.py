"""add auth and tenant scoping

Revision ID: 20260514_0020
Revises: 20260512_0019
Create Date: 2026-05-14 00:20:00.000000

"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "20260514_0020"
down_revision: str | None = "20260512_0019"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

TEST_ORGANIZATION_NAME = "Test Organization"
TEST_USERNAME = "TestUser"
TEST_PASSWORD_SALT = "testuser-local-dev-salt"
TEST_PASSWORD_HASH = "c274620a5bcee817fecd8333e044096e651a43e8110a46fadd85a2b0d6fc2d98"


def upgrade() -> None:
    op.create_table(
        "organizations",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_organizations_id"), "organizations", ["id"], unique=False)

    bind = op.get_bind()
    organization_id = bind.execute(
        sa.text(
            """
            INSERT INTO organizations (name)
            VALUES (:name)
            RETURNING id
            """,
        ),
        {"name": TEST_ORGANIZATION_NAME},
    ).scalar_one()

    _add_tenant_column("organization_card", organization_id)
    op.drop_constraint("ck_organization_card_singleton_id", "organization_card", type_="check")
    op.create_unique_constraint("uq_organization_card_organization_id", "organization_card", ["organization_id"])

    op.drop_constraint("uq_departments_name", "departments", type_="unique")
    _add_tenant_column("departments", organization_id)
    op.create_unique_constraint("uq_departments_organization_name", "departments", ["organization_id", "name"])

    _add_tenant_column("employees", organization_id)
    _add_tenant_column("ispdn_cards", organization_id)
    op.drop_constraint("fk_ispdn_cards_responsible_employee_id_employees", "ispdn_cards", type_="foreignkey")
    op.create_foreign_key(
        "fk_ispdn_cards_responsible_employee_id_employees",
        "ispdn_cards",
        "employees",
        ["responsible_employee_id"],
        ["id"],
        ondelete="SET NULL",
    )

    op.drop_constraint("uq_processing_processes_process_signature", "processing_processes", type_="unique")
    _add_tenant_column("processing_processes", organization_id)
    op.create_unique_constraint(
        "uq_processing_processes_org_signature",
        "processing_processes",
        ["organization_id", "process_signature"],
    )

    op.drop_constraint("uq_control_events_name", "control_events", type_="unique")
    _add_tenant_column("control_events", organization_id)
    op.create_unique_constraint("uq_control_events_organization_name", "control_events", ["organization_id", "name"])

    _add_tenant_column("data_centers", organization_id)
    _add_tenant_column("crypto_tools", organization_id)
    _add_tenant_column("task_events", organization_id)

    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("username", sa.String(length=255), nullable=False),
        sa.Column("password_hash", sa.String(length=255), nullable=False),
        sa.Column("password_salt", sa.String(length=255), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=False),
        sa.Column("employee_id", sa.Integer(), nullable=True),
        sa.Column("is_owner", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("is_active", sa.Boolean(), server_default="true", nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["employee_id"], ["employees.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_users_id"), "users", ["id"], unique=False)
    op.create_index(op.f("ix_users_username"), "users", ["username"], unique=True)
    op.create_index(op.f("ix_users_organization_id"), "users", ["organization_id"], unique=False)
    op.create_index(op.f("ix_users_employee_id"), "users", ["employee_id"], unique=False)

    op.create_table(
        "user_sessions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("token_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("expires_at", sa.DateTime(), nullable=False),
        sa.Column("revoked_at", sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_user_sessions_id"), "user_sessions", ["id"], unique=False)
    op.create_index(op.f("ix_user_sessions_user_id"), "user_sessions", ["user_id"], unique=False)
    op.create_index(op.f("ix_user_sessions_token_hash"), "user_sessions", ["token_hash"], unique=True)
    op.create_index(op.f("ix_user_sessions_expires_at"), "user_sessions", ["expires_at"], unique=False)
    op.create_index(op.f("ix_user_sessions_revoked_at"), "user_sessions", ["revoked_at"], unique=False)

    op.create_table(
        "roles",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("organization_id", sa.Integer(), nullable=True),
        sa.Column("code", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["organization_id"], ["organizations.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("organization_id", "code", name="uq_roles_organization_code"),
    )
    op.create_index(op.f("ix_roles_id"), "roles", ["id"], unique=False)
    op.create_index(op.f("ix_roles_organization_id"), "roles", ["organization_id"], unique=False)

    op.create_table(
        "permissions",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("code", sa.String(length=128), nullable=False),
        sa.Column("name", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_permissions_id"), "permissions", ["id"], unique=False)
    op.create_index(op.f("ix_permissions_code"), "permissions", ["code"], unique=True)

    op.create_table(
        "user_roles",
        sa.Column("user_id", sa.Integer(), nullable=False),
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("user_id", "role_id"),
    )
    op.create_table(
        "role_permissions",
        sa.Column("role_id", sa.Integer(), nullable=False),
        sa.Column("permission_id", sa.Integer(), nullable=False),
        sa.ForeignKeyConstraint(["permission_id"], ["permissions.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["role_id"], ["roles.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("role_id", "permission_id"),
    )

    user_id = bind.execute(
        sa.text(
            """
            INSERT INTO users (
                username, password_hash, password_salt, organization_id, employee_id, is_owner, is_active
            )
            VALUES (
                :username, :password_hash, :password_salt, :organization_id, NULL, TRUE, TRUE
            )
            RETURNING id
            """,
        ),
        {
            "username": TEST_USERNAME,
            "password_hash": TEST_PASSWORD_HASH,
            "password_salt": TEST_PASSWORD_SALT,
            "organization_id": organization_id,
        },
    ).scalar_one()
    owner_role_id = bind.execute(
        sa.text(
            """
            INSERT INTO roles (organization_id, code, name)
            VALUES (NULL, 'owner', 'Владелец организации')
            RETURNING id
            """,
        ),
    ).scalar_one()
    permission_rows = [
        ("platform.full_access", "Полный доступ к платформе"),
        ("organization.manage", "Управление организацией"),
        ("users.manage", "Управление пользователями"),
        ("employees.self_edit", "Редактирование собственной карточки сотрудника"),
    ]
    for code, name in permission_rows:
        permission_id = bind.execute(
            sa.text("INSERT INTO permissions (code, name) VALUES (:code, :name) RETURNING id"),
            {"code": code, "name": name},
        ).scalar_one()
        bind.execute(
            sa.text("INSERT INTO role_permissions (role_id, permission_id) VALUES (:role_id, :permission_id)"),
            {"role_id": owner_role_id, "permission_id": permission_id},
        )
    bind.execute(
        sa.text("INSERT INTO user_roles (user_id, role_id) VALUES (:user_id, :role_id)"),
        {"user_id": user_id, "role_id": owner_role_id},
    )


def downgrade() -> None:
    op.drop_table("role_permissions")
    op.drop_table("user_roles")
    op.drop_index(op.f("ix_permissions_code"), table_name="permissions")
    op.drop_index(op.f("ix_permissions_id"), table_name="permissions")
    op.drop_table("permissions")
    op.drop_index(op.f("ix_roles_organization_id"), table_name="roles")
    op.drop_index(op.f("ix_roles_id"), table_name="roles")
    op.drop_table("roles")
    op.drop_index(op.f("ix_user_sessions_revoked_at"), table_name="user_sessions")
    op.drop_index(op.f("ix_user_sessions_expires_at"), table_name="user_sessions")
    op.drop_index(op.f("ix_user_sessions_token_hash"), table_name="user_sessions")
    op.drop_index(op.f("ix_user_sessions_user_id"), table_name="user_sessions")
    op.drop_index(op.f("ix_user_sessions_id"), table_name="user_sessions")
    op.drop_table("user_sessions")
    op.drop_index(op.f("ix_users_employee_id"), table_name="users")
    op.drop_index(op.f("ix_users_organization_id"), table_name="users")
    op.drop_index(op.f("ix_users_username"), table_name="users")
    op.drop_index(op.f("ix_users_id"), table_name="users")
    op.drop_table("users")

    _drop_tenant_column("task_events")
    _drop_tenant_column("crypto_tools")
    _drop_tenant_column("data_centers")

    op.drop_constraint("uq_control_events_organization_name", "control_events", type_="unique")
    _drop_tenant_column("control_events")
    op.create_unique_constraint("uq_control_events_name", "control_events", ["name"])

    op.drop_constraint("uq_processing_processes_org_signature", "processing_processes", type_="unique")
    _drop_tenant_column("processing_processes")
    op.create_unique_constraint("uq_processing_processes_process_signature", "processing_processes", ["process_signature"])

    op.drop_constraint("fk_ispdn_cards_responsible_employee_id_employees", "ispdn_cards", type_="foreignkey")
    op.create_foreign_key(
        "fk_ispdn_cards_responsible_employee_id_employees",
        "ispdn_cards",
        "employees",
        ["responsible_employee_id"],
        ["id"],
    )
    _drop_tenant_column("ispdn_cards")
    _drop_tenant_column("employees")

    op.drop_constraint("uq_departments_organization_name", "departments", type_="unique")
    _drop_tenant_column("departments")
    op.create_unique_constraint("uq_departments_name", "departments", ["name"])

    op.drop_constraint("uq_organization_card_organization_id", "organization_card", type_="unique")
    _drop_tenant_column("organization_card")
    # Downgrade restores the original technical singleton check but cannot guarantee old data semantics.
    op.create_check_constraint("ck_organization_card_singleton_id", "organization_card", "id = 1")

    op.drop_index(op.f("ix_organizations_id"), table_name="organizations")
    op.drop_table("organizations")


def _add_tenant_column(table_name: str, organization_id: int) -> None:
    op.add_column(table_name, sa.Column("organization_id", sa.Integer(), nullable=True))
    op.execute(f"UPDATE {table_name} SET organization_id = {int(organization_id)}")
    op.alter_column(table_name, "organization_id", existing_type=sa.Integer(), nullable=False)
    op.create_index(op.f(f"ix_{table_name}_organization_id"), table_name, ["organization_id"], unique=False)
    op.create_foreign_key(
        f"fk_{table_name}_organization_id_organizations",
        table_name,
        "organizations",
        ["organization_id"],
        ["id"],
        ondelete="CASCADE",
    )


def _drop_tenant_column(table_name: str) -> None:
    op.drop_constraint(f"fk_{table_name}_organization_id_organizations", table_name, type_="foreignkey")
    op.drop_index(op.f(f"ix_{table_name}_organization_id"), table_name=table_name)
    op.drop_column(table_name, "organization_id")
