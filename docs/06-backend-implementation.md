## 6. Backend Implementation (Feature-by-Feature)

### 6.1 Project Structure

**Diretorio:** `api/` (monorepo)

```
api/
├── app/
│   ├── main.py                    # Entry point, CORS, middleware, routers
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py              # Settings (Pydantic BaseSettings)
│   │   ├── database.py            # SQLAlchemy setup
│   │   ├── dependencies.py        # Dependency injection (get_db, get_current_user, etc.)
│   │   ├── security.py            # Password hashing, JWT utilities
│   │   ├── tenancy.py             # Multi-tenant middleware
│   │   ├── exceptions.py          # Custom exceptions
│   │   ├── exception_handlers.py  # Global exception handlers
│   │   ├── pagination.py          # Pagination helpers
│   │   └── validators.py          # Custom validators (CPF/CNPJ)
│   ├── features/
│   │   ├── auth/
│   │   │   ├── __init__.py
│   │   │   ├── router.py          # Login, refresh, me endpoints
│   │   │   ├── schemas.py         # Pydantic schemas
│   │   │   └── service.py         # Business logic
│   │   ├── condominiums/
│   │   │   ├── __init__.py
│   │   │   ├── models.py          # SQLAlchemy models (segue DDL)
│   │   │   ├── router.py          # CRUD endpoints
│   │   │   ├── schemas.py         # Pydantic schemas
│   │   │   └── service.py         # Business logic
│   │   ├── assemblies/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   ├── service.py
│   │   │   └── csv_processor.py   # CSV import logic
│   │   ├── users/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── qr_codes/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── agendas/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── voting/
│   │   │   ├── __init__.py
│   │   │   ├── models.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── checkin/
│   │   │   ├── __init__.py
│   │   │   ├── router.py
│   │   │   ├── schemas.py
│   │   │   └── service.py
│   │   ├── realtime/
│   │   │   ├── __init__.py
│   │   │   └── sse.py             # Server-Sent Events
│   │   └── reports/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       ├── generator.py       # PDF generation
│   │       └── templates/
│   │           ├── attendance_list.html
│   │           ├── agenda_results.html
│   │           └── final_report.html
├── alembic/
│   ├── versions/                  # Migration files
│   └── env.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py                # Pytest fixtures
│   └── features/
│       ├── auth/
│       │   └── test_auth.py
│       ├── voting/
│       │   └── test_voting.py
│       └── ...
├── .env.example                   # Environment variables template
├── .gitignore
├── alembic.ini                    # Alembic configuration
├── requirements.txt               # Python dependencies
├── Dockerfile
├── docker-compose.yml             # Postgres + API local
└── README.md
```

**Descrição dos diretórios:**

- **`app/core/`:** Código compartilhado (config, database, auth, etc.)
- **`app/features/`:** Features organizadas por bounded context (feature-based architecture)
- **`alembic/`:** Database migrations (geradas e versionadas)
- **`tests/`:** Testes automatizados (mesma estrutura de features)

---

### 6.2 Core Setup

#### 6.2.1 `app/main.py` - Entry Point

```python
"""
FastAPI application entry point.
Configures CORS, middleware, exception handlers, and routers.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from app.core.config import settings
from app.core.exception_handlers import register_exception_handlers
from app.core.tenancy import TenantMiddleware

# Feature routers
from app.features.auth.router import router as auth_router
from app.features.condominiums.router import router as condominiums_router
from app.features.assemblies.router import router as assemblies_router
from app.features.users.router import router as users_router
from app.features.qr_codes.router import router as qr_codes_router
from app.features.agendas.router import router as agendas_router
from app.features.voting.router import router as voting_router
from app.features.checkin.router import router as checkin_router
from app.features.realtime.sse import router as realtime_router
from app.features.reports.router import router as reports_router

# Create FastAPI app
app = FastAPI(
    title="Assembly Voting API",
    description="API for condominium assembly voting management",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,  # ["https://app.seuapp.com"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted host middleware (security)
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Multi-tenant middleware
app.add_middleware(TenantMiddleware)

# Register exception handlers
register_exception_handlers(app)

# Health check endpoint
@app.get("/health")
async def health_check() -> dict[str, str]:
    """Health check endpoint for monitoring (Render needs this)."""
    return {"status": "healthy"}

# Register routers with /api/v1 prefix
API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(condominiums_router, prefix=f"{API_V1_PREFIX}/condominiums", tags=["Condominiums"])
app.include_router(assemblies_router, prefix=f"{API_V1_PREFIX}/assemblies", tags=["Assemblies"])
app.include_router(users_router, prefix=f"{API_V1_PREFIX}/users", tags=["Users"])
app.include_router(qr_codes_router, prefix=f"{API_V1_PREFIX}/qr-codes", tags=["QR Codes"])
app.include_router(agendas_router, prefix=f"{API_V1_PREFIX}/agendas", tags=["Agendas"])
app.include_router(voting_router, prefix=f"{API_V1_PREFIX}/voting", tags=["Voting"])
app.include_router(checkin_router, prefix=f"{API_V1_PREFIX}/checkin", tags=["Check-in"])
app.include_router(realtime_router, prefix=f"{API_V1_PREFIX}/realtime", tags=["Real-time"])
app.include_router(reports_router, prefix=f"{API_V1_PREFIX}/reports", tags=["Reports"])

# File upload configuration (5MB limit for CSV)
# Note: FastAPI has default 16MB limit, we reduce for security
from fastapi import Request
from fastapi.responses import JSONResponse

@app.middleware("http")
async def limit_upload_size(request: Request, call_next):
    """Limit file upload size to 5MB."""
    if request.method == "POST" and "multipart/form-data" in request.headers.get("content-type", ""):
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > 5 * 1024 * 1024:  # 5MB
            return JSONResponse(
                status_code=413,
                content={"detail": "File too large. Maximum size is 5MB."}
            )
    return await call_next(request)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
```

---

#### 6.2.2 `app/core/config.py` - Settings

```python
"""
Application settings using Pydantic BaseSettings.
Loads from environment variables with validation.
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    """Application configuration settings."""
    
    # Application
    APP_NAME: str = "Assembly Voting API"
    DEBUG: bool = False
    
    # Database
    DATABASE_URL: str
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]  # Frontend dev server
    ALLOWED_HOSTS: List[str] = ["*"]
    
    # Cookie settings (httpOnly for security)
    COOKIE_DOMAIN: str = ".seuapp.com"  # Works for api.seuapp.com and app.seuapp.com
    COOKIE_SECURE: bool = True  # HTTPS only in production
    COOKIE_SAMESITE: str = "lax"
    
    # File upload
    MAX_UPLOAD_SIZE_MB: int = 5
    
    class Config:
        env_file = ".env"
        case_sensitive = True


# Singleton instance
settings = Settings()
```

---

#### 6.2.3 `app/core/database.py` - SQLAlchemy Setup

```python
"""
SQLAlchemy database setup.
Creates engine, session factory, and base class for models.
"""
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings

# Create engine
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,  # Verify connections before using
    echo=settings.DEBUG   # Log SQL queries in debug mode
)

# Session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db() -> Session:
    """
    Dependency for getting database session.
    Automatically closes session after request.
    
    Usage:
        @app.get("/items")
        def get_items(db: Session = Depends(get_db)):
            return db.query(Item).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
```

**Nota:** Todos os models SQLAlchemy herdam de `Base` e seguem o DDL definido na Seção 5.

---

#### 6.2.4 `app/core/dependencies.py` - Dependency Injection

```python
"""
FastAPI dependencies for authentication and authorization.
Provides reusable dependencies for protecting routes.
"""
from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from typing import Optional
import jwt

from app.core.config import settings
from app.core.database import get_db
from app.core.enums import UserStatus
from app.features.users.models import User
from app.features.tenants.models import Tenant

# Security scheme
security = HTTPBearer()


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db)
) -> User:
    """
    Get current authenticated user from JWT token in httpOnly cookie.
    
    Raises:
        HTTPException 401: If token is invalid or user not found
    
    Returns:
        User: Current authenticated user
    """
    if not access_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated"
        )
    
    try:
        # Decode JWT token
        payload = jwt.decode(
            access_token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        user_id: int = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    # Get user from database
    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None),
        User.status == UserStatus.active  # Block inactive users
    ).first()
    
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user


async def get_current_tenant(
    current_user: User = Depends(get_current_user)
) -> int:
    """
    Get current tenant ID from authenticated user.
    All queries should filter by this tenant_id for isolation.
    
    Args:
        current_user: Current authenticated user (injected by get_current_user)
    
    Returns:
        int: Tenant ID for the current user
    """
    return current_user.tenant_id


async def require_property_manager(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require user to have 'property_manager' role.
    
    Raises:
        HTTPException 403: If user is not a property manager
    
    Returns:
        User: Current user (verified as property manager)
    """
    if current_user.role != "property_manager":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Property manager access required"
        )
    return current_user


async def require_operator_or_manager(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Require user to be either property_manager or assembly_operator.
    
    Raises:
        HTTPException 403: If user doesn't have required role
    
    Returns:
        User: Current user (verified role)
    """
    if current_user.role not in ["property_manager", "assembly_operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator or manager access required"
        )
    return current_user
```

