def strip_required_text(value: object) -> str:
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Field cannot be empty")
    return value.strip()
