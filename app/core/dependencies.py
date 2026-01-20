"""FastAPI dependencies for authentication and authorization."""
from typing import Optional

from fastapi import Depends, HTTPException, status, Cookie
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.features.users.models import User

security = HTTPBearer()


async def get_current_user(
    access_token: Optional[str] = Cookie(None),
    db: Session = Depends(get_db),
) -> User:
    """Get current authenticated user from JWT token in httpOnly cookie."""
    if not access_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    try:
        payload = jwt.decode(access_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
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

    return user


async def get_current_tenant(current_user: User = Depends(get_current_user)) -> int:
    """Get current tenant ID from authenticated user."""
    return current_user.tenant_id


async def require_property_manager(current_user: User = Depends(get_current_user)) -> User:
    """Require user to have 'property_manager' role."""
    if current_user.role != "property_manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Property manager access required")
    return current_user


async def require_operator_or_manager(current_user: User = Depends(get_current_user)) -> User:
    """Require user to be either property_manager or assembly_operator."""
    if current_user.role not in ["property_manager", "assembly_operator"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operator or manager access required",
        )
    return current_user
