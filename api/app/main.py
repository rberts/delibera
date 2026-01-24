"""
FastAPI application entry point.
Configures CORS, middleware, and base health endpoint.
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.tenancy import TenantMiddleware
from app.features.auth.router import router as auth_router
from app.features.assemblies.router import router as assemblies_router
from app.features.agendas.router import router as agendas_router
from app.features.condominiums.router import router as condominiums_router
from app.features.checkin.router import router as checkin_router
from app.features.qr_codes.router import router as qr_codes_router
from app.features.users.router import router as users_router
from app.features.voting.router import router as voting_router
from app.features.realtime.sse import router as realtime_router
from app.features.reports.router import router as reports_router
from app import models  # noqa: F401

app = FastAPI(
    title=settings.APP_NAME,
    description="API para votacao de assembleias de condominio",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS,
)

app.add_middleware(TenantMiddleware)

register_exception_handlers(app)

API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(
    condominiums_router,
    prefix=f"{API_V1_PREFIX}/condominiums",
    tags=["Condominiums"],
)
app.include_router(
    assemblies_router,
    prefix=f"{API_V1_PREFIX}/assemblies",
    tags=["Assemblies"],
)
app.include_router(
    agendas_router,
    prefix=f"{API_V1_PREFIX}/agendas",
    tags=["Agendas"],
)
app.include_router(
    users_router,
    prefix=f"{API_V1_PREFIX}/users",
    tags=["Users"],
)
app.include_router(
    qr_codes_router,
    prefix=f"{API_V1_PREFIX}/qr-codes",
    tags=["QR Codes"],
)
app.include_router(
    voting_router,
    prefix=f"{API_V1_PREFIX}/voting",
    tags=["Voting"],
)
app.include_router(
    checkin_router,
    prefix=f"{API_V1_PREFIX}/checkin",
    tags=["Check-in"],
)
app.include_router(
    realtime_router,
    prefix=f"{API_V1_PREFIX}/realtime",
    tags=["Real-time"],
)
app.include_router(
    reports_router,
    prefix=f"{API_V1_PREFIX}/reports",
    tags=["Reports"],
)


@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for monitoring."""
    return {"status": "healthy"}


@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    """Limit file upload size to MAX_UPLOAD_SIZE_MB."""
    if request.method == "POST" and "multipart/form-data" in request.headers.get("content-type", ""):
        content_length = request.headers.get("content-length")
        max_bytes = settings.MAX_UPLOAD_SIZE_MB * 1024 * 1024
        if content_length and int(content_length) > max_bytes:
            return JSONResponse(
                status_code=413,
                content={"detail": f"File too large. Maximum size is {settings.MAX_UPLOAD_SIZE_MB}MB."},
            )
    return await call_next(request)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
