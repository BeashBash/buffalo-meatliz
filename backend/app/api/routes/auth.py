"""
Admin authentication — local password hash (PBKDF2-SHA256) + admin_users table.
No external network calls required.
"""
import hashlib
import base64
import traceback
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt

from app.config import settings
from app.db.database import get_db
from app.models.buffalo import AdminUser
from app.schemas.admin import AdminLoginRequest, AdminTokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])

# Salt used when hashing passwords (must match what was used to generate the hash)
_PBKDF2_SALT = "buffalo-meatliz-salt-2026"
_PBKDF2_ITERATIONS = 260000


def _hash_password(password: str) -> str:
    dk = hashlib.pbkdf2_hmac("sha256", password.encode(), _PBKDF2_SALT.encode(), _PBKDF2_ITERATIONS)
    return f"pbkdf2:sha256:{_PBKDF2_ITERATIONS}:{_PBKDF2_SALT}:{base64.b64encode(dk).decode()}"


def verify_password(plain: str, stored_hash: str) -> bool:
    return _hash_password(plain) == stored_hash


def create_access_token(admin_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": admin_id, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


@router.post("/login", response_model=AdminTokenResponse)
async def login(request: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    try:
        print(f"[AUTH] Login attempt: {request.email}")

        # Find admin in DB
        result = await db.execute(
            select(AdminUser).where(
                AdminUser.email == request.email,
                AdminUser.is_active == True,
            )
        )
        admin = result.scalar_one_or_none()

        if not admin:
            print(f"[AUTH] No active admin found for: {request.email}")
            raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")

        if not admin.password_hash:
            print(f"[AUTH] Admin has no password_hash set: {request.email}")
            raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")

        if not verify_password(request.password, admin.password_hash):
            print(f"[AUTH] Wrong password for: {request.email}")
            raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")

        print(f"[AUTH] Login SUCCESS: {admin.full_name} ({admin.role})")
        token = create_access_token(str(admin.id))
        return AdminTokenResponse(
            access_token=token,
            admin_id=str(admin.id),
            full_name=admin.full_name,
            role=admin.role,
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"[AUTH] Unexpected error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"שגיאת שרת פנימית: {str(e)}")
