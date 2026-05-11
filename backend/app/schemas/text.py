def strip_required_text(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Field cannot be empty")
    return value.strip()


def strip_optional_text(value: object) -> str | None:
    if value is None:
        return None
    if not isinstance(value, str):
        raise ValueError("Field must be a string")
    value = value.strip()
    return value or None
