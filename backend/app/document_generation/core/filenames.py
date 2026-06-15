import re
from urllib.parse import quote


DOCX_EXTENSION = ".docx"
INVALID_WINDOWS_FILENAME_CHARS = re.compile(r'[<>:"/\\|?*\x00-\x1f]')
WHITESPACE = re.compile(r"\s+")


def sanitize_filename_part(value: str, fallback: str = "document") -> str:
    sanitized = INVALID_WINDOWS_FILENAME_CHARS.sub(" ", value)
    sanitized = WHITESPACE.sub(" ", sanitized).strip().rstrip(" .")
    return sanitized or fallback


def build_docx_filename(title: str, suffix: str | None = None) -> str:
    safe_title = sanitize_filename_part(_remove_docx_extension(title))
    if suffix is None:
        return f"{safe_title}{DOCX_EXTENSION}"

    safe_suffix = sanitize_filename_part(_remove_docx_extension(suffix), fallback="")
    if not safe_suffix:
        return f"{safe_title}{DOCX_EXTENSION}"
    return f"{safe_title} {safe_suffix}{DOCX_EXTENSION}"


def build_content_disposition(filename: str) -> str:
    safe_filename = build_docx_filename(_remove_docx_extension(filename))
    encoded_filename = quote(safe_filename)
    ascii_fallback = safe_filename.encode("ascii", "ignore").decode("ascii").strip().strip(" .")
    if not ascii_fallback or ascii_fallback.lower() == DOCX_EXTENSION.lstrip("."):
        ascii_fallback = f"generated-document{DOCX_EXTENSION}"
    elif not ascii_fallback.lower().endswith(DOCX_EXTENSION):
        ascii_fallback = f"{ascii_fallback}{DOCX_EXTENSION}"
    return f"attachment; filename=\"{ascii_fallback}\"; filename*=UTF-8''{encoded_filename}"


def _remove_docx_extension(value: str) -> str:
    if value.lower().endswith(DOCX_EXTENSION):
        return value[: -len(DOCX_EXTENSION)]
    return value
