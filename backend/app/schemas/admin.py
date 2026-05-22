from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime
import uuid


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class AdminTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin_id: str
    full_name: str
    role: str


class AdminUserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class BannerCreate(BaseModel):
    title_he: Optional[str] = None
    subtitle_he: Optional[str] = None
    image_url: Optional[str] = None
    link_url: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0


class BannerOut(BannerCreate):
    id: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class PromotionCreate(BaseModel):
    code: Optional[str] = None
    name_he: str
    description_he: Optional[str] = None
    discount_type: str
    discount_value: float
    min_order_amount: float = 0
    max_uses: Optional[int] = None
    is_active: bool = True


class PromotionOut(PromotionCreate):
    id: uuid.UUID
    current_uses: int
    created_at: datetime

    model_config = {"from_attributes": True}


class DailyReportOut(BaseModel):
    date: str
    total_orders: int
    completed_orders: int
    total_revenue: float
    avg_order_value: float


class DashboardStatsOut(BaseModel):
    today_orders: int
    today_revenue: float
    pending_orders: int
    in_preparation: int
    awaiting_weighing: int
    awaiting_payment: int
