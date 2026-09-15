# User Interface Layout / Design

## Navigation Structure

```
┌─────────────────────────────────────────────────────────────┐
│  LOGO   Dashboard  Products  Inventory  Orders  Suppliers    │   <- Top Nav
│                                          Users   [👤 Admin ▾] │
├───────────┬─────────────────────────────────────────────────┤
│  Sidebar  │                                                  │
│  (context │                Main Content Area                 │
│  filters) │                                                  │
│           │                                                  │
└───────────┴─────────────────────────────────────────────────┘
```

All authenticated pages share this shell: a top nav bar for primary navigation + user
menu, and a main content area. Some pages (Products, Inventory) add a left filter
sidebar.

## Screens

### 1. Login
- Email/username + password fields, "Sign in" button, error banner on failure.

### 2. Dashboard (landing page after login)
- **KPI cards** across the top: Total Products, Low Stock Items, Pending Purchase
  Orders, Orders Today.
- **Low Stock Alert table**: product, current qty, reorder threshold, warehouse — with
  a "Create Purchase Order" quick action.
- **Recent Activity feed**: latest stock movements and order status changes.

### 3. Products
- Table view: SKU, Name, Category, Price, Total Stock, Status, actions (Edit/Deactivate).
- Search bar + filters (category, stock status) in left sidebar.
- "Add Product" opens a modal/form: name, SKU, category dropdown, price, description,
  reorder threshold, supplier(s).
- Clicking a product opens a **Product Detail** page showing per-warehouse stock
  breakdown and its movement history.

### 4. Inventory
- Table: Product, Warehouse, Quantity on Hand, Reorder Threshold, Status (OK/Low/Out).
- Actions: "Adjust Stock" (opens modal: +/- quantity, reason code, notes) and
  "Transfer Stock" (opens modal: from warehouse, to warehouse, quantity).
- Filter sidebar by warehouse and stock status.

### 5. Purchase Orders
- List view with status badges (Draft/Submitted/Partially Received/Received/Cancelled).
- "New Purchase Order" form: pick supplier, add line items (product + quantity + unit
  cost), submit.
- Detail page: line items with received-quantity input per line, "Receive Shipment"
  action that updates inventory.

### 6. Customer Orders
- List view with status badges (Pending/Confirmed/Fulfilled/Cancelled).
- "New Order" form: customer info, add line items (product + quantity), live stock
  availability check per line.
- Detail page: line items, status timeline, "Fulfill Order" / "Cancel Order" actions.

### 7. Suppliers & Warehouses (Admin)
- Simple CRUD table views, same pattern as Products.

### 8. Users (Admin only)
- CRUD table: name, email, role, active status.

## Visual/Interaction Notes
- Status is always shown as a colored badge (green = OK/Received/Fulfilled, amber =
  Low/Pending/Submitted, red = Out of stock/Cancelled).
- Every destructive action (deactivate, cancel order) requires a confirm dialog.
- Tables are paginated and sortable by column header click.
- Forms validate client-side (required fields, numeric ranges) and surface server
  validation errors inline under the relevant field.
