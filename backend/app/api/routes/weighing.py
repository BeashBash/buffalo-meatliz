"""
Weighing routes — the core employee workflow.
GET  /weigh/queue          → list orders that need weighing
GET  /weigh/{order_id}     → get order with all items for weighing
POST /weigh/{order_id}/{item_id} → set actual weight for one item
POST /weigh/{order_id}/complete  → set all weights at once + trigger payment flow
POST /weigh/{order_id}/send-payment → send payment request to customer
"""
from decimal import Decimal
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from sqlalchemy.orm import selectinload
from typing import List

from app.db.database import get_db
from app.models.buffalo import Order, OrderItem
from app.schemas.orders import OrderOut, WeighItemRequest, WeighOrderRequest
from app.services.weighing_service import weigh_item, weigh_all_items, send_to_payment
from app.services.notification_service import send_weighing_complete
from app.api.deps import get_current_admin

router = APIRouter(prefix="/weigh", tags=["weighing"])


@router.get("/queue", response_model=List[OrderOut])
async def weighing_queue(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    """Orders in 'new' or 'in_preparation' status — need to be picked & weighed."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.status.in_(["new", "in_preparation"]))
        .order_by(Order.created_at)
    )
    return result.scalars().all()


@router.get("/{order_id}", response_model=OrderOut)
async def get_order_for_weighing(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/{order_id}/start")
async def start_preparation(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Mark order as 'in_preparation' when employee starts picking."""
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == "new":
        order.status = "in_preparation"
        await db.commit()
    return {"status": order.status}


@router.post("/{order_id}/item/{item_id}", response_model=OrderOut)
async def weigh_single_item(
    order_id: str,
    item_id: str,
    data: WeighItemRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Set actual weight for a single item. If all items weighed, order auto-moves to 'weighed'."""
    try:
        await weigh_item(db, order_id, item_id, data.actual_weight_kg)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    # Return full order
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    return result.scalar_one()


@router.post("/{order_id}/complete", response_model=OrderOut)
async def complete_weighing(
    order_id: str,
    data: WeighOrderRequest,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Submit all weights at once. Order moves to 'weighed'."""
    try:
        order = await weigh_all_items(db, order_id, data.items)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return order


@router.post("/{order_id}/send-payment", response_model=OrderOut)
async def send_payment_request(
    order_id: str,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin),
):
    """Send payment link to customer and move order to 'payment_pending'."""
    try:
        order = await send_to_payment(db, order_id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Notify customer
    try:
        await send_weighing_complete(order)
    except Exception:
        pass

    return order
