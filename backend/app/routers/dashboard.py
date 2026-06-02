"""
routers/dashboard.py — Aggregated statistics for the frontend dashboard.

  GET /dashboard/stats → Summary counts + low-stock products
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from ..database import get_db
from ..models import Customer, Order, Product
from ..schemas import DashboardStats

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Products with quantity below this threshold are considered "low stock"
LOW_STOCK_THRESHOLD = 10


@router.get(
    "/stats",
    response_model=DashboardStats,
    summary="Get dashboard summary statistics",
)
def get_dashboard_stats(db: Session = Depends(get_db)):
    """
    Returns aggregated counts and low-stock alerts used by the dashboard:
    - total_products:      count of all products
    - total_customers:     count of all customers
    - total_orders:        count of all orders
    - total_revenue:       sum of all order totals
    - low_stock_products:  products where quantity < LOW_STOCK_THRESHOLD (10)
    """
    # Aggregate queries — each hits the DB once
    total_products  = db.query(func.count(Product.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_orders    = db.query(func.count(Order.id)).scalar() or 0
    total_revenue   = db.query(func.sum(Order.total_amount)).scalar() or 0.0

    # Products whose stock is below the warning threshold
    low_stock_products = (
        db.query(Product)
        .filter(Product.quantity < LOW_STOCK_THRESHOLD)
        .order_by(Product.quantity.asc())   # Lowest stock first
        .all()
    )

    return DashboardStats(
        total_products=total_products,
        total_customers=total_customers,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        low_stock_products=low_stock_products,
    )
