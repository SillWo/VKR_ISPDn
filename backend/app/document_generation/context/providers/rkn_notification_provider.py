from datetime import date
from typing import Any

from sqlalchemy import select
from sqlalchemy.orm import Session, joinedload, selectinload

from app.document_generation.core.errors import DocumentPrerequisiteMissingError
from app.domain.processing_catalogs import (
    DATA_CATEGORY_CATALOG,
    INTERNAL_NETWORK_TRANSFER_LABELS,
    INTERNET_TRANSFER_LABELS,
    LEGAL_BASIS_CATALOG,
    PERSONAL_DATA_ACTION_CATALOG,
    PROCESSING_TYPE_LABELS,
    SUBJECT_CATEGORY_CATALOG,
    selected_labels,
)
from app.domain.processing_process_subsumption import filter_subsumed_processing_processes
from app.models.crypto_tool import CryptoTool
from app.models.data_center import DataCenter
from app.models.ispdn import IspdnCard
from app.models.organization import OrganizationCard
from app.models.processing_process import ProcessingProcess
from app.repositories.data_center import DataCenterRepository
from app.repositories.ispdn import IspdnRepository
from app.repositories.organization import OrganizationRepository
from app.repositories.processing_process import ProcessingProcessRepository
from app.document_generation.context.providers.organization_provider import OPERATOR_TYPE_LABELS
from app.services.organization import OrganizationNotFoundError, OrganizationService


SPECIAL_DATA_CATEGORY_KEYS = {
    "health_status",
    "nationality",
    "political_views",
    "religious_or_philosophical_beliefs",
    "criminal_record",
}

BIOMETRIC_DATA_CATEGORY_KEYS = {
    "biometric_face_image",
    "biometric_voice_data",
    "fingerprint_patterns",
    "other_biometric_data",
}

SECURITY_TOOL_LABELS = [
    ("dlp", "DLP"),
    ("siem", "SIEM"),
    ("antivirus", "Антивирусные средства"),
    ("ips_ids", "IPS/IDS"),
    ("firewall_utm_ngfw", "МЭ, UTM и NGFW"),
    ("vulnerability_scanner", "Сканер уязвимостей"),
    ("backup_system", "Система резервного копирования"),
    ("trusted_boot", "Средство доверенной загрузки"),
    ("access_control", "Средства разграничения доступа"),
    ("physical_security", "СКУД, сигнализация"),
]

CRYPTO_CLASS_LABELS = {
    "KS1": "КС1",
    "KS2": "КС2",
    "KS3": "КС3",
    "KV": "КВ",
    "KA": "КА",
}

ACCESS_PERSON_TYPE_LABELS = {
    "individual": "физическое лицо",
    "individual_entrepreneur": "индивидуальный предприниматель",
    "legal_entity": "юридическое лицо",
    "foreign_organization": "иностранная организация",
}

ACCESS_PERSON_NAME_LABELS = {
    "individual": "ФИО",
    "individual_entrepreneur": "ФИО",
    "legal_entity": "Наименование организации",
    "foreign_organization": "Наименование организации",
}


def _text(value: object) -> str:
    if value is None:
        return ""
    return str(value)


def _date(value: date | None) -> str:
    return value.strftime("%d.%m.%Y") if value else ""


def _unique(values: list[str]) -> list[str]:
    result: list[str] = []
    seen: set[str] = set()
    for value in values:
        normalized = value.strip()
        if normalized and normalized not in seen:
            result.append(normalized)
            seen.add(normalized)
    return result


def _join(values: list[str], *, empty: str = "") -> str:
    unique_values = _unique(values)
    return "; ".join(unique_values) if unique_values else empty


