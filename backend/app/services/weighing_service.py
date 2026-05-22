"""
Weighing business logic — the core of the system.
Employee enters actual weights, system recalculates final price.
"""
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.buffalo import Order, OrderItem


async def weigh_item(
    db: AsyncSession,
    order_id: str,
    item_id: str,
    actual_weight_kg: Decimal,
) -> OrderItem:
    """Set the actual weight for a single order item and recalculate its price."""
    result = await db.execute(
        select(OrderItem).where(
            OrderItem.id == item_id,
            OrderItem.order_id == order_id,
        )
    )
    item = result.scalar_one_or_none()
    if not item:
        raise ValueError("Order item not found")

    item.actual_weight_kg = actual_weight_kg
    item.is_weighed = True

    # Calculate actual price based on pricing type
    if item.pricing_type == "per_kg":
        item.actual_price = (actual_weight_kg * item.price_at_order).quantize(Decimal("0.01"))
    else:
        # per_unit: weight doesn't affect price
        item.actual_price = (Decimal(str(item.quantity)) * item.price_at_order).quantize(Decimal("0.01"))

    await db.flush()

    # Check if all items in order are weighed
    await _check_and_finalize_order(db, order_id)

    await db.commit()
    await db.refresh(item)
    return item


async def weigh_all_items(
    db: AsyncSession,
    order_id: str,
    weights: list[dict],  # [{item_id, actual_weight_kg}]
) -> Order:
    """Set weights for all items in an order at once."""
    for w in weights:
        await weigh_item(db, order_id, w["item_id"], Decimal(str(w["actual_weight_kg"])))

    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    return result.scalar_one()


async def _check_and_finalize_order(db: AsyncSession, order_id: str):
    """If all items are weighed, recalculate totals and move to 'weighed' status."""
    # Get all items
    items_result = await db.execute(
        select(OrderItem).where(OrderItem.order_id == order_id)
    )
    items = items_result.scalars().all()

    all_weighed = all(i.is_weighed for i in items)
    final_total = sum(i.actual_price or Decimal("0") for i in items)

    order_result = await db.execute(select(Order).where(Order.id == order_id))
    order = order_result.scalar_one()

    order.final_total = final_total

    if all_weighed and order.status in ("new", "in_preparation"):
        order.status = "weighed"
        order.weighed_at = datetime.utcnow()


async def send_to_payment(db: AsyncSession, order_id: str) -> Order:
    """Move order to payment_pending and generate payment link placeholder."""
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise ValueError("Order not found")
    if order.status != "weighed":
        raise ValueError("Order must be in 'weighed' status to send for payment")

    order.status = "payment_pending"
    # Payment link placeholder — replace with real provider (Cardcom, PayMe, etc.)
    order.payment_link = f"https://pay.baffalo.co.il/pay/{order.order_number}"

    await db.commit()
    await db.refresh(order)
    return order
