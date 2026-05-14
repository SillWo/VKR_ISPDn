from typing import TYPE_CHECKING

from app.models.crypto_tool import CryptoTool, IspdnCryptographySettings
from app.repositories.crypto_tool import CryptoToolRepository
from app.schemas.crypto_tool import CryptoToolCreate, CryptoToolUpdate, IspdnCryptographyUpdate

if TYPE_CHECKING:
    from app.services.task_automation import TaskAutomationService


class CryptoToolNotFoundError(Exception):
    pass


class CryptoToolInUseError(Exception):
    pass


class CryptoToolIspdnNotFoundError(Exception):
    pass


class CryptoToolLinkedItemNotFoundError(Exception):
    pass


class CryptoToolService:
    def __init__(
        self,
        repository: CryptoToolRepository,
        task_automation_service: "TaskAutomationService | None" = None,
    ) -> None:
        self.repository = repository
        self.task_automation_service = task_automation_service

    def list_crypto_tools(self, organization_id: int) -> list[CryptoTool]:
        return self.repository.list(organization_id)

    def list_options(self, organization_id: int) -> list[CryptoTool]:
        return self.repository.list_options(organization_id)

    def get_crypto_tool(self, crypto_tool_id: int, organization_id: int) -> CryptoTool:
        crypto_tool = self.repository.get_by_id(crypto_tool_id, organization_id)
        if crypto_tool is None:
            raise CryptoToolNotFoundError
        return crypto_tool

    def create_crypto_tool(self, payload: CryptoToolCreate, organization_id: int) -> CryptoTool:
        return self.repository.create(payload, organization_id)

    def update_crypto_tool(self, crypto_tool_id: int, payload: CryptoToolUpdate, organization_id: int) -> CryptoTool:
        crypto_tool = self.get_crypto_tool(crypto_tool_id, organization_id)
        return self.repository.update(crypto_tool, payload)

    def delete_crypto_tool(self, crypto_tool_id: int, organization_id: int) -> None:
        crypto_tool = self.get_crypto_tool(crypto_tool_id, organization_id)
        if self.repository.is_linked_to_ispdn(crypto_tool_id, organization_id):
            raise CryptoToolInUseError
        self.repository.delete(crypto_tool)

    def get_ispdn_cryptography(self, ispdn_id: int, organization_id: int) -> IspdnCryptographySettings:
        ispdn = self.repository.get_ispdn_by_id(ispdn_id, organization_id)
        if ispdn is None:
            raise CryptoToolIspdnNotFoundError

        settings = self.repository.get_ispdn_cryptography(ispdn_id, organization_id)
        if settings is not None:
            return settings

        return self.repository.set_ispdn_cryptography(
            ispdn,
            IspdnCryptographyUpdate(uses_cryptography=False, crypto_tool_ids=[]),
        )

    def set_ispdn_cryptography(
        self,
        ispdn_id: int,
        payload: IspdnCryptographyUpdate,
        organization_id: int,
    ) -> IspdnCryptographySettings:
        ispdn = self.repository.get_ispdn_by_id(ispdn_id, organization_id)
        if ispdn is None:
            raise CryptoToolIspdnNotFoundError

        if payload.uses_cryptography and self.repository.count_existing_ids(payload.crypto_tool_ids, organization_id) != len(
            payload.crypto_tool_ids,
        ):
            raise CryptoToolLinkedItemNotFoundError

        old_crypto_tool_ids = {crypto_tool.id for crypto_tool in ispdn.crypto_tools}
        is_active = ispdn.status == "active"
        settings = self.repository.set_ispdn_cryptography(ispdn, payload)

        if is_active and payload.uses_cryptography and self.task_automation_service is not None:
            new_crypto_tool_ids = set(payload.crypto_tool_ids)
            added_crypto_tool_ids = sorted(new_crypto_tool_ids - old_crypto_tool_ids)
            if added_crypto_tool_ids:
                self.task_automation_service.create_crypto_tool_added_events(ispdn_id, added_crypto_tool_ids, organization_id)

        return settings