---

### 6.3 Authentication Feature (COMPLETO)

#### 6.3.1 `app/features/auth/schemas.py`

```python
"""
Pydantic schemas for authentication endpoints.
"""
from pydantic import BaseModel, EmailStr
from typing import Optional


class LoginRequest(BaseModel):
    """Login request payload."""
    email: EmailStr
    password: str


class TokenData(BaseModel):
    """Data stored in JWT token."""
    sub: int  # User ID
    tenant_id: int
    role: str
    exp: int  # Expiration timestamp


class TokenResponse(BaseModel):
    """Token response (not used with httpOnly cookies, but kept for API docs)."""
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    """User information response."""
    id: int
    email: str
    name: str
    role: str
    tenant_id: int
    
    class Config:
        from_attributes = True
```

---

#### 6.3.2 `app/features/auth/security.py`

```python
"""
Security utilities for password hashing and JWT tokens.
"""
from datetime import datetime, timedelta
from passlib.context import CryptContext
import jwt
from app.core.config import settings

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """
    Hash a plain password using bcrypt.
    
    Args:
        password: Plain text password
    
    Returns:
        str: Hashed password
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.
    
    Args:
        plain_password: Plain text password to verify
        hashed_password: Hashed password from database
    
    Returns:
        bool: True if password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(user_id: int, tenant_id: int, role: str) -> str:
    """
    Create JWT access token for authenticated user.
    
    Args:
        user_id: User's ID
        tenant_id: User's tenant ID (for multi-tenancy)
        role: User's role (property_manager or assembly_operator)
    
    Returns:
        str: Encoded JWT token
    """
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    payload = {
        "sub": user_id,
        "tenant_id": tenant_id,
        "role": role,
        "exp": expire
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def create_refresh_token(user_id: int) -> str:
    """
    Create JWT refresh token for token renewal.
    
    Args:
        user_id: User's ID
    
    Returns:
        str: Encoded JWT refresh token
    """
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    
    payload = {
        "sub": user_id,
        "exp": expire,
        "type": "refresh"
    }
    
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return token


def decode_token(token: str) -> dict:
    """
    Decode and verify JWT token.
    
    Args:
        token: Encoded JWT token
    
    Returns:
        dict: Decoded token payload
    
    Raises:
        jwt.ExpiredSignatureError: If token is expired
        jwt.JWTError: If token is invalid
    """
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    return payload
```

---

#### 6.3.3 `app/features/auth/service.py`

```python
"""
Authentication business logic.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.core.enums import UserStatus
from app.features.auth.security import verify_password
from app.features.users.models import User


def authenticate_user(db: Session, email: str, password: str) -> User:
    """
    Authenticate user by email and password.
    
    Args:
        db: Database session
        email: User's email
        password: Plain text password
    
    Returns:
        User: Authenticated user
    
    Raises:
        HTTPException 401: If credentials are invalid
    """
    # Find user by email (exclude soft-deleted users)
    user = db.query(User).filter(
        User.email == email,
        User.deleted_at.is_(None)
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Verify password
    if not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if user.status != UserStatus.active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User is inactive"
        )
    
    return user
```

---

#### 6.3.4 `app/features/auth/router.py`

```python
"""
Authentication endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.core.config import settings
from app.features.auth.schemas import LoginRequest, UserResponse
from app.features.auth.service import authenticate_user
from app.features.auth.security import create_access_token, create_refresh_token
from app.features.users.models import User

router = APIRouter()


@router.post("/login")
async def login(
    credentials: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
) -> UserResponse:
    """
    Login endpoint - authenticates user and sets httpOnly cookies.
    
    Returns user information and sets cookies:
    - access_token: 15 minutes (for API calls)
    - refresh_token: 7 days (for token renewal)
    """
    # Authenticate user
    user = authenticate_user(db, credentials.email, credentials.password)
    
    # Create tokens
    access_token = create_access_token(user.id, user.tenant_id, user.role)
    refresh_token = create_refresh_token(user.id)
    
    # Set httpOnly cookies (secure, not accessible via JavaScript)
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,  # HTTPS only in production
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
    
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=settings.COOKIE_SECURE,
        samesite=settings.COOKIE_SAMESITE,
        domain=settings.COOKIE_DOMAIN,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
    )
    
    # Return user info
    return UserResponse.from_orm(user)


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    """
    Logout endpoint - clears httpOnly cookies.
    """
    response.delete_cookie(key="access_token", domain=settings.COOKIE_DOMAIN)
    response.delete_cookie(key="refresh_token", domain=settings.COOKIE_DOMAIN)
    
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(
    current_user: User = Depends(get_current_user)
) -> UserResponse:
    """
    Get current authenticated user information.
    Protected route - requires valid access_token cookie.
    """
    return UserResponse.from_orm(current_user)
```

---

### 6.4 Multi-Tenancy (COMPLETO)

#### 6.4.1 `app/core/tenancy.py`

```python
"""
Multi-tenancy middleware and utilities.
Ensures tenant isolation at the database level.
"""
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware
from typing import Callable


class TenantMiddleware(BaseHTTPMiddleware):
    """
    Middleware to extract and validate tenant context.
    
    Note: Tenant is extracted from JWT token in get_current_user dependency,
    not from middleware. This middleware is for future enhancements
    (e.g., logging tenant_id, rate limiting per tenant).
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        """
        Process request and add tenant context if available.
        
        Args:
            request: Incoming HTTP request
            call_next: Next middleware/handler in chain
        
        Returns:
            Response from next handler
        """
        # For now, just pass through
        # In future: could extract tenant_id from JWT and add to request.state
        response = await call_next(request)
        return response


# Tenant isolation helper (usado em queries)
def filter_by_tenant(query, model, tenant_id: int):
    """
    Apply tenant filter to SQLAlchemy query.
    
    Usage:
        query = db.query(Condominium)
        query = filter_by_tenant(query, Condominium, tenant_id)
        results = query.all()
    
    Args:
        query: SQLAlchemy query object
        model: SQLAlchemy model class
        tenant_id: Tenant ID to filter by
    
    Returns:
        Filtered query
    """
    return query.filter(model.tenant_id == tenant_id)
```

**Exemplo de uso em queries:**

```python
# Em qualquer service function
from app.core.dependencies import get_current_tenant

async def list_condominiums(
    db: Session,
    tenant_id: int = Depends(get_current_tenant)
):
    """Lista apenas condomínios do tenant atual."""
    return db.query(Condominium)\
        .filter(Condominium.tenant_id == tenant_id)\
        .all()
```

---

### 6.5 CRUD Pattern - Exemplo Completo (Condominiums)

Esta seção mostra implementação COMPLETA de um CRUD. Outras features seguem o mesmo pattern.

#### 6.5.1 `app/features/condominiums/models.py`

```python
"""
SQLAlchemy model for Condominiums.
Follows DDL from Section 5.6.3.
"""
from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
from app.core.enums import CondominiumStatus


class Condominium(Base):
    """
    Condominium model - represents condos managed by property manager.
    """
    __tablename__ = "condominiums"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    address = Column(Text, nullable=False)
    status = Column(Enum(CondominiumStatus, name="condominium_status"), nullable=False, server_default="active")
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    tenant = relationship("Tenant", back_populates="condominiums")
    assemblies = relationship("Assembly", back_populates="condominium")
```

**Nota:** Todos os models seguem o DDL da Seção 5. Não repetiremos código de models para outras features.

---

#### 6.5.2 `app/features/condominiums/schemas.py`

