"""
main.py — FastAPI application factory and entry point.

Responsibilities:
  - Create the FastAPI app instance with metadata (title, version, docs URLs)
  - Register CORS middleware so the React frontend can call the API
  - Create all database tables on startup (dev convenience)
  - Mount all routers
  - Provide root health-check endpoints
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
# Import models so SQLAlchemy discovers them before create_all()
from . import models  # noqa: F401
from .routers import products, customers, orders, dashboard

# ─── Create tables ────────────────────────────────────────────────────────────
# In production, use Alembic migrations instead of create_all().
# For this project, create_all() is acceptable and runs on every startup.
Base.metadata.create_all(bind=engine)

# ─── FastAPI instance ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Inventory & Order Management API",
    description=(
        "A production-ready REST API for managing products, customers, "
        "and orders with automatic inventory tracking."
    ),
    version="1.0.0",
    docs_url="/docs",      # Swagger UI at /docs
    redoc_url="/redoc",    # ReDoc UI at /redoc
)

# ─── CORS Middleware ──────────────────────────────────────────────────────────
# Allows the React frontend (running on a different port/domain) to make
# requests to this API. In production, replace "*" with your specific origins.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],      # e.g., ["https://your-frontend.vercel.app"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ──────────────────────────────────────────────────────────────────
# Each router handles a logical group of endpoints
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(orders.router)
app.include_router(dashboard.router)


# ─── Root Endpoints ───────────────────────────────────────────────────────────

@app.get("/", tags=["Health"])
def root():
    """
    Root endpoint — confirms the API is running.
    Also serves as a basic health check for load balancers.
    """
    return {
        "service": "Inventory & Order Management API",
        "version": "1.0.0",
        "status":  "running",
        "docs":    "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    """
    Lightweight health-check endpoint used by Docker / cloud platforms
    to determine if the container is ready to serve traffic.
    """
    return {"status": "healthy"}
