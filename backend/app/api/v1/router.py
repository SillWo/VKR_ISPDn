from fastapi import APIRouter

from app.api.v1.endpoints.departments import router as departments_router
from app.api.v1.endpoints.documents import router as documents_router
from app.api.v1.endpoints.employees import router as employees_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.ispdn import router as ispdn_router
from app.api.v1.endpoints.organizations import router as organizations_router

api_router = APIRouter()
api_router.include_router(health_router)
api_router.include_router(ispdn_router)
api_router.include_router(organizations_router)
api_router.include_router(departments_router)
api_router.include_router(employees_router)
api_router.include_router(documents_router)