```python
"""
Pydantic schemas for Condominium CRUD operations.
"""
from pydantic import BaseModel, validator
from datetime import datetime
from typing import Optional
from app.core.enums import CondominiumStatus


class CondominiumBase(BaseModel):
    """Base schema with common fields."""
    name: str
    address: str
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        """Validate name is not empty."""
        if not v or not v.strip():
            raise ValueError('Name cannot be empty')
        return v.strip()


class CondominiumCreate(CondominiumBase):
    """Schema for creating a condominium."""
    pass


class CondominiumUpdate(BaseModel):
    """Schema for updating a condominium (all fields optional)."""
    name: Optional[str] = None
    address: Optional[str] = None
    status: Optional[CondominiumStatus] = None
    
    @validator('name')
    def name_must_not_be_empty(cls, v):
        """Validate name if provided."""
        if v is not None and (not v or not v.strip()):
            raise ValueError('Name cannot be empty')
        return v.strip() if v else None


class CondominiumResponse(CondominiumBase):
    """Schema for condominium response."""
    id: int
    tenant_id: int
    status: CondominiumStatus
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class CondominiumListResponse(BaseModel):
    """Schema for paginated list of condominiums."""
    items: list[CondominiumResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
```

---

#### 6.5.3 `app/features/condominiums/service.py`

```python
"""
Business logic for Condominium CRUD operations.
"""
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from typing import Optional

from app.core.enums import CondominiumStatus
from app.features.condominiums.models import Condominium
from app.features.condominiums.schemas import CondominiumCreate, CondominiumUpdate


def create_condominium(
    db: Session,
    condominium: CondominiumCreate,
    tenant_id: int
) -> Condominium:
    """
    Create a new condominium.
    
    Args:
        db: Database session
        condominium: Condominium data
        tenant_id: Current tenant ID (from JWT)
    
    Returns:
        Condominium: Created condominium
    """
    db_condominium = Condominium(
        tenant_id=tenant_id,
        name=condominium.name,
        address=condominium.address
    )
    
    db.add(db_condominium)
    db.commit()
    db.refresh(db_condominium)
    
    return db_condominium


def get_condominium(
    db: Session,
    condominium_id: int,
    tenant_id: int
) -> Condominium:
    """
    Get condominium by ID (with tenant isolation).
    
    Args:
        db: Database session
        condominium_id: Condominium ID
        tenant_id: Current tenant ID
    
    Returns:
        Condominium: Condominium object
    
    Raises:
        HTTPException 404: If condominium not found
    """
    condominium = db.query(Condominium).filter(
        Condominium.id == condominium_id,
        Condominium.tenant_id == tenant_id
    ).first()
    
    if not condominium:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Condominium not found"
        )
    
    return condominium


def list_condominiums(
    db: Session,
    tenant_id: int,
    skip: int = 0,
    limit: int = 100,
    status_filter: CondominiumStatus = CondominiumStatus.active
) -> tuple[list[Condominium], int]:
    """
    List condominiums with pagination (tenant isolated).
    
    Args:
        db: Database session
        tenant_id: Current tenant ID
        skip: Number of records to skip
        limit: Maximum number of records to return
    
    Returns:
        tuple: (list of condominiums, total count)
    """
    query = db.query(Condominium).filter(
        Condominium.tenant_id == tenant_id,
        Condominium.status == status_filter
    )
    
    total = query.count()
    condominiums = query.offset(skip).limit(limit).all()
    
    return condominiums, total


def update_condominium(
    db: Session,
    condominium_id: int,
    condominium_update: CondominiumUpdate,
    tenant_id: int
) -> Condominium:
    """
    Update condominium.
    
    Args:
        db: Database session
        condominium_id: Condominium ID
        condominium_update: Fields to update
        tenant_id: Current tenant ID
    
    Returns:
        Condominium: Updated condominium
    
    Raises:
        HTTPException 404: If condominium not found
    """
    condominium = get_condominium(db, condominium_id, tenant_id)
    
    # Update only provided fields
    update_data = condominium_update.dict(exclude_unset=True)
    if condominium.status == CondominiumStatus.inactive:
        allowed_fields = {"status"}
        if set(update_data.keys()) - allowed_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Inactive condominiums can only change status"
            )
    for field, value in update_data.items():
        setattr(condominium, field, value)
    
    db.commit()
    db.refresh(condominium)
    
    return condominium


def delete_condominium(
    db: Session,
    condominium_id: int,
    tenant_id: int
) -> None:
    """
    Deactivate condominium.
    
    Args:
        db: Database session
        condominium_id: Condominium ID
        tenant_id: Current tenant ID
    
    Raises:
        HTTPException 404: If condominium not found
        HTTPException 400: If condominium has assemblies (FK constraint)
    """
    condominium = get_condominium(db, condominium_id, tenant_id)
    
    condominium.status = CondominiumStatus.inactive
    db.commit()
```

---

#### 6.5.4 `app/features/condominiums/router.py`

```python
"""
Condominium CRUD endpoints.
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from math import ceil

from app.core.database import get_db
from app.core.enums import CondominiumStatus
from app.core.dependencies import get_current_tenant, require_property_manager
from app.features.condominiums import service
from app.features.condominiums.schemas import (
    CondominiumCreate,
    CondominiumUpdate,
    CondominiumResponse,
    CondominiumListResponse
)

router = APIRouter()


@router.post(
    "/",
    response_model=CondominiumResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create condominium",
    dependencies=[Depends(require_property_manager)]
)
async def create_condominium(
    condominium: CondominiumCreate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> CondominiumResponse:
    """
    Create a new condominium.
    
    **Requires:** property_manager role
    """
    db_condominium = service.create_condominium(db, condominium, tenant_id)
    return CondominiumResponse.from_orm(db_condominium)


@router.get(
    "/",
    response_model=CondominiumListResponse,
    summary="List condominiums"
)
async def list_condominiums(
    page: int = 1,
    page_size: int = 20,
    status: str = "active",
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> CondominiumListResponse:
    """
    List condominiums with pagination.
    
    **Query Parameters:**
    - page: Page number (default: 1)
    - page_size: Items per page (default: 20, max: 100)
    """
    # Validate pagination
    page = max(1, page)
    page_size = min(page_size, 100)
    skip = (page - 1) * page_size
    
    try:
        status_filter = CondominiumStatus(status)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid status filter") from exc

    condominiums, total = service.list_condominiums(db, tenant_id, skip, page_size, status_filter)
    
    return CondominiumListResponse(
        items=[CondominiumResponse.from_orm(c) for c in condominiums],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=ceil(total / page_size) if total > 0 else 0
    )


@router.get(
    "/{condominium_id}",
    response_model=CondominiumResponse,
    summary="Get condominium"
)
async def get_condominium(
    condominium_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> CondominiumResponse:
    """
    Get condominium by ID.
    """
    condominium = service.get_condominium(db, condominium_id, tenant_id)
    return CondominiumResponse.from_orm(condominium)


@router.put(
    "/{condominium_id}",
    response_model=CondominiumResponse,
    summary="Update condominium",
    dependencies=[Depends(require_property_manager)]
)
async def update_condominium(
    condominium_id: int,
    condominium: CondominiumUpdate,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> CondominiumResponse:
    """
    Update condominium.
    
    **Requires:** property_manager role
    """
    db_condominium = service.update_condominium(db, condominium_id, condominium, tenant_id)
    return CondominiumResponse.from_orm(db_condominium)


@router.delete(
    "/{condominium_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Deactivate condominium",
    dependencies=[Depends(require_property_manager)]
)
async def delete_condominium(
    condominium_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> None:
    """
    Deactivate condominium.
    
    **Requires:** property_manager role
    
    **Note:** Set status to inactive. Use update to reactivate.
    """
    service.delete_condominium(db, condominium_id, tenant_id)
```

---

### 6.6 Features que Seguem CRUD Pattern

As seguintes features seguem o **mesmo pattern** do exemplo Condominiums acima. Diferenças específicas são destacadas:

- **Assemblies:** status `cancelled` substitui delete; listagem aceita `status=active|cancelled`.
- **Users:** status `active|inactive` controla login; listagem aceita `status=active|inactive`.
- **QR Codes:** status `active|inactive` controla uso; delete vira inativação.
- **Agendas:** delete vira `status=cancelled`; abrir/fechar agenda preenche `opened_at`/`closed_at`.



---

## 7. Frontend Implementation (Feature-by-Feature)

[To be written]

---

## 8. Testing Strategy

[To be written]

---

## 9. Deployment

[To be written]

---

## 10. Roadmap de Implementação

[To be written]

---

**Fim do SPEC**

#### 6.8.2 `app/features/checkin/router.py`

