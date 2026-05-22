from pydantic import BaseModel, field_validator
from typing import Optional
from decimal import Decimal
from datetime import datetime
import uuid


class CategoryBase(BaseModel):
    name_he: str
    slug: str
    description_he: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: int = 0
    is_active: bool = True


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name_he: Optional[str] = None
    slug: Optional[str] = None
    description_he: Optional[str] = None
    image_url: Optional[str] = None
    sort_order: Optional[int] = None
    is_active: Optional[bool] = None


class CategoryOut(CategoryBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductBase(BaseModel):
    name_he: str
    slug: str
    category_id: Optional[uuid.UUID] = None
    description_he: Optional[str] = None
    image_url: Optional[str] = None
    pricing_type: str = "per_kg"
    price: Decimal
    min_weight_kg: Optional[Decimal] = Decimal("0.5")
    max_weight_kg: Optional[Decimal] = Decimal("10.0")
    weight_step_kg: Optional[Decimal] = Decimal("0.5")
    is_available: bool = True
    is_featured: bool = False
    badge: Optional[str] = None
    sort_order: int = 0

    @field_validator("pricing_type")
    @classmethod
    def validate_pricing_type(cls, v):
        if v not in ("per_kg", "per_unit"):
            raise ValueError("pricing_type must be 'per_kg' or 'per_unit'")
        return v


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name_he: Optional[str] = None
    slug: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    description_he: Optional[str] = None
    image_url: Optional[str] = None
    pricing_type: Optional[str] = None
    price: Optional[Decimal] = None
    min_weight_kg: Optional[Decimal] = None
    max_weight_kg: Optional[Decimal] = None
    weight_step_kg: Optional[Decimal] = None
    is_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    badge: Optional[str] = None
    sort_order: Optional[int] = None


class ProductOut(ProductBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    category: Optional[CategoryOut] = None

    model_config = {"from_attributes": True}
