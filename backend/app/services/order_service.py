"""
Order business logic service.
"""
from decimal import Decimal
from datetime import datetime
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.models.buffalo import Order, OrderItem, Customer, Promotion
from app.schemas.orders import CheckoutRequest


async def get_or_create_customer(db: AsyncSession, name: str, phone: str, email: str = None, address: str = None, city: str = None) -> Customer:
    result = await db.execute(select(Customer).where(Customer.phone == phone))
    customer = result.scalar_one_or_none()
    if not customer:
        customer = Customer(full_name=name, phone=phone, email=email, address=address, city=city)
        db.add(customer)
        await db.flush()
    return customer


async def apply_coupon(db: AsyncSession, code: str, order_total: Decimal) -> tuple[Decimal, str | None]:
    """Returns (discount_amount, error_message)."""
    if not code:
        return Decimal("0"), None

    result = await db.execute(
        select(Promotion).where(
            Promotion.code == code,
            Promotion.is_active == True,
        )
    )
    promo = result.scalar_one_or_none()
    if not promo:
        return Decimal("0"), "קוד קופון לא תקף"
    if promo.expires_at and promo.expires_at < datetime.utcnow():
        return Decimal("0"), "קוד קופון פג תוקף"
    if promo.max_uses and promo.current_uses >= promo.max_uses:
        return Decimal("0"), "קוד קופון מוצה"
    if order_total < promo.min_order_amount:
        return Decimal("0"), f"סכום הזמנה מינימלי לשימוש: ₪{promo.min_order_amount}"

    if promo.discount_type == "percentage":
        discount = (order_total * Decimal(str(promo.discount_value)) / Decimal("100")).quantize(Decimal("0.01"))
    else:
        discount = min(Decimal(str(promo.discount_value)), order_total)

    return discount, None


async def create_order(db: AsyncSession, data: CheckoutRequest) -> Order:
    # Upsert customer
    customer = await get_or_create_customer(
        db,
        name=data.customer_name,
        phone=data.customer_phone,
        email=data.customer_email,
        address=data.delivery_address,
        city=data.delivery_city,
    )

    # Calculate estimated total
    estimated_total = sum(item.estimated_price for item in data.items)

    # Apply coupon
    discount = Decimal("0")
    if data.coupon_code:
        discount, err = await apply_coupon(db, data.coupon_code, estimated_total)
        if err:
            # If coupon invalid, just ignore it (or raise - your choice)
            data.coupon_code = None
            discount = Decimal("0")

    # Create order
    order = Order(
        customer_id=customer.id,
        customer_name=data.customer_name,
        customer_phone=data.customer_phone,
        customer_email=data.customer_email,
        delivery_type=data.delivery_type,
        delivery_address=data.delivery_address,
        delivery_city=data.delivery_city,
        preferred_delivery_time=data.preferred_delivery_time,
        estimated_total=estimated_total - discount,
        discount_amount=discount,
        coupon_code=data.coupon_code,
        customer_notes=data.customer_notes,
        status="new",
    )
    db.add(order)
    await db.flush()  # get order.id

    # Create order items
    for item_data in data.items:
        item = OrderItem(
            order_id=order.id,
            product_id=item_data.product_id,
            product_name_he=item_data.product_name_he,
            pricing_type=item_data.pricing_type,
            price_at_order=item_data.price_at_order,
            requested_weight_kg=item_data.requested_weight_kg,
            quantity=item_data.quantity,
            estimated_price=item_data.estimated_price,
            notes=item_data.notes,
        )
        db.add(item)

    # Update customer stats
    customer.total_orders = (customer.total_orders or 0) + 1

    await db.commit()

    # Reload full order with items
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.id == order.id)
    )
    return result.scalar_one()
