from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.models.crypto_tool import CryptoTool, IspdnCryptographySettings
from app.models.ispdn import IspdnCard
from app.schemas.crypto_tool import CryptoToolCreate, CryptoToolUpdate, IspdnCryptographyUpdate


class CryptoToolRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def list(self, organization_id: int) -> list[CryptoTool]:
        statement = (
            select(CryptoTool)
            .where(CryptoTool.organization_id == organization_id)
            .order_by(CryptoTool.name.asc(), CryptoTool.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def list_options(self, organization_id: int) -> list[CryptoTool]:
        return self.list(organization_id)

    def get_by_id(self, crypto_tool_id: int, organization_id: int) -> CryptoTool | None:
        statement = (
            select(CryptoTool)
            .options(selectinload(CryptoTool.ispdn_cards))
            .where(CryptoTool.id == crypto_tool_id, CryptoTool.organization_id == organization_id)
        )
        return self.db.scalars(statement).first()

    def get_many_by_ids(self, crypto_tool_ids: list[int], organization_id: int) -> list[CryptoTool]:
        if not crypto_tool_ids:
            return []
        statement = (
            select(CryptoTool)
            .where(CryptoTool.id.in_(crypto_tool_ids), CryptoTool.organization_id == organization_id)
            .order_by(CryptoTool.name.asc(), CryptoTool.id.asc())
        )
        return list(self.db.scalars(statement).all())

    def create(self, payload: CryptoToolCreate, organization_id: int) -> CryptoTool:
        crypto_tool = CryptoTool(**payload.model_dump(), organization_id=organization_id)
        self.db.add(crypto_tool)
        self.db.commit()
        self.db.refresh(crypto_tool)
        return crypto_tool

    def update(self, crypto_tool: CryptoTool, payload: CryptoToolUpdate) -> CryptoTool:
        for field, value in payload.model_dump().items():
            setattr(crypto_tool, field, value)
        self.db.commit()
        self.db.refresh(crypto_tool)
        return crypto_tool

    def delete(self, crypto_tool: CryptoTool) -> None:
        self.db.delete(crypto_tool)
        self.db.commit()

    def is_linked_to_ispdn(self, crypto_tool_id: int, organization_id: int) -> bool:
        crypto_tool = self.get_by_id(crypto_tool_id, organization_id)
        return bool(crypto_tool and crypto_tool.ispdn_cards)

    def get_ispdn_by_id(self, ispdn_id: int, organization_id: int) -> IspdnCard | None:
        statement = (
            select(IspdnCard)
            .options(
                selectinload(IspdnCard.crypto_tools),
                joinedload(IspdnCard.cryptography_settings),
            )
            .where(IspdnCard.id == ispdn_id, IspdnCard.organization_id == organization_id)
        )
        return self.db.scalars(statement).unique().first()

    def count_existing_ids(self, crypto_tool_ids: list[int], organization_id: int) -> int:
        if not crypto_tool_ids:
            return 0
        statement = select(func.count(CryptoTool.id)).where(
            CryptoTool.id.in_(crypto_tool_ids),
            CryptoTool.organization_id == organization_id,
        )
        return int(self.db.scalar(statement) or 0)

    def get_ispdn_cryptography(self, ispdn_id: int, organization_id: int) -> IspdnCryptographySettings | None:
        statement = (
            select(IspdnCryptographySettings)
            .join(IspdnCryptographySettings.ispdn)
            .options(joinedload(IspdnCryptographySettings.ispdn).selectinload(IspdnCard.crypto_tools))
            .where(IspdnCryptographySettings.ispdn_id == ispdn_id)
            .where(IspdnCard.organization_id == organization_id)
        )
        return self.db.scalars(statement).unique().first()

    def set_ispdn_cryptography(
        self,
        ispdn: IspdnCard,
        payload: IspdnCryptographyUpdate,
    ) -> IspdnCryptographySettings:
        settings = ispdn.cryptography_settings
        if settings is None:
            settings = IspdnCryptographySettings(ispdn=ispdn)
            self.db.add(settings)

        settings.uses_cryptography = payload.uses_cryptography
        ispdn.crypto_tools = self.get_many_by_ids(payload.crypto_tool_ids, ispdn.organization_id) if payload.uses_cryptography else []
        self.db.commit()
        return self.get_ispdn_cryptography(ispdn.id, ispdn.organization_id) or settings