```python
"""
Check-in endpoints.
"""
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.core.dependencies import (
    get_current_tenant,
    get_current_user,
    require_operator_or_manager
)
from app.features.checkin import service
from app.features.checkin.schemas import (
    CheckInRequest,
    CheckInResponse,
    AttendanceListResponse,
    SelectUnitsByOwnerRequest
)

router = APIRouter()


@router.post(
    "/assemblies/{assembly_id}/checkin",
    response_model=CheckInResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Check-in with QR code",
    dependencies=[Depends(require_operator_or_manager)]
)
async def checkin(
    assembly_id: int,
    checkin_data: CheckInRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(get_current_user)
) -> CheckInResponse:
    """
    Assign QR code to units (check-in process).
    
    **Requires:** operator or property_manager role
    """
    assignment = service.assign_qr_code(
        db,
        assembly_id,
        checkin_data.qr_token,
        checkin_data.unit_ids,
        checkin_data.is_proxy,
        current_user.id,
        tenant_id
    )
    return CheckInResponse.from_orm(assignment)


@router.delete(
    "/assignments/{assignment_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Undo check-in",
    dependencies=[Depends(require_operator_or_manager)]
)
async def undo_checkin(
    assignment_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> None:
    """
    Remove QR code assignment (undo check-in).
    
    **Requires:** operator or property_manager role
    
    **Note:** Cannot undo if votes exist for assigned units.
    """
    service.unassign_qr_code(db, assignment_id, tenant_id)


@router.get(
    "/assemblies/{assembly_id}/attendance",
    response_model=AttendanceListResponse,
    summary="Get attendance list"
)
async def get_attendance(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> AttendanceListResponse:
    """
    Get attendance list for assembly (real-time).
    """
    attendance = service.get_attendance_list(db, assembly_id, tenant_id)
    return AttendanceListResponse(items=attendance)


@router.post(
    "/assemblies/{assembly_id}/select-units-by-owner",
    response_model=List[int],
    summary="Select all units by owner"
)
async def select_units_by_owner(
    assembly_id: int,
    request: SelectUnitsByOwnerRequest,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> List[int]:
    """
    Helper endpoint: Get all unit IDs for a specific owner.
    Used for "Select all by [Owner]" shortcut in UI.
    """
    return service.select_all_units_by_owner(
        db,
        assembly_id,
        request.owner_name,
        tenant_id
    )
```

---

### 6.9 Real-time SSE (COMPLETO - Complexo)

#### 6.9.1 `app/features/realtime/sse.py`

```python
"""
Server-Sent Events (SSE) for real-time updates.
Single global connection broadcasts events to operator dashboard.
"""
from fastapi import APIRouter, Depends, Request
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import asyncio
import json
from typing import AsyncGenerator, Dict, Set
from datetime import datetime

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_current_tenant

router = APIRouter()

# Global event broadcaster
class EventBroadcaster:
    """
    Manages SSE connections and broadcasts events.
    Singleton pattern for global state.
    """
    def __init__(self):
        self.connections: Dict[int, Set[asyncio.Queue]] = {}  # assembly_id → set of queues
    
    async def connect(self, assembly_id: int) -> asyncio.Queue:
        """Add new connection for an assembly."""
        queue = asyncio.Queue()
        
        if assembly_id not in self.connections:
            self.connections[assembly_id] = set()
        
        self.connections[assembly_id].add(queue)
        return queue
    
    async def disconnect(self, assembly_id: int, queue: asyncio.Queue):
        """Remove connection."""
        if assembly_id in self.connections:
            self.connections[assembly_id].discard(queue)
            
            # Clean up empty sets
            if not self.connections[assembly_id]:
                del self.connections[assembly_id]
    
    async def broadcast(self, assembly_id: int, event_type: str, data: dict):
        """
        Broadcast event to all connections for an assembly.
        
        Args:
            assembly_id: Assembly ID
            event_type: Event type (vote_update, checkin_update, agenda_update)
            data: Event data (dict)
        """
        if assembly_id not in self.connections:
            return
        
        event = {
            "type": event_type,
            "data": data,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Send to all connected clients
        for queue in self.connections[assembly_id]:
            await queue.put(event)

# Singleton instance
broadcaster = EventBroadcaster()


async def event_generator(
    request: Request,
    assembly_id: int,
    queue: asyncio.Queue
) -> AsyncGenerator[str, None]:
    """
    Generate SSE events from queue.
    
    Args:
        request: FastAPI request (to detect client disconnect)
        assembly_id: Assembly ID
        queue: Event queue for this connection
    
    Yields:
        SSE formatted strings
    """
    try:
        while True:
            # Check if client disconnected
            if await request.is_disconnected():
                break
            
            try:
                # Wait for event with timeout
                event = await asyncio.wait_for(queue.get(), timeout=30.0)
                
                # Format as SSE
                yield f"event: {event['type']}\n"
                yield f"data: {json.dumps(event['data'])}\n\n"
                
            except asyncio.TimeoutError:
                # Send heartbeat (keep connection alive)
                yield f"event: heartbeat\n"
                yield f"data: {json.dumps({'status': 'alive'})}\n\n"
    
    finally:
        # Clean up connection
        await broadcaster.disconnect(assembly_id, queue)


@router.get("/assemblies/{assembly_id}/stream")
async def stream_events(
    assembly_id: int,
    request: Request,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant),
    current_user = Depends(get_current_user)
) -> StreamingResponse:
    """
    SSE endpoint for real-time assembly updates.
    
    **Events:**
    - vote_update: New vote cast
    - checkin_update: New check-in
    - agenda_update: Agenda opened/closed
    - heartbeat: Keep-alive (every 30s)
    
    **Usage (Frontend):**
    ```javascript
    const eventSource = new EventSource('/api/v1/realtime/assemblies/123/stream');
    
    eventSource.addEventListener('vote_update', (e) => {
        const data = JSON.parse(e.data);
        console.log('New vote:', data);
    });
    ```
    """
    # Validate assembly belongs to tenant
    from app.features.assemblies.models import Assembly
    from app.features.condominiums.models import Condominium
    
    assembly = db.query(Assembly)\
        .join(Condominium)\
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id
        ).first()
    
    if not assembly:
        from fastapi import HTTPException, status
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assembly not found"
        )
    
    # Create connection
    queue = await broadcaster.connect(assembly_id)
    
    # Return SSE stream
    return StreamingResponse(
        event_generator(request, assembly_id, queue),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"  # Disable nginx buffering
        }
    )


# Helper functions to trigger events (called from other services)

async def notify_vote_cast(assembly_id: int, agenda_id: int, votes_count: int):
    """Notify vote was cast."""
    await broadcaster.broadcast(
        assembly_id,
        "vote_update",
        {
            "agenda_id": agenda_id,
            "votes_count": votes_count
        }
    )


async def notify_checkin(assembly_id: int, units_present: int, fraction_present: float):
    """Notify new check-in."""
    await broadcaster.broadcast(
        assembly_id,
        "checkin_update",
        {
            "units_present": units_present,
            "fraction_present": fraction_present
        }
    )


async def notify_agenda_status(assembly_id: int, agenda_id: int, status: str):
    """Notify agenda status changed (opened/closed)."""
    await broadcaster.broadcast(
        assembly_id,
        "agenda_update",
        {
            "agenda_id": agenda_id,
            "status": status
        }
    )
```

**Integração com outros services:**

```python
# Em voting/service.py - após criar voto
from app.features.realtime.sse import notify_vote_cast

async def cast_vote(...):
    # ... create vote ...
    
    # Notify SSE
    votes_count = db.query(Vote).filter(
        Vote.agenda_id == agenda_id,
        Vote.is_valid == True
    ).count()
    
    await notify_vote_cast(assembly.id, agenda_id, votes_count)
```

Esse é o modelo básico de SSE. Continuo com PDF, CSV, Error Handling e Testing?


---

### 6.10 PDF Generation (COMPLETO - Complexo)

#### 6.10.1 `app/features/reports/generator.py`

