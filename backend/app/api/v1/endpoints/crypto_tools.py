from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.repositories.crypto_tool import CryptoToolRepository
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

router = APIRouter(tags=["crypto-tools"])


def get_crypto_tool_service(db: Session = Depends(get_db)) -> CryptoToolService:
    return CryptoToolService(CryptoToolRepository(db))


@router.get("/crypto-tools", response_model=list[CryptoToolListItem])
def list_crypto_tools(service: CryptoToolService = Depends(get_crypto_tool_service)):
    return service.list_crypto_tools()


@router.post("/crypto-tools", response_model=CryptoToolRead, status_code=status.HTTP_201_CREATED)
def create_crypto_tool(
    payload: CryptoToolCreate,
    service: CryptoToolService = Depends(get_crypto_tool_service),
):
    return service.create_crypto_tool(payload)


@router.get("/crypto-tools/options", response_model=list[CryptoToolOption])
def list_crypto_tool_options(service: CryptoToolService = Depends(get_crypto_tool_service)):
    return service.list_options()


@router.get("/crypto-tools/{crypto_tool_id}", response_model=CryptoToolRead)
def get_crypto_tool(
    crypto_tool_id: int,
    service: CryptoToolService = Depends(get_crypto_tool_service),
):
    try:
        return service.get_crypto_tool(crypto_tool_id)
    except CryptoToolNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crypto tool not found") from exc


@router.put("/crypto-tools/{crypto_tool_id}", response_model=CryptoToolRead)
def update_crypto_tool(
    crypto_tool_id: int,
    payload: CryptoToolUpdate,
    service: CryptoToolService = Depends(get_crypto_tool_service),
):
    try:
        return service.update_crypto_tool(crypto_tool_id, payload)
    except CryptoToolNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Crypto tool not found") from exc


@router.delete("/crypto-tools/{crypto_tool_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_crypto_tool(
    crypto_tool_id: int,
    service: CryptoToolService = Depends(get_crypto_tool_service),
):
    try:
        service.delete_crypto_tool(crypto_tool_id)
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
):
    try:
        return service.get_ispdn_cryptography(ispdn_id)
    except CryptoToolIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc


@router.put("/ispdns/{ispdn_id}/cryptography", response_model=IspdnCryptographyRead)
def update_ispdn_cryptography(
    ispdn_id: int,
    payload: IspdnCryptographyUpdate,
    service: CryptoToolService = Depends(get_crypto_tool_service),
):
    try:
        return service.set_ispdn_cryptography(ispdn_id, payload)
    except CryptoToolIspdnNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ispdn card not found") from exc
    except CryptoToolLinkedItemNotFoundError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more crypto tools not found") from exc
