from __future__ import annotations

import asyncio
import json
import time
import zipfile
from io import BytesIO
from pathlib import Path
import sys
from typing import Any, Awaitable, Callable

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.main import app


PREFIX = "QA_REVIEW_SMOKE_"


class SmokeRunner:
    def __init__(self) -> None:
        self.results: list[tuple[str, bool, str]] = []
        self.token: str | None = None
        self.username = f"{PREFIX}user_{int(time.time())}"
        self.password = "QaReview123"

    async def run(self) -> int:
        transport = httpx.ASGITransport(app=app)
        async with httpx.AsyncClient(transport=transport, base_url="http://testserver", timeout=30.0) as client:
            try:
                await self._scenario_auth(client)
                context = await self._scenario_core_data(client)
                await self._scenario_documents(client, context)
                await self._scenario_tasks(client, context)
                await self._scenario_security(client, context)
                await self._scenario_processing_data_centers_crypto(client, context)
                await self._scenario_logout(client)
            finally:
                await self._cleanup(client)

        self._print_report()
        return 0 if all(ok for _, ok, _ in self.results) else 1

    async def check(self, name: str, action: Callable[[], Awaitable[None]]) -> None:
        try:
            await action()
            self.results.append((name, True, "PASS"))
        except Exception as exc:  # noqa: BLE001 - smoke report should keep running
            self.results.append((name, False, f"FAIL: {exc}"))

    async def _scenario_auth(self, client: httpx.AsyncClient) -> None:
        async def register_empty_username() -> None:
            response = await client.post(
                "/api/v1/auth/register",
                json={"username": " ", "password": self.password, "organization_name": f"{PREFIX}org"},
            )
            assert_status(response, 422)

        async def register_short_password() -> None:
            response = await client.post(
                "/api/v1/auth/register",
                json={"username": f"{self.username}_short", "password": "123", "organization_name": f"{PREFIX}org"},
            )
            assert_status(response, 422)

        async def register_user() -> None:
            response = await client.post(
                "/api/v1/auth/register",
                json={"username": self.username, "password": self.password, "organization_name": f"{PREFIX}org"},
            )
            assert_status(response, 201)
            data = response.json()
            self.token = data["access_token"]
            assert data["user"]["username"] == self.username
            assert data["user"]["organization_id"] > 0

        async def register_duplicate() -> None:
            response = await client.post(
                "/api/v1/auth/register",
                json={"username": self.username, "password": self.password, "organization_name": f"{PREFIX}org2"},
            )
            assert_status(response, 409)

        async def login_wrong_password() -> None:
            response = await client.post("/api/v1/auth/login", json={"username": self.username, "password": "bad"})
            assert_status(response, 401)

        async def login_user() -> None:
            response = await client.post("/api/v1/auth/login", json={"username": self.username, "password": self.password})
            assert_status(response, 200)
            self.token = response.json()["access_token"]

        async def me() -> None:
            response = await client.get("/api/v1/auth/me", headers=self.headers)
            assert_status(response, 200)
            assert response.json()["username"] == self.username

        async def protected_without_token() -> None:
            response = await client.get("/api/v1/ispdns")
            assert_status(response, 401)

        async def protected_bad_token() -> None:
            response = await client.get("/api/v1/ispdns", headers={"Authorization": "Bearer bad-token"})
            assert_status(response, 401)

        await self.check("auth: empty username -> 422", register_empty_username)
        await self.check("auth: short password -> 422", register_short_password)
        await self.check("auth: register user and organization", register_user)
        await self.check("auth: duplicate username -> 409", register_duplicate)
        await self.check("auth: wrong password -> 401", login_wrong_password)
        await self.check("auth: login user", login_user)
        await self.check("auth: me with token", me)
        await self.check("auth: protected endpoint without token -> 401", protected_without_token)
        await self.check("auth: protected endpoint with bad token -> 401", protected_bad_token)

    async def _scenario_core_data(self, client: httpx.AsyncClient) -> dict[str, Any]:
        context: dict[str, Any] = {}

        async def create_employee() -> None:
            response = await client.post(
                "/api/v1/employees",
                headers=self.headers,
                json={
                    "full_name": f"{PREFIX}Ivanov Ivan Ivanovich",
                    "position": "QA engineer",
                    "document_initials": "I. I. Ivanov",
                    "phone_number": "+7 (391) 111 22 33",
                    "email": "qa@example.test",
                    "department_id": None,
                },
            )
            assert_status(response, 201)
            context["employee_id"] = response.json()["id"]

        async def save_legal_organization() -> None:
            response = await client.put(
                "/api/v1/organization",
                headers=self.headers,
                json=organization_payload(context["employee_id"], operator_type="legal_entity"),
            )
            assert_status(response, 200)
            assert response.json()["short_legal_name"]

        async def reject_legal_without_short_name() -> None:
            payload = organization_payload(context["employee_id"], operator_type="legal_entity")
            payload["short_legal_name"] = None
            response = await client.put("/api/v1/organization", headers=self.headers, json=payload)
            assert_status(response, 422)

        async def save_individual_entrepreneur() -> None:
            response = await client.put(
                "/api/v1/organization",
                headers=self.headers,
                json=organization_payload(context["employee_id"], operator_type="individual_entrepreneur"),
            )
            assert_status(response, 200)
            data = response.json()
            assert data["short_legal_name"] is None
            assert data["kpp"] is None
            assert data["inn"] == "123456789012"

        async def restore_legal_organization() -> None:
            response = await client.put(
                "/api/v1/organization",
                headers=self.headers,
                json=organization_payload(context["employee_id"], operator_type="legal_entity"),
            )
            assert_status(response, 200)

        async def create_ispdn() -> None:
            response = await client.post(
                "/api/v1/ispdns",
                headers=self.headers,
                json=ispdn_payload(context["employee_id"], "active"),
            )
            assert_status(response, 201)
            context["ispdn_id"] = response.json()["id"]

        async def create_ispdn_bad_dates() -> None:
            payload = ispdn_payload(context["employee_id"], "active")
            payload["commissioning_date"] = "2026-05-15"
            payload["decommissioning_date"] = "2026-05-14"
            response = await client.post("/api/v1/ispdns", headers=self.headers, json=payload)
            assert_status(response, 422)

        async def create_ispdn_bad_employee() -> None:
            payload = ispdn_payload(999_999_999, "active")
            response = await client.post("/api/v1/ispdns", headers=self.headers, json=payload)
            assert_status(response, 404)

        async def create_archived_ispdn() -> None:
            response = await client.post(
                "/api/v1/ispdns",
                headers=self.headers,
                json=ispdn_payload(context["employee_id"], "archived", suffix="archived"),
            )
            assert_status(response, 201)
            context["archived_ispdn_id"] = response.json()["id"]

        await self.check("employee: create", create_employee)
        await self.check("organization: save legal entity", save_legal_organization)
        await self.check("organization: legal entity without short name -> 422", reject_legal_without_short_name)
        await self.check("organization: save individual entrepreneur with identity document", save_individual_entrepreneur)
        await self.check("organization: restore legal entity", restore_legal_organization)
        await self.check("ispdn: create active card", create_ispdn)
        await self.check("ispdn: decommission before commission -> 422", create_ispdn_bad_dates)
        await self.check("ispdn: nonexistent responsible employee -> 404", create_ispdn_bad_employee)
        await self.check("ispdn: create archived card", create_archived_ispdn)
        return context

    async def _scenario_documents(self, client: httpx.AsyncClient, context: dict[str, Any]) -> None:
        async def list_document_types() -> None:
            response = await client.get("/api/v1/document-types", headers=self.headers)
            assert_status(response, 200)
            codes = {item["code"] for item in response.json()}
            expected = {
                "act_ispdn_commissioning",
                "act_safety_level_of_ISPDn",
                "RKN_notification",
                "RKN_notification_changes",
                "PDn_document",
                "PDn_security",
            }
            assert expected <= codes

        async def unknown_document_type() -> None:
            response = await client.post(
                "/api/v1/documents/generate",
                headers=self.headers,
                json={"document_type": "unknown", "manual_data": {}},
            )
            assert_status(response, 404)

        async def rkn_changes_missing_change_date() -> None:
            response = await client.post(
                "/api/v1/documents/generate",
                headers=self.headers,
                json={"document_type": "RKN_notification_changes", "manual_data": {"main_office_reg": "77-00-1"}},
            )
            assert_status(response, 422)

        async def ispdn_document_unknown_ispdn() -> None:
            response = await client.post(
                "/api/v1/ispdns/999999999/documents/generate",
                headers=self.headers,
                json={"document_type": "act_safety_level_of_ISPDn", "manual_data": {"commission_members": []}},
            )
            assert_status(response, 422)

        async def global_document_download() -> None:
            response = await client.post(
                "/api/v1/documents/generate",
                headers=self.headers,
                json={"document_type": "RKN_notification", "manual_data": {"rkn_access_persons": []}},
            )
            assert_status(response, 200)
            assert response.headers["content-type"].startswith(
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            assert "attachment;" in response.headers["content-disposition"]
            assert_no_docx_placeholders(response.content)

        await self.check("documents: list registered document types", list_document_types)
        await self.check("documents: unknown document type -> 404", unknown_document_type)
        await self.check("documents: RKN changes without change_date -> 422", rkn_changes_missing_change_date)
        await self.check("documents: ISPDn document bad prerequisites -> 422", ispdn_document_unknown_ispdn)
        await self.check("documents: generate global RKN_notification docx", global_document_download)

    async def _scenario_tasks(self, client: httpx.AsyncClient, context: dict[str, Any]) -> None:
        async def ispdn_created_task_exists() -> None:
            response = await client.get("/api/v1/task-events", headers=self.headers)
            assert_status(response, 200)
            assert any(item["automation_key"] == f"ispdn_created:{context['ispdn_id']}" for item in response.json())

        async def manual_event_without_ispdn() -> None:
            response = await client.post(
                "/api/v1/task-events",
                headers=self.headers,
                json={"ispdn_id": None, "title": f"{PREFIX}manual event", "description": "manual"},
            )
            assert_status(response, 201)
            context["manual_event_id"] = response.json()["id"]

        async def manual_event_archived_ispdn_rejected() -> None:
            response = await client.post(
                "/api/v1/task-events",
                headers=self.headers,
                json={"ispdn_id": context["archived_ispdn_id"], "title": f"{PREFIX}archived event"},
            )
            assert_status(response, 422)

        async def task_lifecycle() -> None:
            response = await client.post(
                f"/api/v1/task-events/{context['manual_event_id']}/tasks",
                headers=self.headers,
                json={
                    "title": f"{PREFIX}manual task",
                    "description": "manual",
                    "importance": "medium",
                    "deadline": None,
                    "responsible_employee_id": context["employee_id"],
                    "status": "pending",
                },
            )
            assert_status(response, 201)
            task_id = response.json()["id"]
            status_response = await client.patch(
                f"/api/v1/task-events/{context['manual_event_id']}/tasks/{task_id}/status",
                headers=self.headers,
                json={"status": "done"},
            )
            assert_status(status_response, 200)
            importance_response = await client.patch(
                f"/api/v1/task-events/{context['manual_event_id']}/tasks/{task_id}/importance",
                headers=self.headers,
                json={"importance": "high"},
            )
            assert_status(importance_response, 200)
            invalid_response = await client.patch(
                f"/api/v1/task-events/{context['manual_event_id']}/tasks/{task_id}/status",
                headers=self.headers,
                json={"status": "bad"},
            )
            assert_status(invalid_response, 422)

        await self.check("tasks: ispdn_created automation exists", ispdn_created_task_exists)
        await self.check("tasks: manual event without ISPDn", manual_event_without_ispdn)
        await self.check("tasks: manual event for archived ISPDn -> 422", manual_event_archived_ispdn_rejected)
        await self.check("tasks: create task and quick patch status/importance", task_lifecycle)

    async def _scenario_security(self, client: httpx.AsyncClient, context: dict[str, Any]) -> None:
        async def measures_without_security_level() -> None:
            response = await client.get(f"/api/v1/ispdns/{context['ispdn_id']}/security-measures", headers=self.headers)
            assert_status(response, 409)

        async def calculate_security_level() -> None:
            response = await client.post(
                f"/api/v1/ispdns/{context['ispdn_id']}/security-level/calculate",
                headers=self.headers,
                json=security_level_payload(actual_level=None),
            )
            assert_status(response, 200)
            context["recommended_level"] = response.json()["recommended_level"]

        async def mismatch_without_justification_rejected() -> None:
            data = security_level_form_data(actual_level=1 if context["recommended_level"] != 1 else 2)
            response = await client.put(f"/api/v1/ispdns/{context['ispdn_id']}/security-level", headers=self.headers, data=data)
            assert_status(response, 422)

        async def save_matching_security_level() -> None:
            data = security_level_form_data(actual_level=context["recommended_level"])
            response = await client.put(f"/api/v1/ispdns/{context['ispdn_id']}/security-level", headers=self.headers, data=data)
            assert_status(response, 200)
            assert response.json()["actual_level"] == context["recommended_level"]

        async def security_measure_comment_required() -> None:
            table = await client.get(f"/api/v1/ispdns/{context['ispdn_id']}/security-measures", headers=self.headers)
            assert_status(table, 200)
            item = next(item for item in table.json()["items"] if item["comment_required"])
            response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/security-measures/{item['code']}",
                headers=self.headers,
                json={"factual_status": item["factual_status"], "comment": None},
            )
            assert_status(response, 422)
            ok_response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/security-measures/{item['code']}",
                headers=self.headers,
                json={"factual_status": item["factual_status"], "comment": f"{PREFIX}justification"},
            )
            assert_status(ok_response, 200)

        await self.check("security measures: without security level -> 409", measures_without_security_level)
        await self.check("security level: calculate recommended level", calculate_security_level)
        await self.check("security level: mismatch without justification -> 422", mismatch_without_justification_rejected)
        await self.check("security level: save matching actual level", save_matching_security_level)
        await self.check("security measures: required comment validation", security_measure_comment_required)

    async def _scenario_processing_data_centers_crypto(self, client: httpx.AsyncClient, context: dict[str, Any]) -> None:
        async def create_processing_process() -> None:
            response = await client.post(
                f"/api/v1/ispdns/{context['ispdn_id']}/processing-processes",
                headers=self.headers,
                json=processing_process_payload(),
            )
            assert_status(response, 201)
            context["process_id"] = response.json()["id"]

        async def duplicate_processing_process_reused() -> None:
            response = await client.post(
                f"/api/v1/ispdns/{context['ispdn_id']}/processing-processes",
                headers=self.headers,
                json=processing_process_payload(),
            )
            assert_status(response, 201)
            assert response.json()["id"] == context["process_id"]

        async def data_center_link_automation() -> None:
            create_response = await client.post(
                "/api/v1/data-centers",
                headers=self.headers,
                json={
                    "name": f"{PREFIX}DC",
                    "location_country": "Russia",
                    "location_address": "Krasnoyarsk",
                    "is_own_data_center": True,
                },
            )
            assert_status(create_response, 201)
            data_center_id = create_response.json()["id"]
            context["data_center_id"] = data_center_id
            link_response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/data-centers",
                headers=self.headers,
                json={"data_center_ids": [data_center_id]},
            )
            assert_status(link_response, 200)
            repeat_response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/data-centers",
                headers=self.headers,
                json={"data_center_ids": [data_center_id]},
            )
            assert_status(repeat_response, 200)
            events = await client.get("/api/v1/task-events", headers=self.headers)
            assert_status(events, 200)
            key = f"data_center_added_to_active_ispdn:{context['ispdn_id']}:{data_center_id}"
            assert sum(1 for item in events.json() if item["automation_key"] == key) == 1

        async def crypto_validation_and_automation() -> None:
            empty_response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/cryptography",
                headers=self.headers,
                json={"uses_cryptography": True, "crypto_tool_ids": []},
            )
            assert_status(empty_response, 422)
            create_response = await client.post(
                "/api/v1/crypto-tools",
                headers=self.headers,
                json={
                    "name": f"{PREFIX}Crypto",
                    "crypto_class": "KS1",
                    "manufacturer": "QA",
                    "serial_number": f"{PREFIX}001",
                },
            )
            assert_status(create_response, 201)
            crypto_tool_id = create_response.json()["id"]
            context["crypto_tool_id"] = crypto_tool_id
            link_response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/cryptography",
                headers=self.headers,
                json={"uses_cryptography": True, "crypto_tool_ids": [crypto_tool_id]},
            )
            assert_status(link_response, 200)
            repeat_response = await client.put(
                f"/api/v1/ispdns/{context['ispdn_id']}/cryptography",
                headers=self.headers,
                json={"uses_cryptography": True, "crypto_tool_ids": [crypto_tool_id]},
            )
            assert_status(repeat_response, 200)
            events = await client.get("/api/v1/task-events", headers=self.headers)
            assert_status(events, 200)
            key = f"crypto_tool_added_to_active_ispdn:{context['ispdn_id']}:{crypto_tool_id}"
            assert sum(1 for item in events.json() if item["automation_key"] == key) == 1

        await self.check("processing: create and link process to ISPDn", create_processing_process)
        await self.check("processing: duplicate signature reuses process", duplicate_processing_process_reused)
        await self.check("data centers: link to active ISPDn creates one automation event", data_center_link_automation)
        await self.check("crypto: validation and one automation event", crypto_validation_and_automation)

    async def _scenario_logout(self, client: httpx.AsyncClient) -> None:
        old_token = self.token

        async def logout() -> None:
            response = await client.post("/api/v1/auth/logout", headers=self.headers)
            assert_status(response, 204)

        async def revoked_token_rejected() -> None:
            response = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {old_token}"})
            assert_status(response, 401)

        await self.check("auth: logout", logout)
        await self.check("auth: token after logout -> 401", revoked_token_rejected)
        self.token = None

    async def _cleanup(self, client: httpx.AsyncClient) -> None:
        token = self.token
        if token is None:
            response = await client.post("/api/v1/auth/login", json={"username": self.username, "password": self.password})
            if response.status_code == 200:
                token = response.json()["access_token"]
        if token:
            await client.delete("/api/v1/auth/organization", headers={"Authorization": f"Bearer {token}"})

    @property
    def headers(self) -> dict[str, str]:
        if not self.token:
            raise RuntimeError("Auth token is not set")
        return {"Authorization": f"Bearer {self.token}"}

    def _print_report(self) -> None:
        print("QA smoke review results")
        for name, ok, message in self.results:
            print(f"{'PASS' if ok else 'FAIL'} | {name} | {message}")
        passed = sum(1 for _, ok, _ in self.results if ok)
        print(f"SUMMARY | passed={passed} failed={len(self.results) - passed} total={len(self.results)}")