```python
"""
PDF generation using WeasyPrint and Jinja2 templates.
"""
from weasyprint import HTML, CSS
from jinja2 import Environment, FileSystemLoader
from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from datetime import datetime
from io import BytesIO
from typing import Optional

from app.features.assemblies.models import Assembly, AssemblyUnit
from app.features.agendas.models import Agenda
from app.features.voting.service import calculate_results, calculate_quorum
from app.features.checkin.service import get_attendance_list


# Jinja2 environment
template_env = Environment(
    loader=FileSystemLoader('app/features/reports/templates'),
    autoescape=True
)


def generate_attendance_pdf(
    db: Session,
    assembly_id: int,
    tenant_id: int
) -> BytesIO:
    """
    Generate attendance list PDF.
    
    Args:
        db: Database session
        assembly_id: Assembly ID
        tenant_id: Current tenant ID
    
    Returns:
        BytesIO: PDF file buffer
    
    Raises:
        HTTPException 404: Assembly not found
    """
    # Get assembly data
    from app.features.condominiums.models import Condominium
    
    assembly = db.query(Assembly)\
        .join(Condominium)\
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id
        ).first()
    
    if not assembly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assembly not found"
        )
    
    # Get condominium
    condominium = assembly.condominium
    
    # Get attendance list
    attendance = get_attendance_list(db, assembly_id, tenant_id)
    
    # Calculate quorum
    quorum = calculate_quorum(db, assembly_id, tenant_id)
    
    # Prepare template data
    context = {
        'condominium_name': condominium.name,
        'assembly_title': assembly.title,
        'assembly_date': assembly.assembly_date.strftime('%d/%m/%Y %H:%M'),
        'assembly_location': assembly.location,
        'assembly_type': 'Ordinária' if assembly.assembly_type == 'ordinary' else 'Extraordinária',
        'total_units': quorum.total_units,
        'units_present': quorum.units_present,
        'fraction_present': quorum.fraction_present,
        'quorum_reached': quorum.quorum_reached,
        'attendance': attendance,
        'generated_at': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    }
    
    # Render template
    template = template_env.get_template('attendance_list.html')
    html_content = template.render(**context)
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer


def generate_agenda_results_pdf(
    db: Session,
    agenda_id: int,
    tenant_id: int
) -> BytesIO:
    """
    Generate agenda results PDF.
    
    Args:
        db: Database session
        agenda_id: Agenda ID
        tenant_id: Current tenant ID
    
    Returns:
        BytesIO: PDF file buffer
    
    Raises:
        HTTPException 404: Agenda not found
    """
    # Get agenda
    from app.features.condominiums.models import Condominium
    
    agenda = db.query(Agenda)\
        .join(Assembly)\
        .join(Condominium)\
        .filter(
            Agenda.id == agenda_id,
            Condominium.tenant_id == tenant_id
        ).first()
    
    if not agenda:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Agenda not found"
        )
    
    # Get assembly and condominium
    assembly = agenda.assembly
    condominium = assembly.condominium
    
    # Calculate results
    results = calculate_results(db, agenda_id, tenant_id)
    
    # Prepare template data
    context = {
        'condominium_name': condominium.name,
        'assembly_title': assembly.title,
        'assembly_date': assembly.assembly_date.strftime('%d/%m/%Y %H:%M'),
        'agenda_title': agenda.title,
        'agenda_description': agenda.description or '',
        'total_units_present': results.total_units_present,
        'total_units_voted': results.total_units_voted,
        'total_fraction_present': results.total_fraction_present,
        'total_fraction_voted': results.total_fraction_voted,
        'results': results.results,
        'generated_at': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    }
    
    # Render template
    template = template_env.get_template('agenda_results.html')
    html_content = template.render(**context)
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer


def generate_final_report_pdf(
    db: Session,
    assembly_id: int,
    tenant_id: int
) -> BytesIO:
    """
    Generate final assembly report (attendance + all agenda results).
    
    Args:
        db: Database session
        assembly_id: Assembly ID
        tenant_id: Current tenant ID
    
    Returns:
        BytesIO: PDF file buffer
    """
    # Get assembly
    from app.features.condominiums.models import Condominium
    
    assembly = db.query(Assembly)\
        .join(Condominium)\
        .filter(
            Assembly.id == assembly_id,
            Condominium.tenant_id == tenant_id
        ).first()
    
    if not assembly:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assembly not found"
        )
    
    condominium = assembly.condominium
    
    # Get all agendas
    agendas = db.query(Agenda)\
        .filter(Agenda.assembly_id == assembly_id)\
        .order_by(Agenda.display_order)\
        .all()
    
    # Calculate results for each agenda
    agenda_results = []
    for agenda in agendas:
        results = calculate_results(db, agenda.id, tenant_id)
        agenda_results.append({
            'title': agenda.title,
            'description': agenda.description,
            'status': agenda.status,
            'results': results.results,
            'total_units_voted': results.total_units_voted,
            'total_fraction_voted': results.total_fraction_voted
        })
    
    # Get attendance and quorum
    attendance = get_attendance_list(db, assembly_id, tenant_id)
    quorum = calculate_quorum(db, assembly_id, tenant_id)
    
    # Prepare template data
    context = {
        'condominium_name': condominium.name,
        'condominium_address': condominium.address,
        'assembly_title': assembly.title,
        'assembly_date': assembly.assembly_date.strftime('%d/%m/%Y %H:%M'),
        'assembly_location': assembly.location,
        'assembly_type': 'Ordinária' if assembly.assembly_type == 'ordinary' else 'Extraordinária',
        'total_units': quorum.total_units,
        'units_present': quorum.units_present,
        'fraction_present': quorum.fraction_present,
        'quorum_reached': quorum.quorum_reached,
        'attendance': attendance,
        'agendas': agenda_results,
        'generated_at': datetime.now().strftime('%d/%m/%Y %H:%M:%S')
    }
    
    # Render template
    template = template_env.get_template('final_report.html')
    html_content = template.render(**context)
    
    # Generate PDF
    pdf_buffer = BytesIO()
    HTML(string=html_content).write_pdf(pdf_buffer)
    pdf_buffer.seek(0)
    
    return pdf_buffer
```

---

#### 6.10.2 Template Jinja2 Exemplo: `attendance_list.html`

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>Lista de Presença - {{ assembly_title }}</title>
    <style>
        @page {
            size: A4;
            margin: 2cm;
            @bottom-right {
                content: "Página " counter(page) " de " counter(pages);
            }
        }
        
        body {
            font-family: Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.4;
        }
        
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        
        .header h1 {
            margin: 0;
            font-size: 18pt;
            color: #333;
        }
        
        .header p {
            margin: 5px 0;
            color: #666;
        }
        
        .summary {
            background-color: #f5f5f5;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 5px;
        }
        
        .summary-row {
            display: flex;
            justify-content: space-between;
            margin: 5px 0;
        }
        
        .summary-label {
            font-weight: bold;
        }
        
        .quorum-badge {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-weight: bold;
        }
        
        .quorum-reached {
            background-color: #d4edda;
            color: #155724;
        }
        
        .quorum-not-reached {
            background-color: #f8d7da;
            color: #721c24;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        
        th {
            background-color: #333;
            color: white;
            padding: 10px;
            text-align: left;
            font-weight: bold;
        }
        
        td {
            padding: 8px;
            border-bottom: 1px solid #ddd;
        }
        
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        
        .proxy-indicator {
            color: #dc3545;
            font-weight: bold;
        }
        
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 8pt;
            color: #666;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Lista de Presença</h1>
        <p><strong>{{ condominium_name }}</strong></p>
        <p>{{ assembly_title }}</p>
        <p>{{ assembly_date }} - {{ assembly_location }}</p>
        <p>Tipo: {{ assembly_type }}</p>
    </div>
    
    <div class="summary">
        <div class="summary-row">
            <span class="summary-label">Total de Unidades:</span>
            <span>{{ total_units }}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Unidades Presentes:</span>
            <span>{{ units_present }}</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Fração Ideal Presente:</span>
            <span>{{ fraction_present }}%</span>
        </div>
        <div class="summary-row">
            <span class="summary-label">Quórum:</span>
            <span>
                {% if quorum_reached %}
                    <span class="quorum-badge quorum-reached">✓ ATINGIDO</span>
                {% else %}
                    <span class="quorum-badge quorum-not-reached">✗ NÃO ATINGIDO</span>
                {% endif %}
            </span>
        </div>
    </div>
    
    <table>
        <thead>
            <tr>
                <th>QR Code</th>
                <th>Unidade(s)</th>
                <th>Proprietário</th>
                <th>Fração Ideal</th>
                <th>Procuração</th>
            </tr>
        </thead>
        <tbody>
            {% for item in attendance %}
            <tr>
                <td>{{ item.qr_visual_number }}</td>
                <td>
                    {% for unit in item.units %}
                        {{ unit.unit_number }}{% if not loop.last %}, {% endif %}
                    {% endfor %}
                </td>
                <td>{{ item.owner_names | join(', ') }}</td>
                <td>{{ item.total_fraction }}%</td>
                <td>
                    {% if item.is_proxy %}
                        <span class="proxy-indicator">(P)</span>
                    {% else %}
                        -
                    {% endif %}
                </td>
            </tr>
            {% endfor %}
        </tbody>
    </table>
    
    <div class="footer">
        <p>Documento gerado em {{ generated_at }}</p>
    </div>
</body>
</html>
```

**Nota:** Templates para `agenda_results.html` e `final_report.html` seguem estrutura similar.

---

#### 6.10.3 `app/features/reports/router.py`

```python
"""
Report generation endpoints.
"""
from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_current_tenant
from app.features.reports import generator

router = APIRouter()


@router.get(
    "/assemblies/{assembly_id}/attendance",
    summary="Generate attendance list PDF"
)
async def generate_attendance_report(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> StreamingResponse:
    """
    Generate attendance list PDF.
    """
    pdf_buffer = generator.generate_attendance_pdf(db, assembly_id, tenant_id)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=lista-presenca-{assembly_id}.pdf"
        }
    )


