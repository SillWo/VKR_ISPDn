from app.models.crypto_tool import CryptoTool, IspdnCryptographySettings
from app.repositories.crypto_tool import CryptoToolRepository
from app.schemas.crypto_tool import CryptoToolCreate, CryptoToolUpdate, IspdnCryptographyUpdate


class CryptoToolNotFoundError(Exception):
    pass


class CryptoToolInUseError(Exception):
    pass


class CryptoToolIspdnNotFoundError(Exception):
    pass


class CryptoToolLinkedItemNotFoundError(Exception):
    pass


class CryptoToolService:
    def __init__(self, repository: CryptoToolRepository) -> None:
        self.repository = repository

    def list_crypto_tools(self) -> list[CryptoTool]:
        return self.repository.list()

    def list_options(self) -> list[CryptoTool]:
        return self.repository.list_options()

    def get_crypto_tool(self, crypto_tool_id: int) -> CryptoTool:
        crypto_tool = self.repository.get_by_id(crypto_tool_id)
        if crypto_tool is None:
            raise CryptoToolNotFoundError
        return crypto_tool

    def create_crypto_tool(self, payload: CryptoToolCreate) -> CryptoTool:
        return self.repository.create(payload)

    def update_crypto_tool(self, crypto_tool_id: int, payload: CryptoToolUpdate) -> CryptoTool:
        crypto_tool = self.get_crypto_tool(crypto_tool_id)
        return self.repository.update(crypto_tool, payload)

    def delete_crypto_tool(self, crypto_tool_id: int) -> None:
        crypto_tool = self.get_crypto_tool(crypto_tool_id)
        if self.repository.is_linked_to_ispdn(crypto_tool_id):
            raise CryptoToolInUseError
        self.repository.delete(crypto_tool)

    def get_ispdn_cryptography(self, ispdn_id: int) -> IspdnCryptographySettings:
        ispdn = self.repository.get_ispdn_by_id(ispdn_id)
        if ispdn is None:
            raise CryptoToolIspdnNotFoundError

        settings = self.repository.get_ispdn_cryptography(ispdn_id)
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
    ) -> IspdnCryptographySettings:
        ispdn = self.repository.get_ispdn_by_id(ispdn_id)
        if ispdn is None:
            raise CryptoToolIspdnNotFoundError

        if payload.uses_cryptography and self.repository.count_existing_ids(payload.crypto_tool_ids) != len(
            payload.crypto_tool_ids,
        ):
            raise CryptoToolLinkedItemNotFoundError

        return self.repository.set_ispdn_cryptography(ispdn, payload)
