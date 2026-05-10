from fastapi import APIRouter

from app.api.v1.endpoints.control_events import router as control_events_router
from app.api.v1.endpoints.departments import router as departments_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.employees import router as employees_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.ispdn import router as ispdn_router
from app.api.v1.endpoints.organizations import router as organizations_router
from app.api.v1.endpoints.processing_processes import router as processing_processes_router
from app.api.v1.endpoints.processing_purposes import router as processing_purposes_router
from app.api.v1.endpoints.security_level import router as security_level_router
from app.api.v1.endpoints.security_measures import router as security_measures_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(ispdn_router)
api_router.include_router(organizations_router)
api_router.include_router(departments_router)
api_router.include_router(employees_router)
api_router.include_router(documents_router)
api_router.include_router(processing_purposes_router)
api_router.include_router(control_events_router)
api_router.include_router(processing_processes_router)
api_router.include_router(security_level_router)
api_router.include_router(security_measures_router)
