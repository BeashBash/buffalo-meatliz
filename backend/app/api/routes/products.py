from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List, Optional

from app.db.database import get_db
from app.models.buffalo import Product, Category
from app.schemas.products import ProductCreate, ProductUpdate, ProductOut
from app.api.deps import get_current_admin

router = APIRouter(prefix="/products", tags=["products"])


@router.get("/", response_model=List[ProductOut])
async def list_products(
    category_slug: Optional[str] = None,
    featured: Optional[bool] = None,
    db: AsyncSession = Depends(get_db),
):
    query = (
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.is_available == True)
        .order_by(Product.sort_order, Product.name_he)
    )
    if category_slug:
        query = query.join(Category).where(Category.slug == category_slug)
    if featured is not None:
        query = query.where(Product.is_featured == featured)

    result = await db.execute(query)
    return result.scalars().all()


@router.get("/admin", response_model=List[ProductOut])
async def list_all_products(
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .order_by(Product.sort_order, Product.name_he)
    )
    return result.scalars().all()


@router.get("/{product_id}", response_model=ProductOut)
async def get_product(product_id: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product)
        .options(selectinload(Product.category))
        .where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product


@router.post("/", response_model=ProductOut)
async def create_product(data: ProductCreate, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    product = Product(**data.model_dump())
    db.add(product)
    await db.commit()
    await db.refresh(product)
    # Reload with category
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product.id)
    )
    return result.scalar_one()


@router.put("/{product_id}", response_model=ProductOut)
async def update_product(
    product_id: str,
    data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin=Depends(get_current_admin)
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(product, field, value)

    await db.commit()
    result = await db.execute(
        select(Product).options(selectinload(Product.category)).where(Product.id == product_id)
    )
    return result.scalar_one()


@router.delete("/{product_id}")
async def delete_product(product_id: str, db: AsyncSession = Depends(get_db), admin=Depends(get_current_admin)):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.is_available = False
    await db.commit()
    return {"message": "Product deactivated"}
