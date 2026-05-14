from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_session, get_current_user
from app.core.database import get_db
from app.models.user import User, UserSession
from app.repositories.auth import AuthRepository
from app.schemas.auth import AuthTokenResponse, AuthUserRead, LoginRequest, RegisterRequest
from app.services.auth import AuthForbiddenError, AuthInvalidCredentialsError, AuthService, AuthUsernameConflictError

router = APIRouter(prefix="/auth", tags=["auth"])


def get_auth_service(db: Session = Depends(get_db)) -> AuthService:
    return AuthService(AuthRepository(db))


@router.post("/register", response_model=AuthTokenResponse, status_code=status.HTTP_201_CREATED)
def register(payload: RegisterRequest, service: AuthService = Depends(get_auth_service)):
    try:
        return service.register(payload)
    except AuthUsernameConflictError as exc:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already exists") from exc


@router.post("/login", response_model=AuthTokenResponse)
def login(payload: LoginRequest, service: AuthService = Depends(get_auth_service)):
    try:
        return service.login(payload)
    except AuthInvalidCredentialsError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password") from exc


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
def logout(
    response: Response,
    session: UserSession = Depends(get_current_session),
    service: AuthService = Depends(get_auth_service),
):
    service.logout(session)
    response.status_code = status.HTTP_204_NO_CONTENT


@router.get("/me", response_model=AuthUserRead)
def me(current_user: User = Depends(get_current_user), service: AuthService = Depends(get_auth_service)):
    return service.me(current_user)


@router.delete("/organization", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(
    response: Response,
    current_user: User = Depends(get_current_user),
    service: AuthService = Depends(get_auth_service),
):
    try:
        service.delete_current_organization(current_user)
    except AuthForbiddenError as exc:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only organization owner can delete organization") from exc
    response.status_code = status.HTTP_204_NO_CONTENT
