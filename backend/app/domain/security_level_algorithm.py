from typing import Literal


DataCategory = Literal["special", "biometric", "public", "other"]
SubjectCountRange = Literal["more_than_100k", "less_than_100k"]
ThreatType = Literal["threat_type_1", "threat_type_2", "threat_type_3"]
SubjectGroup = Literal["clients_only", "employees_only", "employees_and_clients"]


DATA_CATEGORY_KEYS = ("special", "biometric", "public", "other")
SUBJECT_COUNT_RANGE_VALUES = ("more_than_100k", "less_than_100k")
THREAT_TYPE_VALUES = ("threat_type_1", "threat_type_2", "threat_type_3")
SUBJECT_GROUP_VALUES = ("clients_only", "employees_only", "employees_and_clients")
SECURITY_LEVEL_VALUES = (1, 2, 3, 4)

DATA_CATEGORY_LABELS: dict[str, str] = {
    "special": "специальные",
    "biometric": "биометрические",
    "public": "из общедоступных источников",
    "other": "иные",
}
SUBJECT_COUNT_RANGE_LABELS: dict[str, str] = {
    "more_than_100k": "более чем 100 000 субъектов персональных данных",
    "less_than_100k": "менее чем 100 000 субъектов персональных данных",
}
THREAT_TYPE_LABELS: dict[str, str] = {
    "threat_type_1": "1 тип угроз",
    "threat_type_2": "2 тип угроз",
    "threat_type_3": "3 тип угроз",
}
SUBJECT_GROUP_LABELS: dict[str, str] = {
    "clients_only": "только клиенты",
    "employees_only": "только сотрудники",
    "employees_and_clients": "и работники и сотрудники",
}


class SecurityLevelCalculationError(Exception):
    pass


def determine_primary_data_category(data_categories: dict[str, bool]) -> DataCategory:
    unknown_keys = set(data_categories) - set(DATA_CATEGORY_KEYS)
    if unknown_keys:
        raise ValueError(f"data_categories contains unknown keys: {', '.join(sorted(unknown_keys))}")

    normalized = {key: bool(data_categories.get(key, False)) for key in DATA_CATEGORY_KEYS}
    if not any(normalized.values()):
        raise ValueError("data_categories must contain at least one selected value")

    if normalized["special"]:
        return "special"
    if normalized["biometric"]:
        return "biometric"
    if normalized["public"] and not normalized["other"]:
        return "public"
    return "other"


def determine_employee_only(subject_group: SubjectGroup) -> bool:
    if subject_group == "employees_only":
        return True
    if subject_group in {"clients_only", "employees_and_clients"}:
        return False
    raise ValueError("unsupported subject group value")


def calculate_security_level(
    data_categories: dict[str, bool],
    subject_count_range: SubjectCountRange,
    threat_type: ThreatType,
    subject_group: SubjectGroup,
) -> dict[str, DataCategory | ThreatType | bool | int]:
    primary_data_category = determine_primary_data_category(data_categories)
    employee_only = determine_employee_only(subject_group)

    level = _calculate_level(primary_data_category, subject_count_range, threat_type, employee_only)
    return {
        "primary_data_category": primary_data_category,
        "threat_type": threat_type,
        "employee_only": employee_only,
        "recommended_level": level,
    }


