"""
schemas.py — Pydantic models for request validation and response serialization.

Pydantic automatically:
- Validates incoming JSON against these schemas
- Serializes ORM objects to JSON for responses
- Generates OpenAPI docs from type hints and Field metadata
"""

from pydantic import BaseModel, field_validator, EmailStr
from typing import List, Optional
from datetime import datetime


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                          PRODUCT SCHEMAS                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

class ProductBase(BaseModel):
    """Shared fields used by both Create and Response schemas."""
    name:        str
    sku:         str
    price:       float
    quantity:    int
    description: Optional[str] = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: float) -> float:
        """Business rule: price must be a positive number."""
        if v <= 0:
            raise ValueError("Price must be greater than 0")
        return round(v, 2)

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_non_negative(cls, v: int) -> int:
        """Business rule: stock quantity cannot be negative."""
        if v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductCreate(ProductBase):
    """Schema for POST /products — all base fields are required."""
    pass


class ProductUpdate(BaseModel):
    """
    Schema for PUT /products/{id}.
    All fields are optional — only provided fields are updated (PATCH semantics).
    Note: SKU cannot be updated to prevent order history corruption.
    """
    name:        Optional[str]   = None
    price:       Optional[float] = None
    quantity:    Optional[int]   = None
    description: Optional[str]  = None

    @field_validator("price")
    @classmethod
    def price_must_be_positive(cls, v: Optional[float]) -> Optional[float]:
        if v is not None and v <= 0:
            raise ValueError("Price must be greater than 0")
        return v

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_non_negative(cls, v: Optional[int]) -> Optional[int]:
        if v is not None and v < 0:
            raise ValueError("Quantity cannot be negative")
        return v


class ProductResponse(ProductBase):
    """Schema for product responses — includes DB-generated fields."""
    id:         int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True  # Allows ORM model → Pydantic model conversion


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                         CUSTOMER SCHEMAS                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

class CustomerBase(BaseModel):
    """Shared customer fields."""
    full_name: str
    email:     str
    phone:     Optional[str] = None

    @field_validator("email")
    @classmethod
    def email_must_be_valid(cls, v: str) -> str:
        """Basic email format validation."""
        if "@" not in v or "." not in v.split("@")[-1]:
            raise ValueError("Invalid email address")
        return v.lower().strip()

    @field_validator("full_name")
    @classmethod
    def name_must_not_be_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Full name cannot be empty")
        return v.strip()


class CustomerCreate(CustomerBase):
    """Schema for POST /customers."""
    pass


class CustomerResponse(CustomerBase):
    """Schema for customer responses."""
    id:         int
    created_at: datetime

    class Config:
        from_attributes = True


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                           ORDER SCHEMAS                                     ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

class OrderItemCreate(BaseModel):
    """A single line item when creating an order."""
    product_id: int
    quantity:   int

    @field_validator("quantity")
    @classmethod
    def quantity_must_be_at_least_one(cls, v: int) -> int:
        if v < 1:
            raise ValueError("Quantity must be at least 1")
        return v


class OrderItemResponse(BaseModel):
    """A line item in an order response — includes product details."""
    id:         int
    product_id: int
    quantity:   int
    unit_price: float
    product:    ProductResponse  # Nested product object

    class Config:
        from_attributes = True


class OrderCreate(BaseModel):
    """Schema for POST /orders — customer + list of items."""
    customer_id: int
    items:       List[OrderItemCreate]

    @field_validator("items")
    @classmethod
    def must_have_at_least_one_item(cls, v: list) -> list:
        if not v:
            raise ValueError("Order must contain at least one item")
        return v


class OrderResponse(BaseModel):
    """Full order response including nested customer and items."""
    id:           int
    customer_id:  int
    total_amount: float
    status:       str
    created_at:   datetime
    customer:     CustomerResponse       # Nested customer object
    order_items:  List[OrderItemResponse]  # Nested line items

    class Config:
        from_attributes = True


# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║                        DASHBOARD SCHEMAS                                    ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

class DashboardStats(BaseModel):
    """Summary statistics returned by GET /dashboard/stats."""
    total_products:    int
    total_customers:   int
    total_orders:      int
    total_revenue:     float
    low_stock_products: List[ProductResponse]  # Products with quantity < 10
