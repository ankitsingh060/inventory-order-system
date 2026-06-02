"""
routers/orders.py — All endpoints under /orders.

  POST   /orders       → Place a new order (validates stock, deducts inventory)
  GET    /orders       → List all orders with details
  GET    /orders/{id}  → Get full order details
  DELETE /orders/{id}  → Cancel/delete order (restores inventory)

Key business logic lives here:
  1. Pre-validate every line item BEFORE making any DB changes (atomic)
  2. Deduct inventory automatically on successful order
  3. Restore inventory when an order is cancelled
  4. Calculate total_amount from current product prices
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Customer, Order, OrderItem, Product
from ..schemas import OrderCreate, OrderResponse

router = APIRouter(prefix="/orders", tags=["Orders"])


@router.post(
    "/",
    response_model=OrderResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Place a new order",
)
def create_order(order: OrderCreate, db: Session = Depends(get_db)):
    """
    Create an order and automatically:
    - Validate all products exist
    - Check sufficient inventory for every line item
    - Deduct stock quantities
    - Calculate and persist the total amount

    The operation is **atomic**: if any item fails validation, no changes
    are committed to the database.
    """
    # ── 1. Validate customer ──────────────────────────────────────────────────
    customer = db.query(Customer).filter(Customer.id == order.customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {order.customer_id} not found.",
        )

    # ── 2. Pre-validate ALL items before touching the DB ─────────────────────
    # Collect validated data so we only iterate once and keep things clean
    validated_items = []
    total_amount = 0.0

    for item in order.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()

        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product with ID {item.product_id} not found.",
            )

        # Business rule: insufficient stock → reject the entire order
        if product.quantity < item.quantity:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Insufficient stock for '{product.name}' (SKU: {product.sku}). "
                    f"Requested: {item.quantity}, Available: {product.quantity}."
                ),
            )

        line_total = product.price * item.quantity
        total_amount += line_total

        validated_items.append({
            "product":    product,
            "quantity":   item.quantity,
            "unit_price": product.price,    # Snapshot price at order time
        })

    # ── 3. All validations passed — persist the order ────────────────────────
    db_order = Order(
        customer_id=order.customer_id,
        total_amount=round(total_amount, 2),
        status="pending",
    )
    db.add(db_order)
    db.flush()  # Assign db_order.id without committing the transaction yet

    # ── 4. Create line items and deduct inventory ─────────────────────────────
    for item_data in validated_items:
        db.add(OrderItem(
            order_id=db_order.id,
            product_id=item_data["product"].id,
            quantity=item_data["quantity"],
            unit_price=item_data["unit_price"],
        ))
        # Deduct stock — this is the automatic inventory reduction requirement
        item_data["product"].quantity -= item_data["quantity"]

    # ── 5. Commit everything in one transaction ───────────────────────────────
    db.commit()
    db.refresh(db_order)
    return db_order


@router.get(
    "/",
    response_model=List[OrderResponse],
    summary="List all orders",
)
def list_orders(
    skip:  int = Query(default=0,   ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Return all orders, most recent first, with customer and item details."""
    return (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get(
    "/{order_id}",
    response_model=OrderResponse,
    summary="Get order details",
)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Retrieve full order details including customer and all line items."""
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )
    return order


@router.delete(
    "/{order_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Cancel / delete an order",
)
def cancel_order(order_id: int, db: Session = Depends(get_db)):
    """
    Cancel an order and restore the inventory for all its line items.

    Stock quantities are returned so the products are available for
    future orders.
    """
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order with ID {order_id} not found.",
        )

    # Restore inventory before deleting (cascade will remove OrderItems)
    for item in order.order_items:
        if item.product:  # Guard against orphaned items
            item.product.quantity += item.quantity

    db.delete(order)
    db.commit()