@router.get(
    "/agendas/{agenda_id}/results",
    summary="Generate agenda results PDF"
)
async def generate_agenda_report(
    agenda_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> StreamingResponse:
    """
    Generate agenda results PDF.
    """
    pdf_buffer = generator.generate_agenda_results_pdf(db, agenda_id, tenant_id)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=resultado-pauta-{agenda_id}.pdf"
        }
    )


@router.get(
    "/assemblies/{assembly_id}/final",
    summary="Generate final assembly report PDF"
)
async def generate_final_report(
    assembly_id: int,
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
) -> StreamingResponse:
    """
    Generate final assembly report (attendance + all results).
    """
    pdf_buffer = generator.generate_final_report_pdf(db, assembly_id, tenant_id)
    
    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f"attachment; filename=relatorio-final-{assembly_id}.pdf"
        }
    )
```

---

### 6.11 CSV Processing (COMPLETO - Crítico)

#### 6.11.1 `app/features/assemblies/csv_processor.py`

```python
"""
CSV processing for assembly units import.
Critical validation for vote integrity.
"""
import csv
import re
from io import StringIO
from typing import List, Dict, Optional, Tuple
from fastapi import UploadFile, HTTPException, status
from sqlalchemy.orm import Session
from decimal import Decimal

from app.features.assemblies.models import AssemblyUnit


class CSVValidationError(Exception):
    """Custom exception for CSV validation errors."""
    def __init__(self, line_number: int, field: str, message: str):
        self.line_number = line_number
        self.field = field
        self.message = message
        super().__init__(f"Line {line_number}, field '{field}': {message}")


def validate_cpf(cpf: str) -> bool:
    """
    Validate CPF format (Brazilian individual tax ID).
    
    Args:
        cpf: CPF string (with or without formatting)
    
    Returns:
        bool: True if valid format
    """
    # Remove non-digits
    cpf = re.sub(r'\D', '', cpf)
    
    # Check length
    if len(cpf) != 11:
        return False
    
    # Check if all digits are the same (invalid)
    if cpf == cpf[0] * 11:
        return False
    
    # Validate check digits (algorithm)
    # First digit
    sum1 = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = 11 - (sum1 % 11)
    if digit1 >= 10:
        digit1 = 0
    
    if int(cpf[9]) != digit1:
        return False
    
    # Second digit
    sum2 = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = 11 - (sum2 % 11)
    if digit2 >= 10:
        digit2 = 0
    
    if int(cpf[10]) != digit2:
        return False
    
    return True


def validate_cnpj(cnpj: str) -> bool:
    """
    Validate CNPJ format (Brazilian company tax ID).
    
    Args:
        cnpj: CNPJ string (with or without formatting)
    
    Returns:
        bool: True if valid format
    """
    # Remove non-digits
    cnpj = re.sub(r'\D', '', cnpj)
    
    # Check length
    if len(cnpj) != 14:
        return False
    
    # Check if all digits are the same (invalid)
    if cnpj == cnpj[0] * 14:
        return False
    
    # Validate check digits
    # First digit
    weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum1 = sum(int(cnpj[i]) * weights1[i] for i in range(12))
    digit1 = 11 - (sum1 % 11)
    if digit1 >= 10:
        digit1 = 0
    
    if int(cnpj[12]) != digit1:
        return False
    
    # Second digit
    weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
    sum2 = sum(int(cnpj[i]) * weights2[i] for i in range(13))
    digit2 = 11 - (sum2 % 11)
    if digit2 >= 10:
        digit2 = 0
    
    if int(cnpj[13]) != digit2:
        return False
    
    return True


def validate_cpf_cnpj(value: str) -> bool:
    """
    Validate CPF or CNPJ.
    
    Args:
        value: CPF or CNPJ string
    
    Returns:
        bool: True if valid
    """
    # Remove non-digits
    clean = re.sub(r'\D', '', value)
    
    if len(clean) == 11:
        return validate_cpf(value)
    elif len(clean) == 14:
        return validate_cnpj(value)
    else:
        return False


async def parse_csv_file(file: UploadFile) -> List[Dict[str, str]]:
    """
    Parse uploaded CSV file.
    
    Args:
        file: Uploaded CSV file
    
    Returns:
        List of rows as dictionaries
    
    Raises:
        HTTPException 400: If file is not CSV or invalid format
    """
    # Validate file type
    if not file.filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be CSV format"
        )
    
    # Read file content
    content = await file.read()
    
    try:
        # Decode (try UTF-8 first, then Latin-1)
        try:
            text = content.decode('utf-8')
        except UnicodeDecodeError:
            text = content.decode('latin-1')
        
        # Parse CSV
        csv_reader = csv.DictReader(StringIO(text))
        rows = list(csv_reader)
        
        # Validate required columns
        required_columns = ['unit_number', 'owner_name', 'ideal_fraction', 'cpf_cnpj']
        
        if not csv_reader.fieldnames:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="CSV file is empty or has no header row"
            )
        
        missing_columns = set(required_columns) - set(csv_reader.fieldnames)
        if missing_columns:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Missing required columns: {', '.join(missing_columns)}"
            )
        
        return rows
        
    except csv.Error as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid CSV format: {str(e)}"
        )


def validate_csv_row(row: Dict[str, str], line_number: int) -> Dict[str, any]:
    """
    Validate a single CSV row.
    
    Args:
        row: CSV row as dictionary
        line_number: Line number in file (for error messages)
    
    Returns:
        Dict with validated data
    
    Raises:
        CSVValidationError: If validation fails
    """
    validated = {}
    
    # Validate unit_number (required, non-empty)
    unit_number = row.get('unit_number', '').strip()
    if not unit_number:
        raise CSVValidationError(line_number, 'unit_number', 'Cannot be empty')
    validated['unit_number'] = unit_number
    
    # Validate owner_name (required, non-empty)
    owner_name = row.get('owner_name', '').strip()
    if not owner_name:
        raise CSVValidationError(line_number, 'owner_name', 'Cannot be empty')
    validated['owner_name'] = owner_name
    
    # Validate ideal_fraction (required, numeric, > 0)
    ideal_fraction_str = row.get('ideal_fraction', '').strip()
    if not ideal_fraction_str:
        raise CSVValidationError(line_number, 'ideal_fraction', 'Cannot be empty')
    
    try:
        # Replace comma with dot (Brazilian format)
        ideal_fraction_str = ideal_fraction_str.replace(',', '.')
        ideal_fraction = Decimal(ideal_fraction_str)
        
        if ideal_fraction <= 0:
            raise CSVValidationError(line_number, 'ideal_fraction', 'Must be greater than 0')
        
        if ideal_fraction > 100:
            raise CSVValidationError(line_number, 'ideal_fraction', 'Cannot exceed 100%')
        
        validated['ideal_fraction'] = float(ideal_fraction)
        
    except (ValueError, decimal.InvalidOperation):
        raise CSVValidationError(line_number, 'ideal_fraction', 'Must be a valid number')
    
    # Validate cpf_cnpj (required, valid format)
    cpf_cnpj = row.get('cpf_cnpj', '').strip()
    if not cpf_cnpj:
        raise CSVValidationError(line_number, 'cpf_cnpj', 'Cannot be empty')
    
    if not validate_cpf_cnpj(cpf_cnpj):
        raise CSVValidationError(line_number, 'cpf_cnpj', 'Invalid CPF or CNPJ format')
    
    validated['cpf_cnpj'] = cpf_cnpj
    
    return validated