class RknNotificationContextProvider:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.organization_service = OrganizationService(OrganizationRepository(db))
        self.processing_repository = ProcessingProcessRepository(db)
        self.data_center_repository = DataCenterRepository(db)
        self.ispdn_repository = IspdnRepository(db)

    def get_context(self, manual_data: dict) -> dict:
        try:
            organization = self.organization_service.get_card()
        except OrganizationNotFoundError as exc:
            raise DocumentPrerequisiteMissingError("Карточка организации не заполнена.") from exc

        active_ispdns = self._list_active_ispdns()
        if not active_ispdns:
            raise DocumentPrerequisiteMissingError(
                'Для формирования уведомления в РКН нужна хотя бы одна ИСПДн со статусом "Работает".',
            )
        if organization.personal_data_processing_responsible_employee is None:
            raise DocumentPrerequisiteMissingError(
                "В карточке организации не указан ответственный за организацию обработки персональных данных.",
            )
        if not organization.rkn_office_address or not organization.rkn_office_address.strip():
            raise DocumentPrerequisiteMissingError(
                "В карточке организации не указан адрес офиса Роскомнадзора.",
            )

        termination_text = self._build_termination_text(organization)
        processes = filter_subsumed_processing_processes(self.processing_repository.list_unique_for_active_ispdns())
        data_centers = self.data_center_repository.list_unique_for_active_ispdns()

        return {
            "RKN_adress": organization.rkn_office_address.strip(),
            **self._organization_context(organization),
            "rkn_processing_processes": [self._process_context(process) for process in processes],
            "security_features": self._security_features(active_ispdns),
            **self._cryptography_context(active_ispdns),
            **self._responsible_person_context(organization),
            "start_PDn_date": _date(max(card.commissioning_date for card in active_ispdns)),
            "termination_text": termination_text,
            "cross_border_transfer_status": (
                "осуществляется" if any(process.cross_border_transfer for process in processes) else "не осуществляется"
            ),
            "rkn_data_centers": [self._data_center_context(data_center) for data_center in data_centers],
            "rkn_access_persons": [
                self._access_person_context(person) for person in manual_data.get("rkn_access_persons", [])
            ],
            **self._performer_context(organization),
        }

    def get_changes_context(self, manual_data: dict) -> dict:
        context = self.get_context(manual_data)
        context["change_date"] = _date(manual_data.get("change_date"))
        context["main_office_reg"] = _text(manual_data.get("main_office_reg")).strip()
        return context

    def _list_active_ispdns(self) -> list[IspdnCard]:
        statement = (
            select(IspdnCard)
            .options(
                joinedload(IspdnCard.security_tools),
                joinedload(IspdnCard.cryptography_settings),
                selectinload(IspdnCard.crypto_tools),
                selectinload(IspdnCard.data_centers),
            )
            .where(IspdnCard.status == "active")
            .order_by(IspdnCard.name.asc(), IspdnCard.id.asc())
        )
        return list(self.db.scalars(statement).unique().all())

    def _organization_context(self, organization: OrganizationCard) -> dict:
        return {
            "full_org_name": _text(organization.full_legal_name),
            "main_office_reg": _text(organization.head_office_region),
            "operator_type": _text(OPERATOR_TYPE_LABELS.get(organization.operator_type or "", organization.operator_type)),
            "sokr_org_name": _text(organization.short_legal_name),
            "org_adress": _text(organization.registration_address),
            "mail_org_adress": self._organization_postal_address(organization),
            "org_phone": _text(organization.phone),
            "org_faks": _text(organization.fax),
            "org_email": _text(organization.email),
            "org_regions": _text(organization.activity_regions),
            "INN": _text(organization.inn),
            "OGRN": _text(organization.ogrn),
            "OKVED_list": self._okved_list(organization),
            "OKPO": _text(organization.okpo),
            "OKFS": _text(organization.okfs),
            "OKOGY": _text(organization.okogu),
            "OKOP": _text(organization.okopf),
            "branches_of_the_organization_list": self._branches_list(organization),
        }

    def _okved_list(self, organization: OrganizationCard) -> str:
        values = [f"{okved.code} — {okved.name}" for okved in organization.okveds]
        if values:
            return "; ".join(values)
        return _text(organization.okved)

    def _branches_list(self, organization: OrganizationCard) -> str:
        return "; ".join(f"{branch.name}: {branch.postal_address}" for branch in organization.branches)

    def _process_context(self, process: ProcessingProcess) -> dict:
        return {
            "process_name": _text(process.purpose_name),
            "purpose_of_processing": _text(process.purpose_name),
            "PDn_list": self._data_category_list(process.data_categories, "regular"),
            "special_PDn_list": self._data_category_list(process.data_categories, "special"),
            "biometric_PDn_list": self._data_category_list(process.data_categories, "biometric"),
            "subjects_of_PDn": _join(selected_labels(process.subject_categories, SUBJECT_CATEGORY_CATALOG)),
            "legal_basis": _join(selected_labels(process.legal_bases, LEGAL_BASIS_CATALOG)),
            "actions_with_PDn": _join(selected_labels(process.personal_data_actions, PERSONAL_DATA_ACTION_CATALOG)),
            "actions_type": "; ".join(
                [
                    PROCESSING_TYPE_LABELS.get(process.processing_type, process.processing_type),
                    INTERNAL_NETWORK_TRANSFER_LABELS.get(
                        process.internal_network_transfer,
                        process.internal_network_transfer,
                    ),
                    INTERNET_TRANSFER_LABELS.get(process.internet_transfer, process.internet_transfer),
                ],
            ),
        }

    def _data_category_list(self, values: dict[str, bool | str], group: str) -> str:
        labels: list[str] = []
        for item in DATA_CATEGORY_CATALOG:
            key = item["key"]
            raw_value = values.get(key)
            if group == "special" and key not in SPECIAL_DATA_CATEGORY_KEYS:
                continue
            if group == "biometric" and key not in BIOMETRIC_DATA_CATEGORY_KEYS:
                continue
            if group == "regular" and key in SPECIAL_DATA_CATEGORY_KEYS | BIOMETRIC_DATA_CATEGORY_KEYS:
                continue
            if raw_value is True:
                labels.append(item["label"])
            elif isinstance(raw_value, str) and raw_value.strip():
                labels.append(raw_value.strip())
        return _join(labels, empty="не обрабатываются")

    def _security_features(self, active_ispdns: list[IspdnCard]) -> str:
        values: list[str] = []
        for card in active_ispdns:
            tools = card.security_tools
            if tools is None:
                continue
            for field, label in SECURITY_TOOL_LABELS:
                if getattr(tools, field):
                    values.append(label)
            values.extend(item.strip() for item in (tools.other_security_tools or "").split(";"))
        return _join(values, empty="не указаны")

    def _cryptography_context(self, active_ispdns: list[IspdnCard]) -> dict:
        crypto_tools_by_id: dict[int, CryptoTool] = {}
        for card in active_ispdns:
            if not card.cryptography_settings or not card.cryptography_settings.uses_cryptography:
                continue
            for crypto_tool in card.crypto_tools:
                crypto_tools_by_id[crypto_tool.id] = crypto_tool

        crypto_tools = list(crypto_tools_by_id.values())
        if not crypto_tools:
            return {"is_using_SKZI": "Не используются", "SKZI_block": ""}

        classes = _join([CRYPTO_CLASS_LABELS.get(tool.crypto_class, tool.crypto_class) for tool in crypto_tools])
        info = _join(
            [
                f"{tool.name}, изготовитель: {tool.manufacturer}, серийный номер: {tool.serial_number}"
                for tool in crypto_tools
            ],
        )
        return {
            "is_using_SKZI": "Используются",
            "SKZI_block": (
                f"Класс СКЗИ: {classes}\n"
                f"Наименование, изготовители, серийные номера средств шифрования: {info}"
            ),
        }

    def _responsible_person_context(self, organization: OrganizationCard) -> dict:
        employee = organization.personal_data_processing_responsible_employee
        return {
            "employee_responsible_for_PDn": _text(employee.full_name if employee else ""),
            "employee_responsible_for_PDn_adress": self._organization_postal_address(organization),
            "employee_responsible_for_PDn_phones": _text((employee.phone_number if employee else None) or organization.phone),
            "employee_responsible_for_PDn_emails": _text((employee.email if employee else None) or organization.email),
        }

    def _organization_postal_address(self, organization: OrganizationCard) -> str:
        if organization.postal_address_matches_registration:
            return _text(organization.registration_address)
        return _text(organization.postal_address or organization.registration_address)

    def _build_termination_text(self, organization: OrganizationCard) -> str:
        if (
            organization.personal_data_processing_termination_type == "end_date"
            and organization.personal_data_processing_termination_date
        ):
            return _date(organization.personal_data_processing_termination_date)
        if (
            organization.personal_data_processing_termination_type == "end_condition"
            and organization.personal_data_processing_termination_condition
            and organization.personal_data_processing_termination_condition.strip()
        ):
            return organization.personal_data_processing_termination_condition.strip()
        raise DocumentPrerequisiteMissingError(
            "В карточке организации не заполнен срок или условие прекращения обработки ПДн.",
        )

    def _data_center_context(self, data_center: DataCenter) -> dict:
        return {
            "COD_name": _text(data_center.name),
            "country_of_COD": _text(data_center.location_country),
            "COD_address": _text(data_center.location_address),
            "COD_status": "собственный ЦОД" if data_center.is_own_data_center else "не является собственным ЦОД",
            "owner_info": "" if data_center.is_own_data_center else self._data_center_owner_info(data_center),
        }

    def _data_center_owner_info(self, data_center: DataCenter) -> str:
        builders = {
            "individual": self._individual_owner_info,
            "individual_entrepreneur": self._entrepreneur_owner_info,
            "legal_entity": self._legal_entity_owner_info,
            "foreign_organization": self._foreign_organization_owner_info,
        }
        builder = builders.get(data_center.owner_organization_type or "")
        return builder(data_center) if builder else ""

    def _owner_segments(self, fields: list[tuple[str, Any]]) -> str:
        return "; ".join(f"{label}: {value}" for label, value in fields if value not in (None, ""))

    def _individual_owner_info(self, data_center: DataCenter) -> str:
        segments = self._owner_segments(
            [
                ("ФИО", data_center.owner_person_full_name),
                ("ИНН", data_center.owner_inn),
                ("страна местонахождения", data_center.owner_location_country),
                ("адрес местонахождения", data_center.owner_location_address),
            ],
        )
        return f"Сведения о лице, ответственном за хранение данных: физическое лицо; {segments}."

    def _entrepreneur_owner_info(self, data_center: DataCenter) -> str:
        segments = self._owner_segments(
            [
                ("ФИО", data_center.owner_person_full_name),
                ("ОГРНИП", data_center.owner_ogrnip),
                ("ИНН", data_center.owner_inn),
                ("страна местонахождения", data_center.owner_location_country),
                ("адрес местонахождения", data_center.owner_location_address),
            ],
        )
        return f"Сведения об организации, ответственной за хранение данных: индивидуальный предприниматель; {segments}."

    def _legal_entity_owner_info(self, data_center: DataCenter) -> str:
        segments = self._owner_segments(
            [
                ("наименование", data_center.owner_organization_name),
                ("ОГРН", data_center.owner_ogrn),
                ("ИНН", data_center.owner_inn),
                ("страна местонахождения", data_center.owner_location_country),
                ("адрес местонахождения", data_center.owner_location_address),
            ],
        )
        return f"Сведения об организации, ответственной за хранение данных: юридическое лицо; {segments}."

    def _foreign_organization_owner_info(self, data_center: DataCenter) -> str:
        segments = self._owner_segments(
            [
                ("наименование", data_center.owner_organization_name),
                ("страна местонахождения", data_center.owner_location_country),
                ("адрес местонахождения", data_center.owner_location_address),
            ],
        )
        return f"Сведения об организации, ответственной за хранение данных: иностранная организация; {segments}."

    def _access_person_context(self, person: dict) -> dict:
        person_type = person["person_type"]
        return {
            "display_name": person["name"],
            "individuals_type": ACCESS_PERSON_TYPE_LABELS[person_type],
            "name_label": ACCESS_PERSON_NAME_LABELS[person_type],
            "individuals_name": person["name"],
            "individuals_address": person["address"],
            "individuals_email": person.get("email") or "",
            "individuals_phone": person.get("phone") or "",
        }

    def _performer_context(self, organization: OrganizationCard) -> dict:
        head_employee = organization.head_employee
        return {
            "main_name": _text(head_employee.full_name if head_employee else organization.head_full_name),
            "main_post": _text(organization.head_position),
            "main_phone": _text((head_employee.phone_number if head_employee else None) or organization.phone),
            "date": date.today().strftime("%d.%m.%Y"),
        }
