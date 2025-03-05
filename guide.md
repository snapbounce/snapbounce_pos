# POS-Like Application with Docker

## Project Overview
This project is a POS (Point of Sale) application deployed using Docker. It includes:
- **Admin Features**:
  - Add/modify items for sale with pricing.
  - Define terms and conditions.
  - View all transactions for a given date.
  - Pull daily earnings reports.
- **User Features**:
  - Select items from the predefined list.
  - Add items to the cart.
  - Display total cost before payment.
  - Process payment and mark transaction as "Completed".
- **Technology Stack**:
  - Backend: **Node.js (Express) / Python (FastAPI)**
  - Database: **PostgreSQL / MongoDB**
  - Frontend: **React.js / Vue.js**
  - Deployment: **Docker (Docker Compose for multi-container setup)**

## Core Functionalities

### 1. Backend Setup with Docker
- **Description**: The backend should be containerized using Docker to ensure consistency in different environments.
- **Steps**:
  1. Create a `Dockerfile` to define the backend service.
  2. Configure `docker-compose.yml` to set up backend, database, and frontend services.
  3. Use environment variables for database credentials.

### 2. Admin: Add/Modify Items for Sale
- **Description**: Admin should be able to add new items or update existing ones.
- **Data Structure**:
  ```json
  {
    "id": 1,
    "name": "Product Name",
    "price": 10.50,
    "stock": 100
  }
  ```
- **Endpoints**:
  - `POST /api/items` → Add a new item.
  - `PUT /api/items/:id` → Update item details.
  - `GET /api/items` → Retrieve list of items.

### 3. Admin: Set Terms & Conditions
- **Description**: Admin can define terms & conditions that appear at checkout.
- **Data Structure**:
  ```json
  {
    "terms": "All sales are final. No refunds."
  }
  ```
- **Endpoints**:
  - `POST /api/terms` → Save terms & conditions.
  - `GET /api/terms` → Retrieve terms.

### 4. User: POS System - Item Selection & Cart Management
- **Description**: Users can select items, add them to a cart, and view total cost.
- **Data Structure**:
  ```json
  {
    "cart": [
      { "id": 1, "name": "Product A", "price": 10.50, "quantity": 2 },
      { "id": 2, "name": "Product B", "price": 5.00, "quantity": 1 }
    ],
    "total": 26.00
  }
  ```
- **Endpoints**:
  - `GET /api/items` → List all items.
  - `POST /api/cart` → Add item to cart.
  - `GET /api/cart` → Retrieve cart contents.
  - `DELETE /api/cart/:id` → Remove item from cart.

### 5. User: Payment Processing & Transaction Completion
- **Description**: Users finalize purchases, and transactions are stored in the database.
- **Steps**:
  1. User confirms purchase.
  2. Total cost is displayed.
  3. Payment is processed (simulate payment gateway).
  4. Transaction status is updated to `"Completed"`.
- **Data Structure**:
  ```json
  {
    "transaction_id": "abc123",
    "items": [
      { "id": 1, "name": "Product A", "price": 10.50, "quantity": 2 }
    ],
    "total": 21.00,
    "status": "Completed",
    "timestamp": "2024-03-06T12:00:00Z"
  }
  ```
- **Endpoints**:
  - `POST /api/transactions` → Record transaction.
  - `PUT /api/transactions/:id` → Update status to "Completed".

### 6. Admin: View Daily Transactions & Earnings
- **Description**: Admin can view transactions for a specific date and total earnings.
- **Endpoints**:
  - `GET /api/transactions?date=YYYY-MM-DD` → Retrieve all transactions for a date.
  - `GET /api/earnings?date=YYYY-MM-DD` → Retrieve total earnings.

### 7. Admin: View All Available Transaction Dates
- **Description**: Admin sees a list of dates with recorded transactions.
- **Endpoint**:
  - `GET /api/transaction-dates` → Retrieve all available dates.

## Docs

### 1. PostgreSQL Database
- **Library/API**: PostgreSQL
- **Documentation Link**: [https://www.postgresql.org/docs/](https://www.postgresql.org/docs/)

### 2. Docker
- **Library/API**: Docker
- **Documentation Link**: [https://docs.docker.com/](https://docs.docker.com/)

### 3. Node.js Express
- **Library/API**: Express.js
- **Documentation Link**: [https://expressjs.com/](https://expressjs.com/)

### 4. FastAPI (Alternative Backend)
- **Library/API**: FastAPI
- **Documentation Link**: [https://fastapi.tiangolo.com/](https://fastapi.tiangolo.com/)

## Important Implementation Notes
- Ensure **Docker Compose** is used to deploy backend, database, and frontend services together.
- Admin and User functionalities should be in separate frontend components for clarity.
- Transactions must be stored with timestamps to facilitate date-based queries.
- Payment processing can be simulated without integrating an actual payment gateway.
