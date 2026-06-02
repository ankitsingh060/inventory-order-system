"""
routers/customers.py — All endpoints under /customers.

  POST   /customers       → Register a new customer (email must be unique)
  GET    /customers       → List all customers
  GET    /customers/{id}  → Get customer details
  DELETE /customers/{id}  → Remove a customer
"""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Customer
from ..schemas import CustomerCreate, CustomerResponse

router = APIRouter(prefix="/customers", tags=["Customers"])


@router.post(
    "/",
    response_model=CustomerResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new customer",
)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """
    Create a customer account.

    **Business rules:**
    - Email address must be unique across all customers
    - Email is normalised to lowercase before storing
    """
    # Guard: email uniqueness check
    if db.query(Customer).filter(Customer.email == customer.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"A customer with email '{customer.email}' is already registered.",
        )

    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get(
    "/",
    response_model=List[CustomerResponse],
    summary="List all customers",
)
def list_customers(
    skip:  int = Query(default=0,   ge=0),
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    """Return a paginated list of all registered customers."""
    return db.query(Customer).offset(skip).limit(limit).all()


@router.get(
    "/{customer_id}",
    response_model=CustomerResponse,
    summary="Get customer by ID",
)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Fetch a single customer record by primary key."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )
    return customer


@router.delete(
    "/{customer_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a customer",
)
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """
    Delete a customer record.

    Note: If the customer has existing orders, those orders remain in the
    database for historical/audit purposes (customer_id becomes a dangling
    reference — handle with a soft-delete in production).
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Customer with ID {customer_id} not found.",
        )

    db.delete(customer)
    db.commit()
