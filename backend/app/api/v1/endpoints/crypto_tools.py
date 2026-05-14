from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.repositories.crypto_tool import CryptoToolRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.repositories.security_level import SecurityLevelRepository
from app.repositories.security_measure import SecurityMeasureRepository
from app.repositories.task_event import TaskEventRepository
from app.schemas.crypto_tool import (
    CryptoToolCreate,
    CryptoToolListItem,
    CryptoToolOption,
    CryptoToolRead,
    CryptoToolUpdate,
    IspdnCryptographyRead,
    IspdnCryptographyUpdate,
)
from app.services.crypto_tool import (
    CryptoToolInUseError,
    CryptoToolIspdnNotFoundError,
    CryptoToolLinkedItemNotFoundError,
    CryptoToolNotFoundError,
    CryptoToolService,
)
from app.services.task_automation import TaskAutomationService

router = APIRouter(tags=["crypto-tools"])


def get_crypto_tool_service(db: Session = Depends(get_db)) -> CryptoToolService:
    ispdn_repository = IspdnRepository(db)
    return CryptoToolService(
        CryptoToolRepository(db),
        TaskAutomationService(
            TaskEventRepository(db),
            ispdn_repository,
            ProcessingProcessRepository(db),
            SecurityLevelRepository(db),
            SecurityMeasureRepository(db),
        ),
    )


@router.get("/crypto-tools", response_model=list[CryptoToolListItem])
def list_crypto_tools(
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_crypto_tools(current_user.organization_id)


@router.post("/crypto-tools", response_model=CryptoToolRead, status_code=status.HTTP_201_CREATED)
def create_crypto_tool(
    payload: CryptoToolCreate,
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    return service.create_crypto_tool(payload, current_user.organization_id)


@router.get("/crypto-tools/options", response_model=list[CryptoToolOption])
def list_crypto_tool_options(
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    return service.list_options(current_user.organization_id)


@router.get("/crypto-tools/{crypto_tool_id}", response_model=CryptoToolRead)
def get_crypto_tool(
    crypto_tool_id: int,
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_crypto_tool(crypto_tool_id, current_user.organization_id)
    except CryptoToolNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crypto tool not found") from exc


@router.put("/crypto-tools/{crypto_tool_id}", response_model=CryptoToolRead)
def update_crypto_tool(
    crypto_tool_id: int,
    payload: CryptoToolUpdate,
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.update_crypto_tool(crypto_tool_id, payload, current_user.organization_id)
    except CryptoToolNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crypto tool not found") from exc


@router.delete("/crypto-tools/{crypto_tool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crypto_tool(
    crypto_tool_id: int,
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    try:
        service.delete_crypto_tool(crypto_tool_id, current_user.organization_id)
    except CryptoToolNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crypto tool not found") from exc
    except CryptoToolInUseError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Crypto tool is linked to one or more Ispdn cards and cannot be deleted",
        ) from exc


@router.get("/ispdns/{ispdn_id}/cryptography", response_model=IspdnCryptographyRead)
def get_ispdn_cryptography(
    ispdn_id: int,
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.get_ispdn_cryptography(ispdn_id, current_user.organization_id)
    except CryptoToolIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/ispdns/{ispdn_id}/cryptography", response_model=IspdnCryptographyRead)
def update_ispdn_cryptography(
    ispdn_id: int,
    payload: IspdnCryptographyUpdate,
    service: CryptoToolService = Depends(get_crypto_tool_service),
    current_user: User = Depends(get_current_user),
):
    try:
        return service.set_ispdn_cryptography(ispdn_id, payload, current_user.organization_id)
    except CryptoToolIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except CryptoToolLinkedItemNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more crypto tools not found") from exc