async def preview_csv_import(
    file: UploadFile,
    assembly_id: int
) -> Dict[str, any]:
    """
    Preview CSV import (first 10 lines + validation errors).
    
    Args:
        file: Uploaded CSV file
        assembly_id: Assembly ID (for context)
    
    Returns:
        Dict with preview data and errors
    """
    rows = await parse_csv_file(file)
    
    preview_data = []
    errors = []
    unit_numbers_seen = set()
    total_fraction = 0.0
    
    for idx, row in enumerate(rows[:10], start=2):  # Line 2 (after header)
        try:
            validated = validate_csv_row(row, idx)
            
            # Check for duplicate unit_number
            if validated['unit_number'] in unit_numbers_seen:
                errors.append({
                    'line': idx,
                    'field': 'unit_number',
                    'message': f"Duplicate unit number: {validated['unit_number']}"
                })
            else:
                unit_numbers_seen.add(validated['unit_number'])
            
            total_fraction += validated['ideal_fraction']
            
            preview_data.append({
                'line': idx,
                'unit_number': validated['unit_number'],
                'owner_name': validated['owner_name'],
                'ideal_fraction': validated['ideal_fraction'],
                'cpf_cnpj': validated['cpf_cnpj']
            })
            
        except CSVValidationError as e:
            errors.append({
                'line': e.line_number,
                'field': e.field,
                'message': e.message
            })
            
            # Add to preview even if invalid (to show user)
            preview_data.append({
                'line': idx,
                'unit_number': row.get('unit_number', ''),
                'owner_name': row.get('owner_name', ''),
                'ideal_fraction': row.get('ideal_fraction', ''),
                'cpf_cnpj': row.get('cpf_cnpj', ''),
                'error': True
            })
    
    # Warning if fractions don't sum to 100%
    warnings = []
    if abs(total_fraction - 100.0) > 0.1:  # Tolerance of 0.1%
        warnings.append({
            'type': 'fraction_sum',
            'message': f'Sum of ideal fractions: {total_fraction:.2f}% (expected: 100%)'
        })
    
    return {
        'preview': preview_data,
        'total_rows': len(rows),
        'errors': errors,
        'warnings': warnings,
        'can_import': len(errors) == 0
    }


async def import_csv_units(
    db: Session,
    file: UploadFile,
    assembly_id: int
) -> List[AssemblyUnit]:
    """
    Import units from CSV file (after preview confirmation).
    
    Args:
        db: Database session
        file: Uploaded CSV file
        assembly_id: Assembly ID
    
    Returns:
        List of created AssemblyUnit objects
    
    Raises:
        HTTPException 400: If validation fails
    """
    rows = await parse_csv_file(file)
    
    # Validate all rows first
    validated_rows = []
    unit_numbers_seen = set()
    
    for idx, row in enumerate(rows, start=2):
        try:
            validated = validate_csv_row(row, idx)
            
            # Check duplicate
            if validated['unit_number'] in unit_numbers_seen:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Line {idx}: Duplicate unit number '{validated['unit_number']}'"
                )
            
            unit_numbers_seen.add(validated['unit_number'])
            validated_rows.append(validated)
            
        except CSVValidationError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )
    
    # Check if assembly already has units
    existing_units = db.query(AssemblyUnit).filter(
        AssemblyUnit.assembly_id == assembly_id
    ).first()
    
    if existing_units:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Assembly already has units imported"
        )
    
    # Create units (bulk insert)
    units = []
    for validated in validated_rows:
        unit = AssemblyUnit(
            assembly_id=assembly_id,
            unit_number=validated['unit_number'],
            owner_name=validated['owner_name'],
            ideal_fraction=validated['ideal_fraction'],
            cpf_cnpj=validated['cpf_cnpj']
        )
        units.append(unit)
    
    db.bulk_save_objects(units)
    db.commit()
    
    # Refresh to get IDs
    db_units = db.query(AssemblyUnit).filter(
        AssemblyUnit.assembly_id == assembly_id
    ).all()
    
    return db_units
```

---

#### 6.11.2 CSV Import Endpoints (em `assemblies/router.py`)

```python
# Adicionar ao assemblies/router.py

from fastapi import UploadFile, File
from app.features.assemblies.csv_processor import preview_csv_import, import_csv_units

@router.post(
    "/{assembly_id}/units/preview",
    summary="Preview CSV import"
)
async def preview_units_import(
    assembly_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
):
    """
    Preview CSV import (first 10 lines + validation).
    Shows errors before actual import.
    """
    # Validate assembly belongs to tenant
    assembly = service.get_assembly(db, assembly_id, tenant_id)
    
    preview = await preview_csv_import(file, assembly_id)
    return preview


@router.post(
    "/{assembly_id}/units/import",
    summary="Import units from CSV"
)
async def import_units(
    assembly_id: int,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    tenant_id: int = Depends(get_current_tenant)
):
    """
    Import units from CSV (after preview confirmation).
    Creates immutable snapshot of units.
    """
    # Validate assembly belongs to tenant
    assembly = service.get_assembly(db, assembly_id, tenant_id)
    
    units = await import_csv_units(db, file, assembly_id)
    
    return {
        "message": "Units imported successfully",
        "total_imported": len(units)
    }
```

**Seção 6 está quase completa! Falta apenas Error Handling, Testing e API Versioning. Continuo?**


---

### 6.12 Error Handling

#### 6.12.1 `app/core/exceptions.py` - Custom Exceptions

```python
"""
Custom exceptions for domain-specific errors.
"""
from fastapi import HTTPException, status


class TenantIsolationError(HTTPException):
    """Raised when trying to access resources from another tenant."""
    def __init__(self, resource: str):
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"{resource} not found"
        )


class VoteAlreadyCastError(HTTPException):
    """Raised when unit tries to vote twice on same agenda."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unit has already voted on this agenda"
        )


class QuorumNotReachedError(HTTPException):
    """Raised when trying to start assembly without quorum."""
    def __init__(self, fraction_present: float):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Quorum not reached (present: {fraction_present}%, required: 50%)"
        )


class AgendaNotOpenError(HTTPException):
    """Raised when trying to vote on closed agenda."""
    def __init__(self, status: str):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Agenda is {status}, not open for voting"
        )


class QRCodeAlreadyAssignedError(HTTPException):
    """Raised when trying to assign QR code already in use."""
    def __init__(self):
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="QR code is already assigned to this assembly"
        )
```

---

#### 6.12.2 `app/core/exception_handlers.py` - Global Handlers

```python
"""
Global exception handlers for FastAPI.
"""
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
import logging

logger = logging.getLogger(__name__)


def register_exception_handlers(app: FastAPI):
    """
    Register all exception handlers.
    
    Args:
        app: FastAPI application instance
    """
    
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        """Handle Pydantic validation errors."""
        errors = []
        for error in exc.errors():
            errors.append({
                "field": ".".join(str(x) for x in error["loc"]),
                "message": error["msg"],
                "type": error["type"]
            })
        
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "detail": "Validation error",
                "errors": errors
            }
        )
    
    @app.exception_handler(IntegrityError)
    async def integrity_error_handler(request: Request, exc: IntegrityError):
        """Handle database integrity constraint violations."""
        logger.error(f"Integrity error: {exc}")
        
        error_message = str(exc.orig)
        
        # Parse common constraint violations
        if "unique constraint" in error_message.lower():
            return JSONResponse(
                status_code=status.HTTP_409_CONFLICT,
                content={"detail": "Resource already exists"}
            )
        
        if "foreign key constraint" in error_message.lower():
            return JSONResponse(
                status_code=status.HTTP_400_BAD_REQUEST,
                content={"detail": "Referenced resource not found"}
            )
        
        # Generic integrity error
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={"detail": "Database integrity error"}
        )
    
    @app.exception_handler(SQLAlchemyError)
    async def sqlalchemy_error_handler(request: Request, exc: SQLAlchemyError):
        """Handle generic SQLAlchemy errors."""
        logger.error(f"Database error: {exc}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Database error occurred"}
        )
    
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle all uncaught exceptions."""
        logger.exception(f"Unhandled exception: {exc}")
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={"detail": "Internal server error"}
        )
