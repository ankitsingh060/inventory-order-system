"""
routers/products.py — All endpoints under /products.

Implements full CRUD for the product catalog:
  POST   /products       → Create product (SKU must be unique)
  GET    /products       → List all products (with pagination)
  GET    /products/{id}  → Get one product
  PUT    /products/{id}  → Update product fields
  DELETE /products/{id}  → Remove product
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Product
from ..schemas import ProductCreate, ProductUpdate, ProductResponse

# All routes in this file share the /products prefix and "Products" tag (shown in docs)
router = APIRouter(prefix="/products", tags=["Products"])


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create a new product",
)
def create_product(product: ProductCreate, db: Session = Depends(get_db)):
    """
    Create a product in the catalog.

    **Business rules enforced:**
    - SKU must be unique across all products
    - Price must be > 0
    - Initial stock quantity must be ≥ 0
    """
    # Guard: duplicate SKU check before inserting
    if db.query(Product).filter(Product.sku == product.sku).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A product with SKU '{product.sku}' already exists. SKUs must be unique.",
        )

    db_product = Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)  # Reload to get DB-generated id / timestamps
    return db_product


@router.get(
    "/",
    response_model=List[ProductResponse],
    summary="Retrieve all products",
)
def list_products(
    skip:  int = Query(default=0,   ge=0,   description="Number of records to skip"),
    limit: int = Query(default=100, ge=1, le=500, description="Max records to return"),
    db: Session = Depends(get_db),
):
    """
    Return a paginated list of all products.

    Use `skip` + `limit` for cursor-style pagination.
    """
    return db.query(Product).offset(skip).limit(limit).all()


@router.get(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Get a product by ID",
)
def get_product(product_id: int, db: Session = Depends(get_db)):
    """Fetch a single product by its primary key."""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )
    return product


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    summary="Update product details",
)
def update_product(
    product_id: int,
    product_update: ProductUpdate,
    db: Session = Depends(get_db),
):
    """
    Partially update a product (only provided fields are changed).

    Note: SKU is intentionally not updatable to preserve order history integrity.
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    # Apply only the fields that were explicitly provided in the request body
    update_data = product_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return db_product


@router.delete(
    "/{product_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a product",
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """
    Permanently delete a product from the catalog.

    Returns 204 No Content on success (no body).
    """
    db_product = db.query(Product).filter(Product.id == product_id).first()
    if not db_product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product with ID {product_id} not found.",
        )

    db.delete(db_product)
    db.commit()
    # FastAPI automatically returns 204 with no body