def organization_payload(employee_id: int, *, operator_type: str) -> dict[str, Any]:
    base = {
        "full_legal_name": f"{PREFIX}Full Organization",
        "head_employee_id": employee_id,
        "registration_address": f"{PREFIX}Registration address",
        "registration_city": "Krasnoyarsk",
        "operator_type": operator_type,
        "head_office_region": "Krasnoyarsk region",
        "activity_regions": "Krasnoyarsk region",
        "rkn_office_address": f"{PREFIX}RKN office",
        "postal_address_matches_registration": True,
        "postal_address": None,
        "phone": "+7(391)111-22-33",
        "fax": None,
        "email": "qa@example.test",
        "okpo": None,
        "okfs": None,
        "okogu": None,
        "okopf": None,
        "document_approver_employee_id": employee_id,
        "information_security_responsible_employee_id": employee_id,
        "personal_data_processing_responsible_employee_id": employee_id,
        "personal_data_processing_termination_type": "end_condition",
        "personal_data_processing_termination_date": None,
        "personal_data_processing_termination_condition": f"{PREFIX}termination condition",
        "okveds": [{"code": "62.01", "name": f"{PREFIX}Software"}],
        "branches": [],
    }
    if operator_type == "individual_entrepreneur":
        return base | {
            "short_legal_name": None,
            "inn": "123456789012",
            "ogrn": "123456789012345",
            "kpp": None,
            "identity_document_type": "passport_rf",
            "identity_document_name": None,
            "identity_document_series": "1234",
            "identity_document_number": "123456",
            "identity_document_issued_by": f"{PREFIX}issuer",
            "identity_document_issued_date": "2020-01-01",
        }
    return base | {
        "short_legal_name": f"{PREFIX}LLC",
        "inn": "1234567890",
        "ogrn": "1234567890123",
        "kpp": "123456789",
        "identity_document_type": None,
        "identity_document_name": None,
        "identity_document_series": None,
        "identity_document_number": None,
        "identity_document_issued_by": None,
        "identity_document_issued_date": None,
    }


