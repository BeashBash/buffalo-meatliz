from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from typing import Dict, List
from pydantic import BaseModel
from datetime import datetime

from app.db.database import get_db
from app.models.buffalo import SiteContent
from app.api.deps import get_current_admin

router = APIRouter(prefix="/site-content", tags=["site-content"])


class SiteContentItem(BaseModel):
    key: str
    value: str | None = None
    type: str = "text"
    section: str = "general"
    label: str = ""


class SiteContentUpdate(BaseModel):
    updates: Dict[str, str]  # key -> value


@router.get("/", response_model=List[SiteContentItem])
async def get_all_site_content(db: AsyncSession = Depends(get_db)):
    """Public endpoint — returns all site content key/values."""
    result = await db.execute(
        select(SiteContent).order_by(SiteContent.section, SiteContent.key)
    )
    rows = result.scalars().all()
    return [
        SiteContentItem(
            key=r.key,
            value=r.value,
            type=r.type,
            section=r.section,
            label=r.label,
        )
        for r in rows
    ]


@router.get("/map")
async def get_site_content_map(db: AsyncSession = Depends(get_db)):
    """Returns a flat key→value dict for easy frontend consumption."""
    result = await db.execute(select(SiteContent))
    rows = result.scalars().all()
    return {r.key: r.value for r in rows}


@router.put("/")
async def update_site_content(
    payload: SiteContentUpdate,
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Admin-protected: bulk update site content values."""
    for key, value in payload.updates.items():
        await db.execute(
            update(SiteContent)
            .where(SiteContent.key == key)
            .values(value=value, updated_at=datetime.utcnow())
        )
    await db.commit()
    return {"success": True, "updated": len(payload.updates)}


@router.post("/reset-defaults")
async def reset_to_defaults(
    db: AsyncSession = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Admin: re-seed any missing keys with defaults (does not overwrite existing)."""
    defaults = {
        "hero_slide1_tag": "פרמיום | כשר | טרי",
        "hero_slide1_title1": "QUALITY BEEF",
        "hero_slide1_title2": "AND FRESH MEAT",
        "hero_slide1_desc": "בשר טרי ואיכותי ממיטב המשקים, שחוט ומוכן בסטנדרטים הגבוהים ביותר.",
        "hero_slide1_bg": "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=1400",
        "hero_slide1_img": "https://images.unsplash.com/photo-1558030006-450675393462?w=600",
    }
    result = await db.execute(select(SiteContent.key))
    existing = set(result.scalars().all())
    added = 0
    for key, value in defaults.items():
        if key not in existing:
            db.add(SiteContent(key=key, value=value))
            added += 1
    await db.commit()
    return {"success": True, "added": added}
