from __future__ import annotations

import hashlib
import json
from typing import Any, Mapping


def build_processing_process_signature(payload: Mapping[str, Any]) -> str:
    purpose_name = _normalize_string(payload["purpose_name"])
    normalized_payload = {
        "name": purpose_name,
        "purpose_name": purpose_name,
        "processing_period": _normalize_string(payload["processing_period"]),
        "subject_categories": _normalize_json_value(payload["subject_categories"]),
        "data_categories": _normalize_json_value(payload["data_categories"]),
        "legal_bases": _normalize_json_value(payload["legal_bases"]),
        "personal_data_actions": _normalize_json_value(payload["personal_data_actions"]),
        "processing_type": _normalize_string(payload["processing_type"]),
        "internal_network_transfer": _normalize_string(payload["internal_network_transfer"]),
        "internet_transfer": _normalize_string(payload["internet_transfer"]),
        "cross_border_transfer": payload["cross_border_transfer"],
    }
    stable_json = json.dumps(normalized_payload, ensure_ascii=False, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(stable_json.encode("utf-8")).hexdigest()


def _normalize_json_value(value: Any) -> Any:
    if isinstance(value, str):
        return _normalize_string(value)
    if isinstance(value, Mapping):
        return {str(key): _normalize_json_value(value[key]) for key in sorted(value)}
    if isinstance(value, list):
        return [_normalize_json_value(item) for item in value]
    return value


def _normalize_string(value: str) -> str:
    return value.strip()
