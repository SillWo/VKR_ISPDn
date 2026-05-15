from datetime import datetime, timedelta
from typing import TYPE_CHECKING

from sqlalchemy.exc import IntegrityError

from app.core.security import (
    ACCESS_TOKEN_EXPIRE_DAYS,
    generate_access_token,
    generate_password_salt,
    hash_password,
    hash_token,
    verify_password,
)
from app.models.user import User, UserSession
from app.repositories.auth import AuthRepository
from app.schemas.auth import AuthTokenResponse, AuthUserRead, LoginRequest, RegisterRequest

if TYPE_CHECKING:
    from app.services.task_automation import TaskAutomationService


class AuthUsernameConflictError(Exception):
    pass


class AuthInvalidCredentialsError(Exception):
    pass


class AuthForbiddenError(Exception):
    pass


class AuthService:
    def __init__(
        self,
        repository: AuthRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.task_automation_service = task_automation_service

    def register(self, payload: RegisterRequest) -> AuthTokenResponse:
        if self.repository.get_user_by_username(payload.username) is not None:
            raise AuthUsernameConflictError

        salt = generate_password_salt()
        password_hash = hash_password(payload.password, salt)
        try:
            organization = self.repository.create_organization(payload.organization_name)
            user = self.repository.create_user(
                username=payload.username,
                password_hash=password_hash,
                password_salt=salt,
                organization_id=organization.id,
            )
            owner_role = self.repository.get_or_create_owner_role()
            owner_role.permissions = self.repository.get_or_create_permissions()
            user.roles.append(owner_role)
            response = self._create_token_response(user)
            if self.task_automation_service is not None:
                self.task_automation_service.create_first_steps_event(organization.id, commit=False)
            self.repository.commit()
            return response
        except IntegrityError as exc:
            self.repository.rollback()
            raise AuthUsernameConflictError from exc

    def login(self, payload: LoginRequest) -> AuthTokenResponse:
        user = self.repository.get_user_by_username(payload.username)
        if user is None or not user.is_active:
            raise AuthInvalidCredentialsError
        if not verify_password(payload.password, user.password_salt, user.password_hash):
            raise AuthInvalidCredentialsError
        response = self._create_token_response(user)
        self.repository.commit()
        return response

    def logout(self, session: UserSession) -> None:
        self.repository.revoke_session(session, datetime.utcnow())
        self.repository.commit()

    def me(self, user: User) -> AuthUserRead:
        return self._to_user_read(user)

    def delete_current_organization(self, user: User) -> None:
        if not user.is_owner:
            raise AuthForbiddenError
        self.repository.delete_organization(user.organization_id)
        self.repository.commit()

    def _create_token_response(self, user: User) -> AuthTokenResponse:
        token = generate_access_token()
        self.repository.create_session(
            user_id=user.id,
            token_hash=hash_token(token),
            expires_at=datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        )
        return AuthTokenResponse(access_token=token, user=self._to_user_read(user))

    @staticmethod
    def _to_user_read(user: User) -> AuthUserRead:
        return AuthUserRead(
            id=user.id,
            username=user.username,
            organization_id=user.organization_id,
            organization_name=user.organization.name,
            employee_id=user.employee_id,
            is_owner=user.is_owner,
        )