def _calculate_level(
    primary_data_category: DataCategory,
    subject_count_range: SubjectCountRange,
    threat_type: ThreatType,
    employee_only: bool,
) -> int:
    if threat_type == "threat_type_1" and primary_data_category in {"special", "biometric", "other"}:
        return 1
    if (
        threat_type == "threat_type_2"
        and primary_data_category == "special"
        and subject_count_range == "more_than_100k"
        and not employee_only
    ):
        return 1

    if threat_type == "threat_type_1" and primary_data_category == "public":
        return 2
    if threat_type == "threat_type_2" and primary_data_category == "special" and employee_only:
        return 2
    if (
        threat_type == "threat_type_2"
        and primary_data_category == "special"
        and subject_count_range == "less_than_100k"
        and not employee_only
    ):
        return 2
    if threat_type == "threat_type_2" and primary_data_category == "biometric":
        return 2
    if (
        threat_type == "threat_type_2"
        and primary_data_category in {"public", "other"}
        and subject_count_range == "more_than_100k"
        and not employee_only
    ):
        return 2
    if (
        threat_type == "threat_type_3"
        and primary_data_category == "special"
        and subject_count_range == "more_than_100k"
        and not employee_only
    ):
        return 2

    if threat_type == "threat_type_2" and primary_data_category == "public" and employee_only:
        return 3
    if (
        threat_type == "threat_type_2"
        and primary_data_category == "public"
        and subject_count_range == "less_than_100k"
        and not employee_only
    ):
        return 3
    if threat_type == "threat_type_2" and primary_data_category == "other" and employee_only:
        return 3
    if (
        threat_type == "threat_type_2"
        and primary_data_category == "other"
        and subject_count_range == "less_than_100k"
        and not employee_only
    ):
        return 3
    if threat_type == "threat_type_3" and primary_data_category == "special" and employee_only:
        return 3
    if (
        threat_type == "threat_type_3"
        and primary_data_category == "special"
        and subject_count_range == "less_than_100k"
        and not employee_only
    ):
        return 3
    if threat_type == "threat_type_3" and primary_data_category == "biometric":
        return 3
    if (
        threat_type == "threat_type_3"
        and primary_data_category == "other"
        and subject_count_range == "more_than_100k"
        and not employee_only
    ):
        return 3

    if threat_type == "threat_type_3" and primary_data_category == "public":
        return 4
    if threat_type == "threat_type_3" and primary_data_category == "other" and employee_only:
        return 4
    if (
        threat_type == "threat_type_3"
        and primary_data_category == "other"
        and subject_count_range == "less_than_100k"
        and not employee_only
    ):
        return 4

    raise SecurityLevelCalculationError("Cannot calculate security level for provided input")


def selected_data_category_labels(data_categories: dict[str, bool]) -> list[str]:
    return [DATA_CATEGORY_LABELS[key] for key in DATA_CATEGORY_KEYS if data_categories.get(key) is True]


def run_security_level_algorithm_self_check() -> None:
    cases = [
        (
            {
                "data_categories": {"special": True, "biometric": False, "public": False, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_1",
                "subject_group": "employees_only",
            },
            1,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": True, "public": False, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_1",
                "subject_group": "employees_only",
            },
            1,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_1",
                "subject_group": "employees_only",
            },
            1,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": True, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_1",
                "subject_group": "employees_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": True, "biometric": False, "public": False, "other": False},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            1,
        ),
        (
            {
                "data_categories": {"special": True, "biometric": False, "public": False, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": True, "biometric": False, "public": False, "other": False},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "employees_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": True, "public": False, "other": False},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": True, "other": False},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": True, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            3,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_2",
                "subject_group": "clients_only",
            },
            3,
        ),
        (
            {
                "data_categories": {"special": True, "biometric": False, "public": False, "other": False},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            2,
        ),
        (
            {
                "data_categories": {"special": True, "biometric": False, "public": False, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            3,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": True, "public": False, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            3,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            3,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": True, "other": False},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            4,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
                "subject_count_range": "less_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            4,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "employees_only",
            },
            4,
        ),
        (
            {
                "data_categories": {"special": False, "biometric": False, "public": True, "other": True},
                "subject_count_range": "more_than_100k",
                "threat_type": "threat_type_3",
                "subject_group": "clients_only",
            },
            3,
        ),
    ]

    for payload, expected_level in cases:
        result = calculate_security_level(**payload)
        actual_level = result["recommended_level"]
        if actual_level != expected_level:
            raise AssertionError(f"Expected level {expected_level}, got {actual_level}")
