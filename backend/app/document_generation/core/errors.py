class DocumentGenerationError(Exception):
    """Base document generation error."""


class DocumentTypeNotFoundError(DocumentGenerationError):
    pass


class DocumentTemplateNotFoundError(DocumentGenerationError):
    pass


class DocumentRenderError(DocumentGenerationError):
    pass


class DocumentRequiresIspdnError(DocumentGenerationError):
    pass


class DocumentEmployeeNotFoundError(DocumentGenerationError):
    pass


class DocumentControlEventNotFoundError(DocumentGenerationError):
    pass
