"""
Buffalo Meatliz — FastAPI Backend
Run: uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.api.routes import auth, categories, products, orders, weighing, admin, site_content

app = FastAPI(
    title="Buffalo Meatliz API",
    description="API for Buffalo Meatliz online butcher shop",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router, prefix="/api/v1")
app.include_router(categories.router, prefix="/api/v1")
app.include_router(products.router, prefix="/api/v1")
app.include_router(orders.router, prefix="/api/v1")
app.include_router(weighing.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(site_content.router, prefix="/api/v1")


@app.get("/")
async def root():
    return {"message": "Buffalo Meatliz API", "status": "running", "docs": "/docs"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


@app.get("/debug/network")
async def debug_network():
    import socket
    results = {}
    for host in ["google.com", "apsuoutdtsxsbyjajgmp.supabase.co", "db.apsuoutdtsxsbyjajgmp.supabase.co", "aws-1-ap-southeast-1.pooler.supabase.com"]:
        try:
            ip = socket.getaddrinfo(host, 443)[0][4][0]
            results[host] = f"OK: {ip}"
        except Exception as e:
            results[host] = f"FAIL: {e}"
    return results
