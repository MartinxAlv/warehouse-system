# Warehouse Inventory Management System

A full-stack warehouse and eCommerce inventory management system built with **Spring Boot** (Java) and **React**. Supports role-based access control, purchase order workflows, customer order fulfillment, real-time stock tracking, and reporting.

---

## Features

### Authentication & Access Control
- JWT-based login with secure token storage
- Three user roles with different permissions:
  - **Admin** — full access to everything including user management and categories
  - **Warehouse Staff** — inventory operations, purchase orders, stock adjustments
  - **Sales Staff** — customer orders only
- Demo accounts pre-seeded on first run

### Inventory Management
- Track stock levels per product per warehouse
- Adjust stock manually with a required reason (Damaged, Recount, Return, Theft, Expired, Restocked)
- Transfer stock between warehouses
- Low stock alerts based on configurable reorder thresholds
- Full audit trail — every stock change is logged in the Stock Movement Log

### Purchase Orders (Supplier → Warehouse)
- Create multi-line purchase orders with multiple products
- Workflow: Draft → Submitted → Received (or Cancelled)
- Receiving a purchase order automatically adds stock to inventory
- Grayed-out action buttons show which steps are available at each stage

### Customer Orders (Warehouse → Customer)
- Create orders with multiple line items
- Workflow: Pending → Confirmed → Fulfilled (or Cancelled)
- Fulfilling an order automatically deducts stock from inventory
- Date, customer info, and line item breakdown on every order

### Products & Categories
- Full product catalog with SKU, price, category, and reorder threshold
- Search and filter products by name, SKU, or category
- Edit and deactivate products
- Category management (Admin only)

### Suppliers & Warehouses
- Supplier contact management with edit support
- Warehouse detail view showing live inventory breakdown per warehouse (expandable cards)

### Reports & Analytics
- KPI cards: inventory lines, total units, low stock count, total orders
- Stock levels bar chart per product (color-coded by health)
- Customer order and purchase order status breakdown charts
- Order value summary panel

### User Management (Admin only)
- Create, edit, and deactivate user accounts
- Assign and change roles
- Password reset from the admin panel

### Profile
- Every user can change their own password from the Profile page
- Accessible by clicking your name in the sidebar

### UI/UX
- Personalized welcome banner on the Dashboard (greets by name and role)
- Breadcrumb navigation on every page
- Toast notifications for successful actions
- Custom confirmation dialogs for destructive actions (no browser `confirm()`)
- Tooltips on every action button
- Timestamps on all orders and stock movements
- Fully responsive sidebar navigation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17+, Spring Boot 3.3.4 |
| Security | Spring Security, JWT (JJWT 0.12.6) |
| Database ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8+ |
| Frontend | React 18, React Router v6, Vite |
| Styling | Custom CSS with CSS variables (no UI library) |
| Fonts | Inter (Google Fonts) |

---

## Project Structure

```
warehouse-system/
├── docs/                          # Design documents
│   ├── 01-problem-domain-and-requirements.md
│   ├── 02-ui-design.md
│   ├── 03-class-diagram.md
│   └── 04-database-diagram.md
│
├── backend/
│   └── src/main/java/com/warehouse/inventory/
│       ├── config/                # CORS, Security (JWT), DataInitializer
│       ├── controller/            # REST endpoints (Auth, Products, Orders, etc.)
│       ├── exception/             # Global exception handler
│       ├── model/                 # JPA entities (Product, Order, User, etc.)
│       ├── repository/            # Spring Data JPA repositories
│       ├── security/              # JwtService, JwtAuthFilter, UserDetailsService
│       └── service/               # Business logic (InventoryService, etc.)
│
└── frontend/
    └── src/
        ├── api/client.js          # Fetch wrapper with JWT header injection
        ├── components/            # Layout, Modal, ConfirmModal, StatusBadge
        ├── context/               # AuthContext, ToastContext
        ├── pages/                 # All page components
        └── styles/global.css      # Design system and component styles
```

---

## Prerequisites

