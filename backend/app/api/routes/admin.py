"""
Admin-only routes: reports, banners, promotions, dashboard stats.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import selectinload
from datetime import datetime, date, timedelta
from typing import List, Optional

from app.db.database import get_db
from app.models.buffalo import Order, Product, Banner, Promotion, Message, Customer
from app.schemas.admin import (
    BannerCreate, BannerOut, PromotionCreate, PromotionOut,
    DashboardStatsOut, DailyReportOut
)
from app.api.deps import get_current_admin, require_admin_role

router = APIRouter(prefix="/admin", tags=["admin"])


# ── Dashboard Stats ────────────────────────────────────────────────────────────

@router.get("/stats", response_model=DashboardStatsOut)
async def dashboard_stats(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    today_start = datetime.combine(date.today(), datetime.min.time())

    # Today's orders
    today_orders = await db.execute(
        select(func.count(Order.id)).where(Order.created_at >= today_start)
    )
    today_revenue = await db.execute(
        select(func.coalesce(func.sum(Order.final_total), 0)).where(
            Order.created_at >= today_start,
            Order.status.in_(["paid", "delivered"])
        )
    )
    pending = await db.execute(select(func.count(Order.id)).where(Order.status == "new"))
    in_prep = await db.execute(select(func.count(Order.id)).where(Order.status == "in_preparation"))
    awaiting_weigh = await db.execute(select(func.count(Order.id)).where(Order.status == "in_preparation"))
    awaiting_pay = await db.execute(select(func.count(Order.id)).where(Order.status == "payment_pending"))

    return DashboardStatsOut(
        today_orders=today_orders.scalar() or 0,
        today_revenue=float(today_revenue.scalar() or 0),
        pending_orders=pending.scalar() or 0,
        in_preparation=in_prep.scalar() or 0,
        awaiting_weighing=awaiting_weigh.scalar() or 0,
        awaiting_payment=awaiting_pay.scalar() or 0,
    )


@router.get("/reports/daily", response_model=List[DailyReportOut])
async def daily_report(days: int = 30, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    reports = []
    for i in range(days - 1, -1, -1):
        day = date.today() - timedelta(days=i)
        day_start = datetime.combine(day, datetime.min.time())
        day_end = datetime.combine(day, datetime.max.time())

        total_q = await db.execute(
            select(func.count(Order.id)).where(
                and_(Order.created_at >= day_start, Order.created_at <= day_end)
            )
        )
        completed_q = await db.execute(
            select(func.count(Order.id)).where(
                and_(
                    Order.created_at >= day_start,
                    Order.created_at <= day_end,
                    Order.status.in_(["paid", "delivered"])
                )
            )
        )
        revenue_q = await db.execute(
            select(func.coalesce(func.sum(Order.final_total), 0)).where(
                and_(
                    Order.created_at >= day_start,
                    Order.created_at <= day_end,
                    Order.status.in_(["paid", "delivered"])
                )
            )
        )
        total = total_q.scalar() or 0
        completed = completed_q.scalar() or 0
        revenue = float(revenue_q.scalar() or 0)
        reports.append(DailyReportOut(
            date=day.isoformat(),
            total_orders=total,
            completed_orders=completed,
            total_revenue=revenue,
            avg_order_value=revenue / completed if completed else 0,
        ))
    return reports


# ── Best-selling products ──────────────────────────────────────────────────────

@router.get("/reports/best-sellers")
async def best_sellers(days: int = 30, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    from app.models.buffalo import OrderItem
    from sqlalchemy import text
    since = datetime.utcnow() - timedelta(days=days)

    result = await db.execute(
        select(
            OrderItem.product_name_he,
            func.count(OrderItem.id).label("order_count"),
            func.sum(OrderItem.actual_weight_kg).label("total_weight"),
            func.sum(OrderItem.actual_price).label("total_revenue"),
        )
        .join(Order, OrderItem.order_id == Order.id)
        .where(Order.created_at >= since, Order.status.in_(["paid", "delivered"]))
        .group_by(OrderItem.product_name_he)
        .order_by(desc("total_revenue"))
        .limit(20)
    )
    rows = result.all()
    return [
        {
            "product_name": r.product_name_he,
            "order_count": r.order_count,
            "total_weight_kg": float(r.total_weight or 0),
            "total_revenue": float(r.total_revenue or 0),
        }
        for r in rows
    ]


# ── Banners ────────────────────────────────────────────────────────────────────

@router.get("/banners", response_model=List[BannerOut])
async def list_banners(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(Banner).order_by(Banner.sort_order))
    return result.scalars().all()


@router.post("/banners", response_model=BannerOut)
async def create_banner(data: BannerCreate, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    banner = Banner(**data.model_dump())
    db.add(banner)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.put("/banners/{banner_id}", response_model=BannerOut)
async def update_banner(banner_id: str, data: BannerCreate, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(status_code=404, detail="Banner not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(banner, field, value)
    await db.commit()
    await db.refresh(banner)
    return banner


@router.delete("/banners/{banner_id}")
async def delete_banner(banner_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(Banner).where(Banner.id == banner_id))
    banner = result.scalar_one_or_none()
    if not banner:
        raise HTTPException(404, "Not found")
    await db.delete(banner)
    await db.commit()
    return {"message": "Deleted"}


# ── Promotions ─────────────────────────────────────────────────────────────────

@router.get("/promotions", response_model=List[PromotionOut])
async def list_promotions(db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(Promotion).order_by(desc(Promotion.created_at)))
    return result.scalars().all()


@router.post("/promotions", response_model=PromotionOut)
async def create_promotion(data: PromotionCreate, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    promo = Promotion(**data.model_dump())
    db.add(promo)
    await db.commit()
    await db.refresh(promo)
    return promo


@router.delete("/promotions/{promo_id}")
async def delete_promotion(promo_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(Promotion).where(Promotion.id == promo_id))
    promo = result.scalar_one_or_none()
    if not promo:
        raise HTTPException(404, "Not found")
    promo.is_active = False
    await db.commit()
    return {"message": "Deactivated"}
