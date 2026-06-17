from app.document_generation.core.document_definition import DocumentGenerator
from app.document_generation.core.errors import DocumentTypeNotFoundError
from app.document_generation.documents.act_ispdn_commissioning.generator import (
    ActIspdnCommissioningGenerator,
)
from app.document_generation.documents.act_safety_level_of_ISPDn.generator import (
    ActSafetyLevelOfIspdnGenerator,
)
from app.document_generation.documents.PDn_document.generator import PdnDocumentGenerator
from app.document_generation.documents.PDn_security.generator import PdnSecurityGenerator
from app.document_generation.documents.prikaz_otvet_za_PDn.generator import PrikazOtvetZaPdnGenerator
from app.document_generation.documents.RKN_notification.change_generator import RknNotificationChangesGenerator
from app.document_generation.documents.RKN_notification.generator import RknNotificationGenerator


class DocumentRegistry:
    def __init__(self, generators: list[DocumentGenerator]) -> None:
        self._generators = {generator.code: generator for generator in generators}

    def list_generators(self) -> list[DocumentGenerator]:
        return list(self._generators.values())

    def get_generator(self, document_type: str) -> DocumentGenerator:
        generator = self._generators.get(document_type)
        if generator is None:
            raise DocumentTypeNotFoundError(f"Unknown document type: {document_type}")
        return generator


def get_document_registry() -> DocumentRegistry:
    return DocumentRegistry(
        generators=[
            ActIspdnCommissioningGenerator(),
            ActSafetyLevelOfIspdnGenerator(),
            RknNotificationGenerator(),
            RknNotificationChangesGenerator(),
            PdnSecurityGenerator(),
            PdnDocumentGenerator(),
            PrikazOtvetZaPdnGenerator(),
        ],
    )