def ispdn_payload(employee_id: int, status: str, suffix: str = "active") -> dict[str, Any]:
    return {
        "name": f"{PREFIX}ISPDn {suffix}",
        "short_description": f"{PREFIX}description",
        "commissioning_date": "2026-05-15",
        "decommissioning_date": None,
        "website_url": "https://example.test",
        "responsible_employee_id": employee_id,
        "system_composition": f"{PREFIX}composition",
        "status": status,
        "security_tools": {"antivirus": True, "firewall_utm_ngfw": True},
    }


def security_level_payload(actual_level: int | None) -> dict[str, Any]:
    payload: dict[str, Any] = {
        "data_categories": {"special": False, "biometric": False, "public": False, "other": True},
        "subject_count_range": "less_than_100k",
        "threat_type": "threat_type_3",
        "subject_group": "clients_only",
    }
    if actual_level is not None:
        payload["actual_level"] = actual_level
    return payload


def security_level_form_data(actual_level: int) -> dict[str, str]:
    return {
        "data_categories": json.dumps({"special": False, "biometric": False, "public": False, "other": True}),
        "subject_count_range": "less_than_100k",
        "threat_type": "threat_type_3",
        "subject_group": "clients_only",
        "actual_level": str(actual_level),
    }


def processing_process_payload() -> dict[str, Any]:
    return {
        "purpose_name": f"{PREFIX}processing purpose",
        "processing_period": f"{PREFIX}processing period",
        "subject_categories": {"employees": True},
        "data_categories": {"full_name": True, "phone_number": True},
        "legal_bases": {"subject_consent": True},
        "personal_data_actions": {"collection": True, "storage": True},
        "processing_type": "mixed",
        "internal_network_transfer": "no_internal_network_transfer",
        "internet_transfer": "with_internet_transfer",
        "cross_border_transfer": False,
    }


def assert_status(response: httpx.Response, expected_status: int) -> None:
    if response.status_code != expected_status:
        raise AssertionError(
            f"{response.request.method} {response.request.url.path}: expected {expected_status}, "
            f"got {response.status_code}, body={response.text[:500]}",
        )
    if 200 <= response.status_code < 300:
        response.raise_for_status()


def assert_no_docx_placeholders(content: bytes) -> None:
    with zipfile.ZipFile(BytesIO(content)) as docx:
        document_xml = docx.read("word/document.xml").decode("utf-8", errors="ignore")
    leftovers = [marker for marker in ("{{", "}}", "{%", "%}") if marker in document_xml]
    if leftovers:
        raise AssertionError(f"Generated docx contains template leftovers: {leftovers}")


if __name__ == "__main__":
    raise SystemExit(asyncio.run(SmokeRunner().run()))
