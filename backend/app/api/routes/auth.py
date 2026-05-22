"""
Admin authentication via Supabase Auth + local admin_users table.
"""
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from jose import jwt
from supabase import create_client, Client

from app.config import settings
from app.db.database import get_db
from app.models.buffalo import AdminUser
from app.schemas.admin import AdminLoginRequest, AdminTokenResponse

router = APIRouter(prefix="/auth", tags=["auth"])


def create_access_token(admin_id: str) -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_expire_minutes)
    return jwt.encode(
        {"sub": admin_id, "exp": expire},
        settings.jwt_secret,
        algorithm=settings.jwt_algorithm,
    )


@router.post("/login", response_model=AdminTokenResponse)
async def login(request: AdminLoginRequest, db: AsyncSession = Depends(get_db)):
    # Authenticate with Supabase Auth
    try:
        supabase: Client = create_client(settings.supabase_url, settings.supabase_anon_key)
        auth_response = supabase.auth.sign_in_with_password({
            "email": request.email,
            "password": request.password,
        })
        if not auth_response.user:
            raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")
    except Exception as e:
        raise HTTPException(status_code=401, detail="אימייל או סיסמה שגויים")

    # Check admin_users table
    result = await db.execute(
        select(AdminUser).where(
            AdminUser.email == request.email,
            AdminUser.is_active == True
        )
    )
    admin = result.scalar_one_or_none()
    if not admin:
        raise HTTPException(status_code=403, detail="אין הרשאות מנהל")

    token = create_access_token(str(admin.id))
    return AdminTokenResponse(
        access_token=token,
        admin_id=str(admin.id),
        full_name=admin.full_name,
        role=admin.role,
    )
