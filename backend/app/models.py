"""
models.py — SQLAlchemy ORM models (database table definitions).

Each class maps to one PostgreSQL table. Relationships are defined here
so SQLAlchemy can eager-load or lazy-load related data automatically.
"""

from sqlalchemy import (
    Column, Integer, String, Float, DateTime, ForeignKey, Text
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base


# ─── Product ──────────────────────────────────────────────────────────────────
class Product(Base):
    """
    Represents an item in the product catalog.

    Business rules enforced at DB level:
    - `sku` has a UNIQUE constraint (no two products can share a code)
    - `quantity` defaults to 0; application logic prevents it going below 0
    """
    __tablename__ = "products"

    id          = Column(Integer, primary_key=True, index=True)
    name        = Column(String(255), nullable=False)
    sku         = Column(String(100), unique=True, nullable=False, index=True)
    price       = Column(Float, nullable=False)
    quantity    = Column(Integer, nullable=False, default=0)
    description = Column(Text, nullable=True)

    # Timestamps — set by the database server, not the application
    created_at  = Column(DateTime(timezone=True), server_default=func.now())
    updated_at  = Column(DateTime(timezone=True), onupdate=func.now())

    # One product can appear in many order line items
    order_items = relationship("OrderItem", back_populates="product")


# ─── Customer ─────────────────────────────────────────────────────────────────
class Customer(Base):
    """
    Represents a registered customer.

    Business rules:
    - `email` has a UNIQUE constraint (prevents duplicate accounts)
    """
    __tablename__ = "customers"

    id         = Column(Integer, primary_key=True, index=True)
    full_name  = Column(String(255), nullable=False)
    email      = Column(String(255), unique=True, nullable=False, index=True)
    phone      = Column(String(50), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # One customer can place many orders
    orders = relationship("Order", back_populates="customer")


# ─── Order ────────────────────────────────────────────────────────────────────
class Order(Base):
    """
    Represents an order header.

    `total_amount` is calculated by the backend when the order is created —
    it is never sent by the client.
    `status` defaults to 'pending' and can be updated later.
    """
    __tablename__ = "orders"

    id           = Column(Integer, primary_key=True, index=True)
    customer_id  = Column(Integer, ForeignKey("customers.id"), nullable=False)
    total_amount = Column(Float, nullable=False, default=0.0)
    status       = Column(String(50), nullable=False, default="pending")
    created_at   = Column(DateTime(timezone=True), server_default=func.now())

    # Many-side of Customer → Order
    customer    = relationship("Customer", back_populates="orders")

    # cascade="all, delete-orphan": deleting an Order also deletes its OrderItems
    order_items = relationship(
        "OrderItem", back_populates="order", cascade="all, delete-orphan"
    )


# ─── OrderItem ────────────────────────────────────────────────────────────────
class OrderItem(Base):
    """
    Represents a single line item within an order (order ↔ product junction).

    `unit_price` is stored at order time so historical totals remain correct
    even if the product price changes later.
    """
    __tablename__ = "order_items"

    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)  # Snapshot price at purchase time

    order   = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")
