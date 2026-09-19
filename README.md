# Stockwell — Warehouse Management System

A full-stack warehouse inventory management system built with **Spring Boot** (Java) and **React**. Supports role-based access control, purchase order workflows, customer order fulfillment, real-time stock tracking, bin location tracking, QR product labels, and reporting.

---

## Features

### Authentication & Access Control
- JWT-based login with secure token storage
- Three user roles with different permissions:
  - **Admin** — full access including user management, categories, admin tools, and system log
  - **Warehouse Staff** — inventory operations, purchase orders, stock adjustments
  - **Sales Staff** — customer orders only
- Demo accounts pre-seeded on first run

### Inventory Management
- Track stock levels per product per warehouse
- **Bin location tracking** — assign and update a physical bin address for every inventory line (e.g. "Aisle A · Row 1 · Bin 3")
- Adjust stock manually with a required reason (Damaged, Recount, Return, Theft, Expired, Restocked)
- Transfer stock between warehouses
- Low stock alerts based on configurable reorder thresholds
- Full audit trail — every stock change is logged in the Stock Movement Log

### QR Product Labels
- Print a physical label for any inventory item directly from the Inventory page
- Each label includes the product name, SKU (as a styled code), bin location, warehouse name, and a QR code encoding the SKU
- Print-ready — clicking Print shows only the label at a standard sticker size

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

### System Event Log (Admin only)
- Every business rule violation is automatically recorded: insufficient stock, invalid order state transitions, unexpected server errors
- Admin actions (load/clear sample data) are logged as INFO events
- Each entry captures: timestamp, severity level (ERROR / WARN / INFO), message, context, and the user who triggered it
- Viewable from the sidebar under System Log — read-only, newest first
- Sample log entries are included in the sample dataset so the page is never empty during a demo

### Profile & Appearance
- Every user can change their own password from the Profile page
- **Dark mode** toggle in Profile → Appearance — persists across sessions via localStorage
- Accessible by clicking your name in the sidebar

### UI/UX
- **Dark mode** — full dark color scheme across all pages, toggled from the Profile page
- **Collapsible sidebar** — collapse to icon-only mode to maximise screen space; preference is saved across sessions
- Custom SVG brand mark and feather-style icons throughout (no emoji)
- Zebra-striped table rows for easier reading
- Personalized welcome banner on the Dashboard
- Breadcrumb navigation on every page
- Toast notifications for successful actions
- Confirmation dialogs for all destructive actions
- Tooltips on every action button
- Timestamps on all orders and stock movements

---

## Tech Stack

| Layer | Technology |
|---|---|
| Backend | Java 17+, Spring Boot 3.3.4 |
| Security | Spring Security, JWT (JJWT 0.12.6) |
| Database ORM | Spring Data JPA / Hibernate |
| Database | MySQL 8+ |
| Frontend | React 18, React Router v6, Vite |
| QR Codes | qrcode.react |
| Styling | Custom CSS with CSS variables (no UI library) |
| Fonts | Inter (Google Fonts) |

---

## Project Structure

```
warehouse-system/
├── docs/
│   ├── 01-problem-domain-and-requirements.md
│   ├── 02-ui-design.md
│   ├── 03-class-diagram.md
│   └── 04-database-diagram.md
│
├── backend/
│   └── src/main/java/com/warehouse/inventory/
│       ├── config/                # CORS, Security (JWT), DataInitializer
│       ├── controller/            # REST endpoints (Auth, Products, Orders, Inventory, Admin, etc.)
│       ├── exception/             # Global exception handler
│       ├── model/                 # JPA entities (Product, InventoryItem, Order, User, etc.)
│       ├── repository/            # Spring Data JPA repositories
│       ├── security/              # JwtService, JwtAuthFilter, UserDetailsService
│       └── service/               # Business logic (InventoryService, SampleDataService, etc.)
│
└── frontend/
    └── src/
        ├── api/client.js          # Fetch wrapper with JWT header injection
        ├── components/            # Layout, Modal, ConfirmModal, BrandMark, ProductLabel, Icon
        ├── context/               # AuthContext, ToastContext
        ├── pages/                 # All page components
        └── styles/global.css      # Design system and component styles
```

---

## Prerequisites