- **Java 17 or higher** — [Download](https://adoptium.net/)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi) or install via Homebrew: `brew install maven`
- **MySQL 8+** — [Download](https://dev.mysql.com/downloads/) or install via Homebrew: `brew install mysql`
- **Node.js 18+** — [Download](https://nodejs.org/)

---

## How to Run

### 1. Start MySQL

Make sure MySQL is running on `localhost:3306`.

```bash
# macOS (Homebrew)
brew services start mysql

# Windows / Linux — start MySQL from Services or:
sudo systemctl start mysql
```

The app will **automatically create the database and all tables** on first run — you do not need to run any SQL scripts.

### 2. Configure the Database

Open `backend/src/main/resources/application.yml` and update the credentials to match your local MySQL setup:

```yaml
spring:
  datasource:
    username: root
    password: ""      # Leave blank if no password (Homebrew default)
```

### 3. Start the Backend

```bash
cd backend
mvn spring-boot:run
```

The backend starts on **http://localhost:8080**. You will see Hibernate SQL output confirming it connected to the database. On first boot, three demo user accounts are automatically created.

### 4. Start the Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend starts on **http://localhost:5173**.

### 5. Log In

Open **http://localhost:5173** in your browser. Use one of the demo accounts:

| Role | Email | Password |
|---|---|---|
| Admin | admin@warehouse.com | admin123 |
| Warehouse Staff | staff@warehouse.com | staff123 |
| Sales Staff | sales@warehouse.com | sales123 |

---

## Demo Walkthrough

Follow these steps to see the full system workflow after logging in as **Admin**:

1. **Add a Category** → `Categories` → Add Category (e.g. "Electronics")
2. **Add a Supplier** → `Suppliers` → Add Supplier (e.g. "Tech Supplies Co.")
3. **Add a Warehouse** → `Warehouses` → Add Warehouse (e.g. "Main Warehouse, Chicago IL")
4. **Add a Product** → `Products` → Add Product, select the category you just created
5. **Create a Purchase Order** → `Purchase Orders` → New Purchase Order
   - Select the supplier, add line items (product + quantity + unit cost)
   - Submit the order, then Receive it → stock is added to inventory automatically
6. **Check Inventory** → `Inventory` → the product now shows stock on hand
7. **Create a Customer Order** → `Customer Orders` → New Order
   - Enter customer info, add line items
   - Confirm the order, then Fulfill it → stock is deducted automatically
8. **View the Stock Log** → `Stock Log` → shows every stock movement with timestamps
9. **View Reports** → `Reports` → charts update with your real data

---

## API Overview

All endpoints are under `http://localhost:8080/api/`. Protected endpoints require an `Authorization: Bearer <token>` header.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Returns JWT token |
| GET | `/api/products` | All roles | List products |
| POST | `/api/products` | Admin | Create product |
| PUT | `/api/products/{id}` | Admin | Update product |
| GET | `/api/inventory` | All roles | List inventory |
| POST | `/api/inventory/adjust` | Admin, Warehouse | Adjust stock |
| POST | `/api/inventory/transfer` | Admin, Warehouse | Transfer between warehouses |
| GET | `/api/purchase-orders` | All roles | List purchase orders |
| POST | `/api/purchase-orders` | Admin, Warehouse | Create purchase order |
| POST | `/api/purchase-orders/{id}/receive` | Admin, Warehouse | Receive goods |
| GET | `/api/orders` | All roles | List customer orders |
| POST | `/api/orders` | All roles | Create customer order |
| POST | `/api/orders/{id}/fulfill` | All roles | Fulfill order |
| GET | `/api/users` | Admin | List users |
| POST | `/api/users` | Admin | Create user |
| PUT | `/api/profile/password` | All roles | Change own password |
| GET | `/api/reports/...` | All roles | Dashboard and reports data |

---

## Stopping the Application

```bash
# Stop both servers with Ctrl+C in each terminal
# Or kill them all at once:
pkill -f "spring-boot:run"; pkill -f "vite"
```

---

## Built With

This project was built as a school project demonstrating:
- Full-stack web application development
- RESTful API design
- Relational database design with JPA/Hibernate
- JWT authentication and role-based authorization
- React component architecture and state management
- UI/UX design principles (layout, consistency, content awareness, minimizing user effort)
