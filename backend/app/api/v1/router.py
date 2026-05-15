from fastapi import APIRouter

from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.control_events import router as control_events_router
from app.api.v1.endpoints.crypto_tools import router as crypto_tools_router
from app.api.v1.endpoints.data_centers import router as data_centers_router
from app.api.v1.endpoints.departments import router as departments_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.employees import router as employees_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.ispdn import router as ispdn_router
from app.api.v1.endpoints.organizations import card_readiness_router, router as organizations_router
from app.api.v1.endpoints.processing_processes import router as processing_processes_router
from app.api.v1.endpoints.security_level import router as security_level_router
from app.api.v1.endpoints.security_measures import router as security_measures_router
from app.api.v1.endpoints.task_events import router as task_events_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(auth_router)
api_router.include_router(ispdn_router)
api_router.include_router(organizations_router)
api_router.include_router(card_readiness_router)
api_router.include_router(departments_router)
api_router.include_router(employees_router)
api_router.include_router(documents_router)
api_router.include_router(control_events_router)
api_router.include_router(crypto_tools_router)
api_router.include_router(data_centers_router)
api_router.include_router(processing_processes_router)
api_router.include_router(security_level_router)
api_router.include_router(security_measures_router)
api_router.include_router(task_events_router)
