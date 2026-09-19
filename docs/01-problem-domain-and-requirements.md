# Stockwell — Warehouse Management System

## 1. Problem Domain Description

Small and mid-sized online retailers struggle to keep their stock levels accurate across
purchasing, warehousing, and sales. Spreadsheets fall apart once more than one person
touches inventory: stock counts drift from reality, nobody notices a product is about to
run out until a customer order fails, and there's no single source of truth for what a
supplier delivered versus what was actually put on the shelf.

This system gives a small business one place to manage:

- **Products** they sell (SKU, name, description, price, category)
- **Suppliers** they buy stock from
- **Warehouses / storage locations** where stock physically sits
- **Inventory levels** per product per warehouse, updated automatically whenever stock
  moves in or out
- **Bin locations** — the physical shelf address of each product within a warehouse
  (e.g. "Aisle A · Row 1 · Bin 3"), so warehouse staff can find and pick items quickly
- **Purchase orders** placed with suppliers to restock
- **Customer orders** (the eCommerce side) that consume stock when fulfilled
- **Stock movement history** — a full audit trail of every unit that entered or left
  inventory, and why
- **Users** with different roles (Admin, Warehouse Staff, Sales Staff) who interact with
  the system differently

The core domain rule the whole system is built around: **inventory quantity must never
be edited directly.** It only ever changes as the *result* of a recorded event — a
purchase order being received, a customer order being fulfilled, a manual stock
adjustment (e.g. damaged goods), or a transfer between warehouses. This is what makes
the stock movement audit trail meaningful, and it's the main piece of business logic
the Java layer is responsible for enforcing.

## 2. Actors

| Actor | Description |
|---|---|
| **Admin** | Full access: manages users, products, categories, suppliers, warehouses, views all reports |
| **Warehouse Staff** | Receives purchase orders, records stock adjustments, transfers stock between warehouses |
| **Sales Staff** | Creates and manages customer orders, views product availability |
| **Customer** *(optional/stretch)* | Browses products and places orders through a storefront view |

## 3. Functional Requirements

### 3.1 Authentication & Users
- FR1: The system shall allow a user to log in with a username/email and password.
- FR2: The system shall support role-based access (Admin, Warehouse Staff, Sales Staff).
- FR3: An Admin shall be able to create, edit, deactivate, and delete user accounts.

### 3.2 Product & Category Management
- FR4: The system shall allow Admins to create, edit, and deactivate products.
- FR5: Each product shall belong to exactly one category.
- FR6: The system shall allow Admins to manage categories (create/edit/delete).
- FR7: Each product shall have a unique SKU, generated or entered on creation.
- FR8: The system shall prevent deleting a product that has existing order or stock history (soft delete / deactivate instead).

### 3.3 Supplier Management
- FR9: The system shall allow Admins to create, edit, and deactivate suppliers.
- FR10: The system shall associate products with one or more suppliers.

### 3.4 Warehouse & Inventory
- FR11: The system shall support multiple warehouses/storage locations.
- FR12: The system shall track quantity on hand per product, per warehouse.
- FR13: The system shall automatically recalculate inventory whenever a stock movement is recorded — inventory is never edited directly by a user.
- FR14: The system shall allow Warehouse Staff to record manual stock adjustments (damage, loss, correction) with a required reason code.
- FR15: The system shall allow stock transfers between two warehouses, decrementing one and incrementing the other atomically.
- FR16: The system shall flag products that fall below their defined reorder threshold.
- FR16b: The system shall allow Warehouse Staff to record a bin location (physical shelf address) per inventory line, and update it at any time.
- FR16c: The system shall allow a printable QR product label to be generated for any inventory item, showing the product name, SKU, bin location, warehouse, and a QR code encoding the SKU.

### 3.5 Purchase Orders (restocking from suppliers)
- FR17: The system shall allow Warehouse/Admin staff to create a purchase order for one or more products from a supplier.
- FR18: The system shall support purchase order statuses: DRAFT → SUBMITTED → PARTIALLY_RECEIVED → RECEIVED → CANCELLED.
- FR19: Receiving a purchase order (in full or in part) shall automatically increase inventory and create a corresponding stock movement record.

### 3.6 Customer Orders (eCommerce sales side)
- FR20: The system shall allow Sales Staff to create a customer order containing one or more line items.
- FR21: The system shall check available inventory before confirming an order and reject/flag items that are out of stock.
- FR22: Confirming/fulfilling an order shall automatically decrease inventory and create a corresponding stock movement record.
- FR23: The system shall support order statuses: PENDING → CONFIRMED → FULFILLED → CANCELLED.
- FR24: Cancelling a fulfilled order shall restore inventory (return-to-stock).

### 3.7 Reporting / Dashboard
- FR25: The system shall display a dashboard with: total products, low-stock alerts, pending purchase orders, and recent order activity.
- FR26: The system shall allow filtering/searching products by name, SKU, category, and stock status.
- FR27: The system shall provide a stock movement history report, filterable by product, warehouse, and date range.

### 3.8 System Event Log
- FR28: The system shall record a log entry whenever a business rule violation occurs (e.g. insufficient stock, invalid order state transition) or an unexpected server error is thrown.
- FR29: The system shall record a log entry for significant Admin actions (load sample data, clear all data).
- FR30: Each log entry shall capture: timestamp, severity level (ERROR / WARN / INFO), message, context, and the username of the user who triggered it.
- FR31: The system log shall be visible to Admin users only and displayed in reverse chronological order.

## 4. Non-Functional Requirements

- NFR1: The problem-domain/business logic layer shall be implemented in **Java** (Spring Boot).
- NFR2: Data shall be persisted in a relational database (**MySQL**).
- NFR3: The front end shall be a **React** single-page application communicating with the backend over a REST API (JSON).
- NFR4: The backend shall expose REST endpoints secured by role-based access.
- NFR5: The system shall validate input at both the API layer and the database layer (constraints, not-null, foreign keys).
- NFR6: All monetary values shall be stored with fixed-point precision (not floating point).
