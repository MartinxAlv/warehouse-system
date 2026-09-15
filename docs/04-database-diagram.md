# Database Diagram (MySQL)

```mermaid
erDiagram
    USERS {
        bigint id PK
        varchar full_name
        varchar email UK
        varchar password_hash
        varchar role
        boolean active
    }

    CATEGORIES {
        bigint id PK
        varchar name UK
        varchar description
    }

    PRODUCTS {
        bigint id PK
        varchar sku UK
        varchar name
        varchar description
        decimal price
        int reorder_threshold
        boolean active
        bigint category_id FK
    }

    SUPPLIERS {
        bigint id PK
        varchar name
        varchar contact_email
        varchar phone
        varchar address
    }

    PRODUCT_SUPPLIERS {
        bigint id PK
        bigint product_id FK
        bigint supplier_id FK
        decimal supplier_unit_cost
    }

    WAREHOUSES {
        bigint id PK
        varchar name
        varchar location
    }

    INVENTORY_ITEMS {
        bigint id PK
        bigint product_id FK
        bigint warehouse_id FK
        int quantity_on_hand
    }

    STOCK_MOVEMENTS {
        bigint id PK
        bigint product_id FK
        bigint warehouse_id FK
        int quantity_change
        varchar movement_type
        varchar reason
        varchar reference_id
        datetime timestamp
    }

    PURCHASE_ORDERS {
        bigint id PK
        bigint supplier_id FK
        varchar status
        datetime created_at
    }

    PURCHASE_ORDER_ITEMS {
        bigint id PK
        bigint purchase_order_id FK
        bigint product_id FK
        int quantity_ordered
        int quantity_received
        decimal unit_cost
    }

    CUSTOMER_ORDERS {
        bigint id PK
        varchar customer_name
        varchar customer_email
        varchar status
        datetime created_at
    }

    ORDER_ITEMS {
        bigint id PK
        bigint customer_order_id FK
        bigint product_id FK
        int quantity
        decimal unit_price
    }

    CATEGORIES ||--o{ PRODUCTS : "categorizes"
    PRODUCTS ||--o{ PRODUCT_SUPPLIERS : "supplied via"
    SUPPLIERS ||--o{ PRODUCT_SUPPLIERS : "supplies"
    PRODUCTS ||--o{ INVENTORY_ITEMS : "stocked as"
    WAREHOUSES ||--o{ INVENTORY_ITEMS : "holds"
    PRODUCTS ||--o{ STOCK_MOVEMENTS : "moves"
    WAREHOUSES ||--o{ STOCK_MOVEMENTS : "location of"
    SUPPLIERS ||--o{ PURCHASE_ORDERS : "receives"
    PURCHASE_ORDERS ||--o{ PURCHASE_ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ PURCHASE_ORDER_ITEMS : "ordered as"
    CUSTOMER_ORDERS ||--o{ ORDER_ITEMS : "contains"
    PRODUCTS ||--o{ ORDER_ITEMS : "sold as"
```

## Notes on Constraints
- `PRODUCTS.sku` and `CATEGORIES.name` are `UNIQUE`.
- `INVENTORY_ITEMS` has a composite unique constraint on `(product_id, warehouse_id)` —
  one row per product per warehouse.
- `STOCK_MOVEMENTS` is append-only (no UPDATE/DELETE in application code) — it's the
  audit trail; `reference_id` links back to the purchase order / customer order that
  triggered it, when applicable.
- All `FK` columns use `ON DELETE RESTRICT` except where a parent is meant to soft-delete
  (products/suppliers use an `active` flag rather than hard deletes, per FR8).
- See `backend/src/main/resources/schema.sql` for the literal DDL, and the JPA
  `@Entity` classes in `backend/.../model` for how Spring Data derives this schema.