```

---

### 6.13 Testing Strategy

#### 6.13.1 `tests/conftest.py` - Pytest Fixtures

```python
"""
Pytest fixtures for testing.
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.features.auth.security import create_access_token, hash_password
from app.features.tenants.models import Tenant
from app.features.users.models import User
from app.features.condominiums.models import Condominium


# Test database (in-memory SQLite)
SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db_session():
    """
    Create a fresh database session for each test.
    """
    # Create tables
    Base.metadata.create_all(bind=engine)
    
    session = TestingSessionLocal()
    
    try:
        yield session
    finally:
        session.close()
        # Drop tables after test
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db_session):
    """
    Create TestClient with database session override.
    """
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    
    with TestClient(app) as test_client:
        yield test_client
    
    app.dependency_overrides.clear()


@pytest.fixture(scope="function")
def sample_tenant(db_session):
    """Create a sample tenant."""
    tenant = Tenant(
        name="Test Property Manager",
        email="test@example.com",
        password_hash=hash_password("testpass123")
    )
    db_session.add(tenant)
    db_session.commit()
    db_session.refresh(tenant)
    return tenant


@pytest.fixture(scope="function")
def sample_user(db_session, sample_tenant):
    """Create a sample user (property manager)."""
    user = User(
        tenant_id=sample_tenant.id,
        name="Test Admin",
        email="admin@example.com",
        password_hash=hash_password("adminpass123"),
        role="property_manager"
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user


@pytest.fixture(scope="function")
def auth_headers(sample_user):
    """Create authentication headers with valid JWT."""
    token = create_access_token(
        sample_user.id,
        sample_user.tenant_id,
        sample_user.role
    )
    return {"Cookie": f"access_token={token}"}


@pytest.fixture(scope="function")
def sample_condominium(db_session, sample_tenant):
    """Create a sample condominium."""
    condo = Condominium(
        tenant_id=sample_tenant.id,
        name="Condomínio Teste",
        address="Rua Teste, 123 - São Paulo, SP"
    )
    db_session.add(condo)
    db_session.commit()
    db_session.refresh(condo)
    return condo
```

---

#### 6.13.2 `tests/features/auth/test_auth.py` - Example Tests

```python
"""
Tests for authentication endpoints.
"""
import pytest
from fastapi import status


def test_login_success(client, sample_user):
    """Test successful login."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": "adminpass123"
        }
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["email"] == "admin@example.com"
    assert data["role"] == "property_manager"
    
    # Check cookies
    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies


def test_login_invalid_credentials(client, sample_user):
    """Test login with invalid password."""
    response = client.post(
        "/api/v1/auth/login",
        json={
            "email": "admin@example.com",
            "password": "wrongpassword"
        }
    )
    
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
    assert "Incorrect email or password" in response.json()["detail"]


def test_get_current_user(client, auth_headers, sample_user):
    """Test getting current user info."""
    response = client.get(
        "/api/v1/auth/me",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    
    data = response.json()
    assert data["id"] == sample_user.id
    assert data["email"] == sample_user.email


def test_logout(client, auth_headers):
    """Test logout (cookie clearing)."""
    response = client.post(
        "/api/v1/auth/logout",
        headers=auth_headers
    )
    
    assert response.status_code == status.HTTP_200_OK
    assert "Logged out successfully" in response.json()["message"]
```

---

#### 6.13.3 `tests/features/voting/test_voting.py` - Example Tests

```python
"""
Tests for voting system (critical functionality).
"""
import pytest
from fastapi import status
from datetime import datetime, timedelta


@pytest.fixture
def setup_voting_scenario(db_session, sample_condominium, sample_user):
    """
    Setup complete voting scenario:
    - Assembly with units
    - Agenda with options
    - QR code assigned
    """
    from app.features.assemblies.models import Assembly, AssemblyUnit
    from app.features.agendas.models import Agenda, AgendaOption
    from app.features.qr_codes.models import QRCode, QRCodeAssignment, QRCodeAssignedUnit
    
    # Create assembly
    assembly = Assembly(
        condominium_id=sample_condominium.id,
        operator_id=sample_user.id,
        title="Assembleia Teste",
        assembly_date=datetime.now() + timedelta(days=1),
        location="Salão de Festas",
        assembly_type="ordinary",
        status="in_progress"
    )
    db_session.add(assembly)
    db_session.flush()
    
    # Create units
    unit1 = AssemblyUnit(
        assembly_id=assembly.id,
        unit_number="101",
        owner_name="João Silva",
        ideal_fraction=2.5,
        cpf_cnpj="123.456.789-00"
    )
    db_session.add(unit1)
    db_session.flush()
    
    # Create agenda
    agenda = Agenda(
        assembly_id=assembly.id,
        title="Pauta Teste",
        description="Teste de votação",
        display_order=1,
        status="open",
        opened_at=datetime.now()
    )
    db_session.add(agenda)
    db_session.flush()
    
    # Create options
    option_yes = AgendaOption(
        agenda_id=agenda.id,
        option_text="Sim",
        display_order=1
    )
    option_no = AgendaOption(
        agenda_id=agenda.id,
        option_text="Não",
        display_order=2
    )
    db_session.add_all([option_yes, option_no])
    db_session.flush()
    
    # Create QR code
    import uuid
    qr_code = QRCode(
        tenant_id=sample_user.tenant_id,
        token=uuid.uuid4(),
        visual_number=1
    )
    db_session.add(qr_code)
    db_session.flush()
    
    # Assign QR code
    assignment = QRCodeAssignment(
        assembly_id=assembly.id,
        qr_code_id=qr_code.id,
        is_proxy=False,
        assigned_by=sample_user.id
    )
    db_session.add(assignment)
    db_session.flush()
    
    # Link unit
    link = QRCodeAssignedUnit(
        assignment_id=assignment.id,
        assembly_unit_id=unit1.id
    )
    db_session.add(link)
    db_session.commit()
    
    return {
        "assembly": assembly,
        "unit": unit1,
        "agenda": agenda,
        "option_yes": option_yes,
        "option_no": option_no,
        "qr_code": qr_code
    }


def test_cast_vote_success(client, auth_headers, setup_voting_scenario):
    """Test casting a valid vote."""
    scenario = setup_voting_scenario
    
    response = client.post(
        "/api/v1/voting/vote",
        headers=auth_headers,
        json={
            "qr_token": str(scenario["qr_code"].token),
            "agenda_id": scenario["agenda"].id,
            "option_id": scenario["option_yes"].id
        }
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    
    data = response.json()
    assert data["agenda_id"] == scenario["agenda"].id
    assert data["option_id"] == scenario["option_yes"].id


def test_vote_duplicate_fails(client, auth_headers, setup_voting_scenario):
    """Test that voting twice on same agenda fails."""
    scenario = setup_voting_scenario
    
    # First vote (should succeed)
    client.post(
        "/api/v1/voting/vote",
        headers=auth_headers,
        json={
            "qr_token": str(scenario["qr_code"].token),
            "agenda_id": scenario["agenda"].id,
            "option_id": scenario["option_yes"].id
        }
    )
    
    # Second vote (should fail)
    response = client.post(
        "/api/v1/voting/vote",
        headers=auth_headers,
        json={
            "qr_token": str(scenario["qr_code"].token),
            "agenda_id": scenario["agenda"].id,
            "option_id": scenario["option_no"].id
        }
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "already voted" in response.json()["detail"].lower()
```

---

### 6.14 API Versioning Strategy

**Estratégia:** Path-based versioning (`/api/v1/...`)

**Implementação:**

```python
# main.py (já implementado)
API_V1_PREFIX = "/api/v1"

app.include_router(auth_router, prefix=f"{API_V1_PREFIX}/auth", tags=["Authentication"])
app.include_router(condominiums_router, prefix=f"{API_V1_PREFIX}/condominiums", tags=["Condominiums"])
# ... outros routers
```

**Vantagens:**
- ✅ Simples e explícito
- ✅ Fácil de versionar (cria `/api/v2/` quando necessário)
- ✅ Permite rodar múltiplas versões simultaneamente
- ✅ Compatível com proxies e CDNs

**Quando criar v2:**
- Breaking changes na API (campos removidos, tipos alterados)
- Mudanças incompatíveis no comportamento
- Reestruturação de endpoints

**Como migrar:**
```python
# Criar routers v2
API_V2_PREFIX = "/api/v2"

app.include_router(auth_router_v2, prefix=f"{API_V2_PREFIX}/auth")

# Manter v1 em paralelo
app.include_router(auth_router, prefix=f"{API_V1_PREFIX}/auth")
```

**Deprecation strategy:**
- Adicionar header `X-API-Deprecated: true` em v1
- Documentar deprecation no OpenAPI
- Manter v1 por no mínimo 6 meses

---

## Fim da Seção 6
