"""Multi-tenancy middleware and utilities."""
from typing import Callable

from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware


class TenantMiddleware(BaseHTTPMiddleware):
    """Middleware placeholder for tenant context."""

    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        return response


def filter_by_tenant(query, model, tenant_id: int):
    """Apply tenant filter to SQLAlchemy query."""
    return query.filter(model.tenant_id == tenant_id)
