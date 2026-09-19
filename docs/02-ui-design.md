# User Interface Layout / Design

## Navigation Structure

```
┌──────────────────────────────────────────────────────────┐
│  ▐▐▐  Stockwell    │                                      │
│  ─────────────     │                                      │
│  Navigation        │         Main Content Area            │
│  > Dashboard       │                                      │
│  > Products        │                                      │
│  > Inventory       │                                      │
│  > Stock Log       │                                      │
│  > Purchase Orders │                                      │
│  > Customer Orders │                                      │
│  > Suppliers       │                                      │
│  > Warehouses      │                                      │
│  > Reports         │                                      │
│  > Categories*     │                                      │
│  > Users*          │                                      │
│  > System Log*     │                                      │
│  ─────────────     │                                      │
│  [A] Admin    ↩    │                                      │
└──────────────────────────────────────────────────────────┘
  * Admin only
```

All authenticated pages share this shell: a fixed left sidebar for navigation, and a
main content area that scrolls independently. The sidebar collapses to icon-only mode
to maximise screen space.

## Sidebar Behaviour

- Expanded (default): shows brand mark + "Stockwell", section label, nav item icons +
  labels, user avatar + name + role badge + sign-out button.
- Collapsed: hides all text labels; shows only icons centred in the 60px rail. The
  brand mark stays visible. The user avatar and sign-out icon are stacked vertically
  at the bottom of the sidebar.
- Collapse toggle: chevron button at the top-right of the brand area.
- Preference is saved in `localStorage` and restored on next load.
- Smooth width transition via CSS variable `--sidebar-width`.

## Screens

### 1. Login
- Brand mark + "Stockwell" title centred above the form.
- Email + password fields, "Sign in" button, error banner on failure.
- Three one-click demo account buttons (Admin, Warehouse Staff, Sales Staff) that
  pre-fill the form — for easy demoing.

### 2. Dashboard (landing page after login)
- Personalised welcome banner ("Good morning, Alex") using the logged-in user's name
  and time of day.
- **KPI cards** across the top: Total Inventory Lines, Total Units in Stock, Low Stock
  Items, Total Customer Orders.
- **Low Stock Alert table**: product, current qty, reorder threshold, warehouse.
- **Recent Activity feed**: latest stock movements (type, product, qty, timestamp).

### 3. Products
- Table: SKU, Name, Category, Price, Reorder At, Status (Active/Inactive), actions.
- Search bar filters by name or SKU inline; category dropdown filters by category.
- **Show inactive** toggle button *(Admin only)* — when on, fetches all products
  including deactivated ones. Inactive rows appear dimmed with a grey "Inactive" badge.
  Active products show Edit + Deactivate buttons; inactive products show a Reactivate
  button instead.
- "Add Product" opens a modal: name, SKU, category dropdown, price, description,
  reorder threshold.
- Deactivated products are soft-deleted (the `active` flag is set to false, the row is
  kept in the database) so historical order and stock data is always preserved.

### 4. Inventory
- Table: Product, Warehouse, **Bin Location**, Quantity on Hand, Status (OK/Low/Out),
  Actions.
- **Bin Location cell** *(Admin + Warehouse Staff only)*: shows the bin address with a
  map-pin icon; clicking it opens an inline edit modal to update the text. Unset
  locations show "Set location" in muted text. Sales Staff see the bin address as
  read-only text with no edit affordance.
- **Actions per row**: "Adjust" *(Admin + Warehouse Staff only)* opens the stock
  adjustment modal. Printer icon opens the **QR Product Label** modal (all roles).
- **Transfer Stock** button in page header *(Admin + Warehouse Staff only)* opens a
  modal: product, from-warehouse, to-warehouse, quantity.

### 5. QR Product Label (modal, printable)
- Opens from the printer icon on any Inventory row.
- Shows a preview label card: brand mark + "Stockwell" header, QR code (encodes the
  product SKU), product name, SKU chip, bin location, warehouse name.
- "Print Label" button triggers `window.print()` — a `@media print` rule hides
  everything except the label card so it prints cleanly at sticker size.

### 6. Stock Movement Log
- Full audit table: Movement Type, Product, Warehouse, Qty Change, Reason, Reference
  (order ID), Timestamp.
- Read-only — no actions. Every stock change in the system appears here.

### 7. Purchase Orders
- List view with status badges (Draft / Submitted / Received / Cancelled).
- "New Purchase Order" modal: pick supplier, add line items (product + qty + unit
  cost), submit.
- Expand a row to see line items and status action buttons. Buttons are disabled/
  greyed out when not applicable to the current status.

### 8. Customer Orders
- List view with status badges (Pending / Confirmed / Fulfilled / Cancelled).
- "New Order" modal: customer name + email, add line items (product + qty).
- Expand a row to see line items, totals, and status action buttons.

### 9. Suppliers
- Table: Name, Email, Phone, Address, Status. Edit modal per row.

### 10. Warehouses
- Cards per warehouse showing name and address.
- Expanding a card shows a live inventory breakdown: product, qty, status badge.

### 11. Reports
- KPI summary row (same as Dashboard).
- Stock levels bar chart per product, colour-coded by health (green / amber / red).
- Purchase order status doughnut chart.
- Customer order status doughnut chart.
- Order value summary panel.

### 12. Categories (Admin only)
- Table: Name, Description. Add / Edit modal.

### 13. Users (Admin only)
- Table: Name, Email, Role badge, Active status. Add / Edit / Deactivate per row.
- **Admin Tools** panel at the bottom: Load Sample Data / Clear All Data buttons with
  a status badge showing whether sample data is currently loaded.

### 14. System Log (Admin only)
- Table: Timestamp, Level badge (ERROR = red, WARN = amber, INFO = blue), Message,
  Context (which endpoint or action triggered it), Triggered By (username).
- Read-only — no actions. New entries appear automatically on the next page load.
- Populated by the backend whenever a business rule violation or unexpected error
  occurs, and whenever an Admin performs a significant action (seed/clear data).

### 15. Profile (all users)
- **Account Information** panel: full name, email, role badge.
- **Change Password** panel: current password + new password form.
- **Appearance** panel: Dark Mode toggle button (On / Off). Preference saved in
  `localStorage` and applied via `data-theme="dark"` on `<html>`.

## Visual / Interaction Notes

- Status is always shown as a coloured badge (green = OK / Received / Fulfilled,
  amber = Low / Pending / Submitted, red = Out of Stock / Cancelled).
- Every destructive action (deactivate user, cancel order, clear data) requires a
  confirm dialog.
- Toast notifications appear bottom-right on successful create / update / delete.
- Tables use zebra striping (alternating row tint) for easier scanning.
- Every action button has a `title` tooltip.
- Forms validate client-side (required fields, numeric ranges) and surface server
  errors inline.
- **Dark mode**: full dark colour scheme toggled from Profile → Appearance. All
  panels, tables, modals, inputs, badges, and the sidebar adapt via CSS custom
  property overrides under `[data-theme="dark"]`.
