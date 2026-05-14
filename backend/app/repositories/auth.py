from datetime import datetime

from sqlalchemy import delete, select
from sqlalchemy.orm import Session, joinedload

from app.models.organization import Organization
from app.models.user import Permission, Role, User, UserSession


class AuthRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_user_by_username(self, username: str) -> User | None:
        statement = (
            select(User)
            .options(joinedload(User.organization))
            .where(User.username == username)
        )
        return self.db.scalars(statement).first()

    def get_session_by_token_hash(self, token_hash: str) -> UserSession | None:
        statement = (
            select(UserSession)
            .options(joinedload(UserSession.user).joinedload(User.organization))
            .where(UserSession.token_hash == token_hash)
        )
        return self.db.scalars(statement).first()

    def create_organization(self, name: str) -> Organization:
        organization = Organization(name=name)
        self.db.add(organization)
        self.db.flush()
        return organization

    def create_user(
        self,
        *,
        username: str,
        password_hash: str,
        password_salt: str,
        organization_id: int,
    ) -> User:
        user = User(
            username=username,
            password_hash=password_hash,
            password_salt=password_salt,
            organization_id=organization_id,
            is_owner=True,
            is_active=True,
        )
        self.db.add(user)
        self.db.flush()
        return user

    def get_or_create_owner_role(self) -> Role:
        role = self.db.scalars(select(Role).where(Role.organization_id.is_(None), Role.code == "owner")).first()
        if role is not None:
            return role
        role = Role(organization_id=None, code="owner", name="Владелец организации")
        self.db.add(role)
        self.db.flush()
        return role

    def get_or_create_permissions(self) -> list[Permission]:
        permissions: list[Permission] = []
        names = {
            "platform.full_access": "Полный доступ к платформе",
            "organization.manage": "Управление организацией",
            "users.manage": "Управление пользователями",
            "employees.self_edit": "Редактирование собственной карточки сотрудника",
        }
        for code, name in names.items():
            permission = self.db.scalars(select(Permission).where(Permission.code == code)).first()
            if permission is None:
                permission = Permission(code=code, name=name)
                self.db.add(permission)
                self.db.flush()
            permissions.append(permission)
        return permissions

    def create_session(self, *, user_id: int, token_hash: str, expires_at: datetime) -> UserSession:
        session = UserSession(user_id=user_id, token_hash=token_hash, expires_at=expires_at)
        self.db.add(session)
        self.db.flush()
        return session

    def revoke_session(self, session: UserSession, revoked_at: datetime) -> None:
        session.revoked_at = revoked_at
        self.db.flush()

    def delete_organization(self, organization_id: int) -> None:
        self.db.execute(delete(Organization).where(Organization.id == organization_id))
        self.db.flush()

    def commit(self) -> None:
        self.db.commit()

    def rollback(self) -> None:
        self.db.rollback()
