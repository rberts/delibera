"""Authentication endpoints."""
from fastapi import APIRouter, Depends, Response, Cookie, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.dependencies import get_current_user
from app.features.auth.schemas import LoginRequest, UserResponse
from app.features.auth.security import create_access_token, create_refresh_token
from app.features.auth.service import authenticate_user
from app.features.users.models import User

router = APIRouter()


def _cookie_kwargs() -> dict[str, object]:
    cookie_kwargs: dict[str, object] = {
        "httponly": True,
        "secure": settings.COOKIE_SECURE,
        "samesite": settings.COOKIE_SAMESITE,
    }
    if settings.COOKIE_DOMAIN:
        cookie_kwargs["domain"] = settings.COOKIE_DOMAIN
    return cookie_kwargs


@router.post("/login")
async def login(credentials: LoginRequest, response: Response, db: Session = Depends(get_db)) -> UserResponse:
    """Login endpoint - authenticates user and sets httpOnly cookies."""
    user = authenticate_user(db, credentials.email, credentials.password)

    access_token = create_access_token(user.id, user.tenant_id, user.role)
    refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **_cookie_kwargs(),
    )

    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        **_cookie_kwargs(),
    )

    return UserResponse.model_validate(user)


@router.post("/refresh")
async def refresh_token(
    response: Response,
    db: Session = Depends(get_db),
    refresh_token: str | None = Cookie(None),
) -> dict[str, str]:
    """Refresh endpoint - rotates tokens using refresh_token cookie."""
    if not refresh_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        raw_user_id = payload.get("sub")
        if raw_user_id is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
        user_id = int(raw_user_id)
    except JWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Could not validate credentials")
    except (TypeError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    user = db.query(User).filter(
        User.id == user_id,
        User.deleted_at.is_(None),
    ).first()

    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

    access_token = create_access_token(user.id, user.tenant_id, user.role)
    new_refresh_token = create_refresh_token(user.id)

    response.set_cookie(
        key="access_token",
        value=access_token,
        max_age=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        **_cookie_kwargs(),
    )

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60,
        **_cookie_kwargs(),
    )

    return {"message": "Token refreshed"}


@router.post("/logout")
async def logout(response: Response) -> dict[str, str]:
    """Logout endpoint - clears httpOnly cookies."""
    cookie_kwargs = _cookie_kwargs()
    cookie_kwargs["path"] = "/"

    response.delete_cookie(key="access_token", **cookie_kwargs)
    response.delete_cookie(key="refresh_token", **cookie_kwargs)
    return {"message": "Logged out successfully"}


@router.get("/me")
async def get_current_user_info(current_user: User = Depends(get_current_user)) -> UserResponse:
    """Get current authenticated user information."""
    return UserResponse.model_validate(current_user)
