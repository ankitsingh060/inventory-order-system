# InvenOrder — Inventory & Order Management System

A production-ready full-stack application for managing products, customers, and orders with automatic inventory tracking.

## Tech Stack

| Layer         | Technology                |
|---------------|---------------------------|
| Frontend      | React 18, React Router 6, Axios |
| Backend       | Python 3.11, FastAPI, SQLAlchemy |
| Database      | PostgreSQL 16             |
| Containerization | Docker, Docker Compose |
| Frontend Hosting | Vercel / Netlify       |
| Backend Hosting  | Render / Railway / Fly.io |

---

## Project Structure

```
inventory-order-system/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI app, CORS, router registration
│   │   ├── database.py      # SQLAlchemy engine & session
│   │   ├── models.py        # ORM models (Product, Customer, Order, OrderItem)
│   │   ├── schemas.py       # Pydantic request/response schemas
│   │   └── routers/
│   │       ├── products.py  # CRUD for products
│   │       ├── customers.py # CRUD for customers
│   │       ├── orders.py    # Order creation with inventory logic
│   │       └── dashboard.py # Aggregated stats
│   ├── Dockerfile
│   ├── .dockerignore
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── api/index.js     # Centralised axios API client
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Navbar.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Toast.jsx
│   │   │   └── ConfirmDialog.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Products.jsx
│   │   │   ├── Customers.jsx
│   │   │   └── Orders.jsx
│   │   ├── App.js
│   │   └── App.css          # All styles (CSS variables + components)
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml
├── .env.example
└── .gitignore
```

---

## Quick Start (Docker Compose)

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd inventory-order-system

# 2. Create your environment file
cp .env.example .env
# Edit .env and set a strong POSTGRES_PASSWORD

# 3. Build and start all three services
docker-compose up --build

# App is now running at:
#   Frontend  →  http://localhost:3000
#   Backend   →  http://localhost:8000
#   API Docs  →  http://localhost:8000/docs
```

### Stopping

```bash
docker-compose down          # Stop containers (data preserved)
docker-compose down -v       # Stop AND delete database volume
```

---

## Local Development (without Docker)

### Backend

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variable (or create .env file)
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventorydb"

# Run dev server (auto-reload on file change)
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend

npm install

# Set API URL (create .env.local)
echo "REACT_APP_API_URL=http://localhost:8000" > .env.local

npm start   # Starts on http://localhost:3000
```

---

## API Reference

Interactive docs available at **`/docs`** (Swagger UI) and **`/redoc`** once the backend is running.

### Products

| Method | Endpoint           | Description                   |
|--------|--------------------|-------------------------------|
| POST   | `/products`        | Create a product (unique SKU) |
| GET    | `/products`        | List all products             |
| GET    | `/products/{id}`   | Get product by ID             |
| PUT    | `/products/{id}`   | Update product details        |
| DELETE | `/products/{id}`   | Delete a product              |

**Create Product body:**
```json
{
  "name": "Wireless Keyboard",
  "sku": "WK-001",
  "price": 49.99,
  "quantity": 100,
  "description": "Compact wireless keyboard"
}
```

### Customers

| Method | Endpoint            | Description                    |
|--------|---------------------|--------------------------------|
| POST   | `/customers`        | Register customer (unique email)|
| GET    | `/customers`        | List all customers             |
| GET    | `/customers/{id}`   | Get customer by ID             |
| DELETE | `/customers/{id}`   | Delete a customer              |

### Orders

| Method | Endpoint          | Description                               |
|--------|-------------------|-------------------------------------------|
| POST   | `/orders`         | Place an order (validates & deducts stock)|
| GET    | `/orders`         | List all orders with details              |
| GET    | `/orders/{id}`    | Get full order details                    |
| DELETE | `/orders/{id}`    | Cancel order (restores inventory)         |

**Create Order body:**
```json
{
  "customer_id": 1,
  "items": [
    { "product_id": 1, "quantity": 2 },
    { "product_id": 3, "quantity": 1 }
  ]
}
```

### Dashboard

| Method | Endpoint             | Description              |
|--------|----------------------|--------------------------|
| GET    | `/dashboard/stats`   | Summary stats + low stock|

---

## Business Logic

| Rule                          | Implementation                              |
|-------------------------------|---------------------------------------------|
| Unique SKU                    | DB unique constraint + API 400 guard        |
| Unique customer email         | DB unique constraint + API 400 guard        |
| No negative stock             | Pydantic validator + model default = 0      |
| Insufficient stock → reject   | Pre-validated before any DB write           |
| Auto inventory deduction      | `product.quantity -= item.quantity` on order|
| Auto total calculation        | Backend sums `price × qty` per line item    |
| Cancel order restores stock   | `product.quantity += item.quantity` on delete|

---

## Deployment

### Backend (Render)

1. Push code to GitHub
2. Create a new **Web Service** on [render.com](https://render.com)
3. Set **Root directory** to `backend`
4. Set **Build command**: `pip install -r requirements.txt`
5. Set **Start command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variable: `DATABASE_URL` → your PostgreSQL connection string
7. (Optional) Add a free **PostgreSQL** database on Render and link it

### Frontend (Vercel)

1. Import repository on [vercel.com](https://vercel.com)
2. Set **Root directory** to `frontend`
3. Set **Build command**: `npm run build`
4. Set **Output directory**: `build`
5. Add environment variable: `REACT_APP_API_URL` → your Render backend URL
6. Deploy — Vercel handles SSL and CDN automatically

### Docker Hub (backend image)

```bash
# Build and tag
docker build -t yourdockerhubuser/invenorder-backend:latest ./backend

# Push
docker login
docker push yourdockerhubuser/invenorder-backend:latest
```

---

## Environment Variables

| Variable             | Service   | Default               | Description                    |
|----------------------|-----------|-----------------------|--------------------------------|
| `POSTGRES_USER`      | db        | `postgres`            | Database user                  |
| `POSTGRES_PASSWORD`  | db        | *(required)*          | Database password              |
| `POSTGRES_DB`        | db        | `inventorydb`         | Database name                  |
| `DATABASE_URL`       | backend   | auto-built            | Full PostgreSQL connection URL  |
| `REACT_APP_API_URL`  | frontend  | `http://localhost:8000`| Backend URL seen by browser   |
