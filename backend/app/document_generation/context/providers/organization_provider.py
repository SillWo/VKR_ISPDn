from sqlalchemy.orm import Session

from app.models.employee import Employee
from app.repositories.organization import OrganizationRepository
from app.services.organization import OrganizationNotFoundError, OrganizationService


EMPTY_VALUE = "Не заполнено"

OPERATOR_TYPE_LABELS = {
    "legal_entity": "Юридическое лицо",
    "individual_entrepreneur": "Индивидуальный предприниматель",
    "state_body": "Государственный орган",
    "municipal_body": "Муниципальный орган",
    "branch": "Филиал",
    "foreign_citizen": "Иностранный гражданин",
}


def _value_or_empty(value: object) -> object:
    return value if value not in (None, "") else EMPTY_VALUE


def _employee_object(employee: Employee | None) -> dict | None:
    if employee is None:
        return None
    return {
        "id": employee.id,
        "full_name": employee.full_name,
        "position": employee.position,
        "document_initials": employee.document_initials,
        "department_id": employee.department_id,
        "department_name": employee.department_name,
    }


def _employee_context(prefix: str, employee: Employee | None, employee_id: int | None) -> dict:
    employee_object = _employee_object(employee)
    return {
        prefix: employee_object,
        f"{prefix}_id": employee_id,
        f"{prefix}_full_name": employee.full_name if employee else EMPTY_VALUE,
        f"{prefix}_position": employee.position if employee else EMPTY_VALUE,
        f"{prefix}_document_initials": employee.document_initials if employee else EMPTY_VALUE,
        f"{prefix}_department_name": employee.department_name if employee else EMPTY_VALUE,
    }


def _empty_context() -> dict:
    context = {
        "company_city": EMPTY_VALUE,
        "full_organization_name": EMPTY_VALUE,
        "full_legal_name": EMPTY_VALUE,
        "head_full_name": EMPTY_VALUE,
        "head_position": EMPTY_VALUE,
        "position_of_the_head_of_the_organization": EMPTY_VALUE,
        "organization_operator_type": EMPTY_VALUE,
        "organization_operator_type_label": EMPTY_VALUE,
        "organization_head_office_region": EMPTY_VALUE,
        "organization_activity_regions": EMPTY_VALUE,
        "organization_registration_address": EMPTY_VALUE,
        "organization_registration_city": EMPTY_VALUE,
        "organization_postal_address_matches_registration": EMPTY_VALUE,
        "organization_postal_address": EMPTY_VALUE,
        "organization_phone": EMPTY_VALUE,
        "organization_fax": EMPTY_VALUE,
        "organization_email": EMPTY_VALUE,
        "organization_inn": EMPTY_VALUE,
        "organization_ogrn": EMPTY_VALUE,
        "organization_kpp": EMPTY_VALUE,
        "organization_okved": EMPTY_VALUE,
        "organization_okpo": EMPTY_VALUE,
        "organization_okfs": EMPTY_VALUE,
        "organization_okogu": EMPTY_VALUE,
        "organization_okopf": EMPTY_VALUE,
        "organization_okveds": [],
        "organization_okveds_text": EMPTY_VALUE,
        "organization_branches": [],
        "organization_branches_text": EMPTY_VALUE,
    }
    context.update(_employee_context("document_approver_employee", None, None))
    context.update(_employee_context("head_employee", None, None))
    context.update(_employee_context("information_security_responsible_employee", None, None))
    context.update(_employee_context("personal_data_processing_responsible_employee", None, None))
    return context


class OrganizationContextProvider:
    def __init__(self, db: Session) -> None:
        self.service = OrganizationService(OrganizationRepository(db))

    def get_context(self) -> dict:
        try:
            card = self.service.get_card()
        except OrganizationNotFoundError:
            return _empty_context()

        okveds = [
            {
                "code": okved.code,
                "name": okved.name,
                "display_name": f"{okved.code} — {okved.name}",
            }
            for okved in card.okveds
        ]
        branches = [
            {
                "name": branch.name,
                "postal_address": branch.postal_address,
                "display_name": f"{branch.name} — {branch.postal_address}",
            }
            for branch in card.branches
        ]
        operator_type = card.operator_type

        context = {
            "company_city": _value_or_empty(card.registration_city),
            "full_organization_name": _value_or_empty(card.full_legal_name),
            "full_legal_name": _value_or_empty(card.full_legal_name),
            "head_full_name": _value_or_empty(
                card.head_employee.document_initials if card.head_employee else card.head_full_name,
            ),
            "head_position": _value_or_empty(
                card.head_employee.position if card.head_employee else card.head_position,
            ),
            "position_of_the_head_of_the_organization": _value_or_empty(
                card.head_employee.position if card.head_employee else card.head_position,
            ),
            "organization_operator_type": _value_or_empty(operator_type),
            "organization_operator_type_label": OPERATOR_TYPE_LABELS.get(operator_type, EMPTY_VALUE),
            "organization_head_office_region": _value_or_empty(card.head_office_region),
            "organization_activity_regions": _value_or_empty(card.activity_regions),
            "organization_registration_address": _value_or_empty(card.registration_address),
            "organization_registration_city": _value_or_empty(card.registration_city),
            "organization_postal_address_matches_registration": card.postal_address_matches_registration,
            "organization_postal_address": _value_or_empty(card.postal_address),
            "organization_phone": _value_or_empty(card.phone),
            "organization_fax": _value_or_empty(card.fax),
            "organization_email": _value_or_empty(card.email),
            "organization_inn": _value_or_empty(card.inn),
            "organization_ogrn": _value_or_empty(card.ogrn),
            "organization_kpp": _value_or_empty(card.kpp),
            "organization_okved": "; ".join(item["display_name"] for item in okveds) or EMPTY_VALUE,
            "organization_okpo": _value_or_empty(card.okpo),
            "organization_okfs": _value_or_empty(card.okfs),
            "organization_okogu": _value_or_empty(card.okogu),
            "organization_okopf": _value_or_empty(card.okopf),
            "organization_okveds": okveds,
            "organization_okveds_text": "; ".join(item["display_name"] for item in okveds) or EMPTY_VALUE,
            "organization_branches": branches,
            "organization_branches_text": "; ".join(item["display_name"] for item in branches) or EMPTY_VALUE,
        }
        context.update(
            _employee_context(
                "head_employee",
                card.head_employee,
                card.head_employee_id,
            ),
        )
        context.update(
            _employee_context(
                "document_approver_employee",
                card.document_approver_employee,
                card.document_approver_employee_id,
            ),
        )
        context.update(
            _employee_context(
                "information_security_responsible_employee",
                card.information_security_responsible_employee,
                card.information_security_responsible_employee_id,
            ),
        )
        context.update(
            _employee_context(
                "personal_data_processing_responsible_employee",
                card.personal_data_processing_responsible_employee,
                card.personal_data_processing_responsible_employee_id,
            ),
        )
        return context
