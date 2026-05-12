from __future__ import annotations

import re
from collections.abc import Iterable, Mapping
from typing import Any


PROCESSING_TYPE_COVERAGE = {
    "automated": {"automated"},
    "non_automated": {"non_automated"},
    "mixed": {"automated", "non_automated", "mixed"},
}

INTERNAL_NETWORK_TRANSFER_COVERAGE = {
    "no_internal_network_transfer": {"no_internal_network_transfer"},
    "with_internal_network_transfer": {"no_internal_network_transfer", "with_internal_network_transfer"},
}

INTERNET_TRANSFER_COVERAGE = {
    "no_internet_transfer": {"no_internet_transfer"},
    "with_internet_transfer": {"no_internet_transfer", "with_internet_transfer"},
}


def filter_subsumed_processing_processes(processes: Iterable[Any]) -> list[Any]:
    process_list = list(processes)
    return [
        process
        for process in process_list
        if not any(
            other is not process and processing_process_strictly_contains(other, process)
            for other in process_list
        )
    ]


def filter_subsumed_processing_processes_by_name(processes: Iterable[Any]) -> list[Any]:
    process_list = list(processes)
    return [
        process
        for process in process_list
        if not any(
            other is not process
            and _same_normalized_name(other, process)
            and _processing_process_details_strictly_contain(other, process)
            for other in process_list
        )
    ]


def processing_process_strictly_contains(container: Any, contained: Any) -> bool:
    return processing_process_contains(container, contained) and not processing_process_contains(contained, container)


def processing_process_contains(container: Any, contained: Any) -> bool:
    if not _same_base_process(container, contained):
        return False

    return _processing_process_details_contain(container, contained)


def processing_process_is_subprocess_for_task_automation(candidate: Any, existing: Any) -> bool:
    if _same_process_identity(candidate, existing):
        return False
    if not _same_purpose_and_period_for_task_automation(candidate, existing):
        return False

    return (
        _selected_values_include_casefold(_value(existing, "subject_categories"), _value(candidate, "subject_categories"))
        and _selected_values_include_casefold(_value(existing, "data_categories"), _value(candidate, "data_categories"))
        and _selected_values_include_casefold(_value(existing, "legal_bases"), _value(candidate, "legal_bases"))
        and _enum_includes(
            _value(existing, "processing_type"),
            _value(candidate, "processing_type"),
            PROCESSING_TYPE_COVERAGE,
        )
        and _enum_includes(
            _value(existing, "internal_network_transfer"),
            _value(candidate, "internal_network_transfer"),
            INTERNAL_NETWORK_TRANSFER_COVERAGE,
        )
        and _enum_includes(
            _value(existing, "internet_transfer"),
            _value(candidate, "internet_transfer"),
            INTERNET_TRANSFER_COVERAGE,
        )
        and _bool_includes(_value(existing, "cross_border_transfer"), _value(candidate, "cross_border_transfer"))
    )


def is_new_processing_process_for_task_automation(candidate: Any, existing_processes: Iterable[Any]) -> bool:
    return not any(
        processing_process_is_subprocess_for_task_automation(candidate, existing)
        for existing in existing_processes
    )


def _processing_process_details_strictly_contain(container: Any, contained: Any) -> bool:
    return _processing_process_details_contain(container, contained) and not _processing_process_details_contain(
        contained,
        container,
    )


def _processing_process_details_contain(container: Any, contained: Any) -> bool:
    return (
        _selected_values_include(_value(container, "subject_categories"), _value(contained, "subject_categories"))
        and _selected_values_include(_value(container, "data_categories"), _value(contained, "data_categories"))
        and _selected_values_include(_value(container, "legal_bases"), _value(contained, "legal_bases"))
        and _selected_values_include(
            _value(container, "personal_data_actions"),
            _value(contained, "personal_data_actions"),
        )
        and _enum_includes(
            _value(container, "processing_type"),
            _value(contained, "processing_type"),
            PROCESSING_TYPE_COVERAGE,
        )
        and _enum_includes(
            _value(container, "internal_network_transfer"),
            _value(contained, "internal_network_transfer"),
            INTERNAL_NETWORK_TRANSFER_COVERAGE,
        )
        and _enum_includes(
            _value(container, "internet_transfer"),
            _value(contained, "internet_transfer"),
            INTERNET_TRANSFER_COVERAGE,
        )
        and _bool_includes(_value(container, "cross_border_transfer"), _value(contained, "cross_border_transfer"))
    )


