from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.db.database import get_db
from app.models.buffalo import Order, OrderItem
from app.schemas.orders import CheckoutRequest, OrderOut, OrderStatusUpdate
from app.services.order_service import create_order
from app.services.notification_service import send_order_confirmation
from app.api.deps import get_current_admin

router = APIRouter(prefix="/orders", tags=["orders"])


@router.post("/checkout", response_model=OrderOut)
async def checkout(data: CheckoutRequest, db: AsyncSession = Depends(get_db)):
    """Customer places an order. No payment charged yet."""
    order = await create_order(db, data)
    # Fire-and-forget notification
    try:
        await send_order_confirmation(order)
    except Exception:
        pass
    return order


@router.get("/track/{order_number}", response_model=OrderOut)
async def track_order(order_number: str, db: AsyncSession = Depends(get_db)):
    """Customer can track order status by order number + phone."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_number == order_number.upper())
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="הזמנה לא נמצאה")
    return order


# ── Admin routes ──────────────────────────────────────────────────────────────

@router.get("/admin/all", response_model=List[OrderOut])
async def list_orders(
    status: Optional[str] = None,
    limit: int = Query(50, le=200),
    offset: int = 0,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    query = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(desc(Order.created_at))
        .limit(limit)
        .offset(offset)
    )
    if status:
        query = query.where(Order.status == status)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/admin/{order_id}", response_model=OrderOut)
async def get_order(order_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.patch("/admin/{order_id}/status", response_model=OrderOut)
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = data.status
    if data.admin_notes:
        order.admin_notes = data.admin_notes

    from datetime import datetime
    if data.status == "paid":
        order.paid_at = datetime.utcnow()
    elif data.status == "delivered":
        order.delivered_at = datetime.utcnow()

    await db.commit()
    await db.refresh(order)
    return order
