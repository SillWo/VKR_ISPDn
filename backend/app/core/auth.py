from datetime import datetime

from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import hash_token
from app.models.user import User, UserSession
from app.repositories.auth import AuthRepository


def get_current_session(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> UserSession:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Not authenticated",
        headers={"WWW-Authenticate": "Bearer"},
    )
    if authorization is None:
        raise credentials_error
    scheme, _, token = authorization.partition(" ")
    if scheme.lower() != "bearer" or not token:
        raise credentials_error

    session = AuthRepository(db).get_session_by_token_hash(hash_token(token))
    now = datetime.utcnow()
    if session is None or session.revoked_at is not None or session.expires_at <= now:
        raise credentials_error
    if not session.user.is_active:
        raise credentials_error
    return session


def get_current_user(session: UserSession = Depends(get_current_session)) -> User:
    return session.user