def _same_base_process(left: Any, right: Any) -> bool:
    return (
        _effective_process_name(left) == _effective_process_name(right)
        and _normalize_text(_value(left, "purpose_name")) == _normalize_text(_value(right, "purpose_name"))
        and _normalize_text(_value(left, "processing_period")) == _normalize_text(_value(right, "processing_period"))
    )


def _same_normalized_name(left: Any, right: Any) -> bool:
    return _effective_process_name(left).casefold() == _effective_process_name(right).casefold()


def _same_process_identity(left: Any, right: Any) -> bool:
    left_id = _value(left, "id")
    right_id = _value(right, "id")
    return left is right or (left_id is not None and right_id is not None and left_id == right_id)


def _same_purpose_and_period_for_task_automation(left: Any, right: Any) -> bool:
    return (
        _normalize_text_casefold(_value(left, "purpose_name")) == _normalize_text_casefold(_value(right, "purpose_name"))
        and _normalize_text_casefold(_value(left, "processing_period"))
        == _normalize_text_casefold(_value(right, "processing_period"))
    )


def _effective_process_name(process: Any) -> str:
    return _normalize_text(_value(process, "purpose_name") or _value(process, "name"))


def _selected_values_include(container: Any, contained: Any) -> bool:
    container_values = _as_mapping(container)
    contained_values = _as_mapping(contained)
    for key, contained_value in contained_values.items():
        if contained_value is True and container_values.get(key) is not True:
            return False
        if isinstance(contained_value, str) and contained_value.strip():
            container_value = container_values.get(key)
            if not isinstance(container_value, str) or not _text_value_includes(container_value, contained_value):
                return False
    return True


def _selected_values_include_casefold(container: Any, contained: Any) -> bool:
    container_values = _as_mapping(container)
    contained_values = _as_mapping(contained)
    for key, contained_value in contained_values.items():
        if contained_value is True and container_values.get(key) is not True:
            return False
        if isinstance(contained_value, str) and contained_value.strip():
            container_value = container_values.get(key)
            if not isinstance(container_value, str) or not _text_value_includes_casefold(
                container_value,
                contained_value,
            ):
                return False
    return True


def _text_value_includes(container: str, contained: str) -> bool:
    container_text = _normalize_text(container)
    contained_text = _normalize_text(contained)
    if not contained_text:
        return True
    if not container_text:
        return False
    if container_text == contained_text:
        return True

    container_items = _split_text_items(container_text)
    contained_items = _split_text_items(contained_text)
    return bool(container_items) and contained_items.issubset(container_items)


def _text_value_includes_casefold(container: str, contained: str) -> bool:
    container_text = _normalize_text_casefold(container)
    contained_text = _normalize_text_casefold(contained)
    if not contained_text:
        return True
    if not container_text:
        return False
    if container_text == contained_text:
        return True

    container_items = _split_text_items_casefold(container_text)
    contained_items = _split_text_items_casefold(contained_text)
    return bool(container_items) and contained_items.issubset(container_items)


def _split_text_items(value: str) -> set[str]:
    return {item for item in (_normalize_text(part) for part in re.split(r"[;,\n]+", value)) if item}


def _split_text_items_casefold(value: str) -> set[str]:
    return {item for item in (_normalize_text_casefold(part) for part in re.split(r"[;,\n]+", value)) if item}


def _enum_includes(container: Any, contained: Any, coverage: Mapping[str, set[str]]) -> bool:
    container_value = _normalize_text(container)
    contained_value = _normalize_text(contained)
    return contained_value in coverage.get(container_value, {container_value})


def _bool_includes(container: Any, contained: Any) -> bool:
    if contained is False:
        return container in {False, True}
    return container is True


def _as_mapping(value: Any) -> Mapping[str, Any]:
    return value if isinstance(value, Mapping) else {}


def _value(process: Any, field: str) -> Any:
    if isinstance(process, Mapping):
        return process.get(field)
    return getattr(process, field, None)


def _normalize_text(value: Any) -> str:
    return str(value or "").strip()


def _normalize_text_casefold(value: Any) -> str:
    return _normalize_text(value).casefold()
