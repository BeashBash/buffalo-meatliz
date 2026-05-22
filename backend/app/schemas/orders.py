from pydantic import BaseModel, field_validator
from typing import Optional, List
from decimal import Decimal
from datetime import datetime
import uuid

ORDER_STATUSES = ["new", "in_preparation", "weighed", "payment_pending", "paid", "delivered", "cancelled"]
ORDER_STATUS_HE = {
    "new": "חדש",
    "in_preparation": "בהכנה",
    "weighed": "נשקל",
    "payment_pending": "ממתין לתשלום",
    "paid": "שולם",
    "delivered": "נמסר",
    "cancelled": "בוטל",
}


class OrderItemInput(BaseModel):
    product_id: uuid.UUID
    product_name_he: str
    pricing_type: str
    price_at_order: Decimal
    requested_weight_kg: Optional[Decimal] = None  # for per_kg
    quantity: int = 1                                # for per_unit
    estimated_price: Decimal
    notes: Optional[str] = None


class CheckoutRequest(BaseModel):
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    delivery_type: str = "delivery"
    delivery_address: Optional[str] = None
    delivery_city: Optional[str] = None
    preferred_delivery_time: Optional[str] = None
    customer_notes: Optional[str] = None
    coupon_code: Optional[str] = None
    items: List[OrderItemInput]

    @field_validator("delivery_type")
    @classmethod
    def validate_delivery_type(cls, v):
        if v not in ("delivery", "pickup"):
            raise ValueError("delivery_type must be 'delivery' or 'pickup'")
        return v

    @field_validator("items")
    @classmethod
    def validate_items(cls, v):
        if not v:
            raise ValueError("Order must have at least one item")
        return v


class OrderItemOut(BaseModel):
    id: uuid.UUID
    product_id: Optional[uuid.UUID]
    product_name_he: str
    pricing_type: str
    price_at_order: Decimal
    requested_weight_kg: Optional[Decimal]
    actual_weight_kg: Optional[Decimal]
    quantity: int
    estimated_price: Decimal
    actual_price: Optional[Decimal]
    is_weighed: bool
    notes: Optional[str]

    model_config = {"from_attributes": True}


class OrderOut(BaseModel):
    id: uuid.UUID
    order_number: str
    customer_name: str
    customer_phone: str
    customer_email: Optional[str]
    delivery_type: str
    delivery_address: Optional[str]
    delivery_city: Optional[str]
    preferred_delivery_time: Optional[str]
    estimated_total: Decimal
    final_total: Optional[Decimal]
    discount_amount: Decimal
    coupon_code: Optional[str]
    status: str
    status_he: str = ""
    customer_notes: Optional[str]
    admin_notes: Optional[str]
    payment_link: Optional[str]
    created_at: datetime
    updated_at: datetime
    weighed_at: Optional[datetime]
    paid_at: Optional[datetime]
    delivered_at: Optional[datetime]
    items: List[OrderItemOut] = []

    model_config = {"from_attributes": True}

    def model_post_init(self, __context):
        self.status_he = ORDER_STATUS_HE.get(self.status, self.status)


class OrderStatusUpdate(BaseModel):
    status: str
    admin_notes: Optional[str] = None

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v not in ORDER_STATUSES:
            raise ValueError(f"Invalid status. Must be one of: {ORDER_STATUSES}")
        return v


class WeighItemRequest(BaseModel):
    actual_weight_kg: Decimal


class WeighOrderRequest(BaseModel):
    """Weigh all items at once for an order."""
    items: List[dict]  # [{item_id: str, actual_weight_kg: float}]