- **Java 17 or higher** — [Download](https://adoptium.net/)
- **Maven 3.8+** — [Download](https://maven.apache.org/download.cgi) or via Homebrew: `brew install maven`
- **MySQL 8+** — [Download](https://dev.mysql.com/downloads/) or via Homebrew: `brew install mysql`
- **Node.js 18+** — [Download](https://nodejs.org/)

---

## How to Run

The system has three components that must all be running at the same time:

| Component | Runs on | What it does |
|---|---|---|
| MySQL | `localhost:3306` | Stores all data |
| Spring Boot backend | `http://localhost:8080` | REST API + business logic |
| React frontend (Vite) | `http://localhost:5173` | The browser UI |

You will need **three terminal windows** (or tabs) — one for the backend and one for the frontend. MySQL runs in the background.

---

### Step 1 — Start MySQL

MySQL must be running before the backend can start.

**macOS (Homebrew):**
```bash
brew services start mysql
```

**Linux:**
```bash
sudo systemctl start mysql
```

**Windows:**
Open the Start Menu, search for **"Services"**, find **MySQL**, and click **Start**. Or via Command Prompt (run as Administrator):
```cmd
net start mysql
```

To verify MySQL is running:
```bash
mysql -u root -p -e "SELECT 1;"
# Should print a result row — if it hangs or errors, MySQL is not running
```

> The app will **automatically create the `warehouse_inventory` database and all tables** on first run — no SQL scripts needed.

---

### Step 2 — Configure Database Credentials

Open [backend/src/main/resources/application.yml](backend/src/main/resources/application.yml) and update the `username` and `password` fields to match your local MySQL setup:

```yaml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/warehouse_inventory?createDatabaseIfNotExist=true&useSSL=false&serverTimezone=UTC
    username: root
    password: ""        # Leave blank if no password set (Homebrew default)
    driver-class-name: com.mysql.cj.jdbc.Driver
```

Only `username` and `password` need to change — leave the `url` and `driver-class-name` as-is.

> If you installed MySQL with a password, enter it here. If you're unsure, try leaving it blank first.

---

### Step 3 — Start the Backend

Open a terminal in the project root and run:

```bash
cd backend
mvn spring-boot:run
```

Wait until you see a line like:
```
Started InventoryApplication in 4.2 seconds
```

The backend is now running at **http://localhost:8080**. On first boot it automatically creates three demo user accounts.

> If you see `Port 8080 was already in use`, something else is on that port. Find and stop it:
> ```bash
> # macOS / Linux
> lsof -i :8080
> kill -9 <PID>
>
> # Windows
> netstat -ano | findstr :8080
> taskkill /PID <PID> /F
> ```

---

### Step 4 — Start the Frontend

Open a **second terminal** in the project root and run:

```bash
cd frontend
npm install       # Only needed the first time (installs dependencies)
npm run dev
```

Wait until you see:
```
  VITE ready in Xms
  ➜  Local: http://localhost:5173/
```

The frontend is now running at **http://localhost:5173**.

> `npm install` only needs to be run once (or again after pulling new changes that update `package.json`).

> If port 5173 is in use, Vite will automatically try 5174, 5175, etc. — check the terminal output for the actual URL.

---

### Step 5 — Open the App

Open **http://localhost:5173** in your browser and sign in with a demo account:

| Role | Email | Password |
|---|---|---|
| Admin | admin@warehouse.com | admin123 |
| Warehouse Staff | staff@warehouse.com | staff123 |
| Sales Staff | sales@warehouse.com | sales123 |

---

## Sample Data

The system includes a one-click sample dataset that populates a realistic business scenario so you can demo the full workflow immediately.

### How to load it

1. Log in as **Admin**
2. Go to **User Management** (sidebar)
3. Scroll to the **Admin Tools** panel at the bottom
4. Click **Load Sample Data**

A green **Data loaded** badge confirms the data is present. A grey **Empty** badge means the system is clean.

### What gets created

| Type | Count | Details |
|---|---|---|
| Categories | 4 | Cables & Adapters, Peripherals, Power & Charging, Audio & Video |
| Suppliers | 3 | AsiaLink Electronics, SwiftParts Co., ProGear Supplies |
| Warehouses | 3 | Main Warehouse (Chicago), East Coast Hub (New York), West Coast Depot (Los Angeles) |
| Products | 10 | USB-C Cable, HDMI Cable, 65W GaN Charger, 130W Laptop Charger, Wireless Mouse, Mechanical Keyboard, USB-C Hub, 1080p Webcam, Noise-Cancelling Headset, Laptop Stand |
| Purchase Orders | 9 | 6 Received, 2 Submitted, 1 Draft |
| Customer Orders | 15 | 7 Fulfilled, 3 Confirmed, 3 Pending, 2 Cancelled |
| Stock Movements | Full log | All PO receipts, sales, manual adjustments, and transfers |
| Bin Locations | 21 | Every inventory line has a pre-set bin address (e.g. "Aisle A · Row 1 · Bin 3") |
| System Log Entries | 6 | 3× INFO, 2× WARN, 1× ERROR — realistic examples across different timestamps |

Three inventory lines are intentionally set to **Low Stock** so the dashboard and reports show realistic alerts immediately.

### How to clear it

Click **Clear All Data** in the Admin Tools panel. This removes all products, orders, inventory, suppliers, warehouses, and categories. The three demo accounts are always preserved.

---

## Demo Walkthrough

After loading sample data, log in as **Admin** and explore:

1. **Dashboard** — welcome banner, low stock alerts, recent activity, KPI summary
2. **Inventory** — see bin locations per item, click any bin to edit it, print a QR label
3. **Reports** — live charts showing stock health, order status breakdowns, value summaries
4. **Purchase Orders** — view received/submitted/draft POs, create and receive a new one
5. **Customer Orders** — view the full fulfillment pipeline, create and fulfill an order
6. **Stock Log** — full timestamped audit trail of every stock movement
7. **System Log** — see the pre-seeded ERROR, WARN, and INFO entries; then trigger a real one by trying to over-fulfill an order
8. **Profile** — toggle dark mode under Appearance, change your password

Or follow the full manual workflow from scratch:

1. **Add a Category** → `Categories` → Add Category
2. **Add a Supplier** → `Suppliers` → Add Supplier
3. **Add a Warehouse** → `Warehouses` → Add Warehouse
4. **Add a Product** → `Products` → Add Product
5. **Receive Stock** → `Purchase Orders` → New PO → Submit → Receive
6. **Check Inventory** → `Inventory` → set a bin location, print a label
7. **Fulfill an Order** → `Customer Orders` → New Order → Confirm → Fulfill
8. **View the Log** → `Stock Log` → every movement with timestamps

---

## Real-World Usage

### Who Would Use This System?

This system is designed for **small to medium-sized businesses** that buy goods from suppliers, store them in one or more warehouses, and sell them to customers. Examples include:

- An **electronics distributor** importing components from manufacturers and shipping to retail stores
- A **clothing retailer** with a stockroom and an online shop
- A **wholesale food supplier** managing stock across multiple distribution centres
- A **school supply company** processing bulk orders from schools and universities

The system replaces spreadsheets and manual stock counts with a centralised, role-controlled platform that keeps inventory accurate in real time.

---

### How the Three Roles Work Day-to-Day

| Role | Typical Person | What They Do |
|---|---|---|
| **Admin** | Store / operations manager | Sets up products, categories, suppliers, warehouses; manages staff accounts; views all reports |
| **Warehouse Staff** | Warehouse operative | Receives shipments, adjusts stock for damage or miscounts, transfers stock, sets bin locations, prints labels |
| **Sales Staff** | Sales rep / customer service | Creates customer orders, confirms and fulfills them, checks stock availability |

---

### Real-World Example: Electronics Distributor

**The Company:** *BrightTech Supplies* imports cables, chargers, and accessories from two suppliers and ships to independent electronics shops. They run three warehouses — Chicago, New York, and Los Angeles.

#### Step 1 — Admin sets up the system
Creates warehouses, categories, suppliers, products, and staff accounts.

#### Step 2 — Warehouse Staff receives a shipment
Creates a purchase order, submits it, then receives the delivery — stock is added automatically. Bin locations are set for each item so pickers know exactly where to find them.

#### Step 3 — Sales Staff fulfills a customer order
Creates an order, confirms it with the customer, and fulfills it — stock is deducted automatically.

#### Step 4 — Warehouse Staff handles a discrepancy
During a stocktake, finds 3 damaged cables. Uses Inventory → Adjust → `-3` → reason: Damaged. The log records the change permanently.

#### Step 5 — Transfer stock between warehouses
Chicago is overstocked on chargers; New York is running low. Uses Inventory → Transfer Stock to move 20 units. Both movements are logged.

#### Step 6 — Print a product label
Before shelving a new shipment, the warehouse operative prints QR labels for each product. The label shows the product name, SKU, bin address, and a scannable QR code for quick lookup.

#### Step 7 — Manager reviews reports
Checks the Dashboard for low-stock alerts and opens Reports to see which products are near their reorder threshold. Raises a new purchase order before stock runs out.

---

### Why This Is Better Than a Spreadsheet

| Problem with Spreadsheets | How Stockwell Solves It |
|---|---|
| Anyone can change numbers without a record | Every stock change has a reason, a timestamp, and a log entry |
| No access control | Role-based access: sales staff cannot touch inventory settings |
| Stock doesn't update automatically | Receiving a PO or fulfilling an order updates stock instantly |
| Hard to track across multiple locations | Each warehouse has its own view; transfers are tracked end-to-end |
| No alerting when stock gets low | Reorder threshold badges highlight at-risk products everywhere |
| No physical location system | Bin locations stored per inventory line; QR labels for fast picking |
| Easy to lose supplier cost data | POs record unit costs and calculate totals automatically |

---

## API Overview

All endpoints are under `http://localhost:8080/api/`. Protected endpoints require `Authorization: Bearer <token>`.

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Returns JWT token |
| GET | `/products` | All | List products |
| POST | `/products` | Admin | Create product |
| PUT | `/products/{id}` | Admin | Update product |
| GET | `/inventory` | All | List inventory with bin locations |
| POST | `/inventory/adjust` | Admin, Warehouse | Manual stock adjustment |
| POST | `/inventory/transfer` | Admin, Warehouse | Transfer between warehouses |
| PATCH | `/inventory/{id}/location` | Admin, Warehouse | Update bin location |
| GET | `/inventory/movements` | All | Stock movement log |
| GET | `/purchase-orders` | All | List purchase orders |
| POST | `/purchase-orders` | Admin, Warehouse | Create purchase order |
| POST | `/purchase-orders/{id}/submit` | Admin, Warehouse | Submit order to supplier |
| POST | `/purchase-orders/{id}/receive` | Admin, Warehouse | Receive goods into warehouse |
| GET | `/orders` | All | List customer orders |
| POST | `/orders` | All | Create customer order |
| POST | `/orders/{id}/confirm` | All | Confirm order |
| POST | `/orders/{id}/fulfill` | All | Fulfill order and deduct stock |
| GET | `/users` | Admin | List users |
| POST | `/users` | Admin | Create user |
| PUT | `/users/{id}` | Admin | Update user |
| PUT | `/profile/password` | All | Change own password |
| GET | `/admin/sample-data/status` | Admin | Check if sample data is loaded |
| POST | `/admin/sample-data/seed` | Admin | Load sample data |
| DELETE | `/admin/sample-data/clear` | Admin | Clear all data |
| GET | `/admin/logs` | Admin | View system event log |

---

## Stopping the Application

### Stop the frontend and backend

Press `Ctrl+C` in each terminal window (the one running the backend, and the one running the frontend). That's all that's needed for normal use.

To kill both at once from a third terminal:

```bash
# macOS / Linux
pkill -f "spring-boot:run"
pkill -f "vite"

# Windows (Command Prompt)
taskkill /IM java.exe /F
taskkill /IM node.exe /F
```

### Stop MySQL

You only need to stop MySQL if you want to free up resources or shut down your machine cleanly.

**macOS (Homebrew):**
```bash
brew services stop mysql
```

**Linux:**
```bash
sudo systemctl stop mysql
```

**Windows:**
```cmd
net stop mysql
```

### Check nothing is still running

```bash
# Check if backend port is still occupied
lsof -i :8080      # macOS / Linux
netstat -ano | findstr :8080    # Windows

# Check if frontend port is still occupied
lsof -i :5173      # macOS / Linux
netstat -ano | findstr :5173    # Windows
```

---

## Built With

This project was built as a school project demonstrating:
- Full-stack web application development
- RESTful API design with Spring Boot
- Relational database design with JPA/Hibernate
- JWT authentication and role-based authorisation
- React component architecture and state management
- UI/UX design principles (layout, consistency, content awareness, minimising user effort)
- Physical warehouse operations (bin locations, QR labels, stock transfers)
