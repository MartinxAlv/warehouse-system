# Class Diagram (Java Problem-Domain Layer)

This reflects the core `model` package — the domain entities and how they relate.
Services (`ProductService`, `InventoryService`, `PurchaseOrderService`,
`CustomerOrderService`, `UserService`) sit on top of these and contain the business
rules described in the functional requirements.

```mermaid
classDiagram
    class User {
        -Long id
        -String fullName
        -String email
        -String passwordHash
        -Role role
        -boolean active
        +getFullName() String
    }

    class Role {
        <<enumeration>>
        ADMIN
        WAREHOUSE_STAFF
        SALES_STAFF
    }

    class Category {
        -Long id
        -String name
        -String description
    }

    class Product {
        -Long id
        -String sku
        -String name
        -String description
        -BigDecimal price
        -int reorderThreshold
        -boolean active
        -Category category
    }

    class Supplier {
        -Long id
        -String name
        -String contactEmail
        -String phone
        -String address
    }

    class ProductSupplier {
        -Long id
        -Product product
        -Supplier supplier
        -BigDecimal supplierUnitCost
    }

    class Warehouse {
        -Long id
        -String name
        -String location
    }

    class InventoryItem {
        -Long id
        -Product product
        -Warehouse warehouse
        -int quantityOnHand
        -String binLocation
        +isLowStock() boolean
    }

    class StockMovement {
        -Long id
        -Product product
        -Warehouse warehouse
        -int quantityChange
        -MovementType type
        -String reason
        -LocalDateTime timestamp
        -String referenceId
    }

    class MovementType {
        <<enumeration>>
        PURCHASE_RECEIVED
        SALE_FULFILLED
        MANUAL_ADJUSTMENT
        TRANSFER_IN
        TRANSFER_OUT
        RETURN
    }

    class PurchaseOrder {
        -Long id
        -Supplier supplier
        -PurchaseOrderStatus status
        -LocalDateTime createdAt
        -List~PurchaseOrderItem~ items
        +getTotalCost() BigDecimal
    }

    class PurchaseOrderStatus {
        <<enumeration>>
        DRAFT
        SUBMITTED
        PARTIALLY_RECEIVED
        RECEIVED
        CANCELLED
    }

    class PurchaseOrderItem {
        -Long id
        -Product product
        -int quantityOrdered
        -int quantityReceived
        -BigDecimal unitCost
    }

    class CustomerOrder {
        -Long id
        -String customerName
        -String customerEmail
        -OrderStatus status
        -LocalDateTime createdAt
        -List~OrderItem~ items
        +getTotalAmount() BigDecimal
    }

    class OrderStatus {
        <<enumeration>>
        PENDING
        CONFIRMED
        FULFILLED
        CANCELLED
    }

    class OrderItem {
        -Long id
        -Product product
        -int quantity
        -BigDecimal unitPrice
    }

    class AppLog {
        -Long id
        -LocalDateTime timestamp
        -String level
        -String message
        -String context
        -String triggeredBy
    }

    class AppLogService {
        +error(message, context) void
        +warn(message, context) void
        +info(message, context) void
        +getLogs() List~AppLog~
    }

    class InventoryService {
        +adjustStock(productId, warehouseId, delta, reason) InventoryItem
        +transferStock(productId, fromWarehouseId, toWarehouseId, qty) void
        +getLowStockItems() List~InventoryItem~
        +checkAvailability(productId, qty) boolean
    }

    class PurchaseOrderService {
        +createOrder(supplierId, items) PurchaseOrder
        +submitOrder(orderId) PurchaseOrder
        +receiveShipment(orderId, receivedItems) PurchaseOrder
    }

    class CustomerOrderService {
        +createOrder(customerInfo, items) CustomerOrder
        +confirmOrder(orderId) CustomerOrder
        +fulfillOrder(orderId) CustomerOrder
        +cancelOrder(orderId) CustomerOrder
    }

    User "1" --> "1" Role
    Product "many" --> "1" Category
    Product "1" --> "many" ProductSupplier
    Supplier "1" --> "many" ProductSupplier
    Product "1" --> "many" InventoryItem
    Warehouse "1" --> "many" InventoryItem
    Product "1" --> "many" StockMovement
    Warehouse "1" --> "many" StockMovement
    StockMovement "many" --> "1" MovementType
    PurchaseOrder "1" --> "many" PurchaseOrderItem
    PurchaseOrder "many" --> "1" Supplier
    PurchaseOrder "many" --> "1" PurchaseOrderStatus
    PurchaseOrderItem "many" --> "1" Product
    CustomerOrder "1" --> "many" OrderItem
    CustomerOrder "many" --> "1" OrderStatus
    OrderItem "many" --> "1" Product
    AppLogService ..> AppLog : creates
    InventoryService ..> InventoryItem : manages
    InventoryService ..> StockMovement : creates
    PurchaseOrderService ..> PurchaseOrder : manages
    PurchaseOrderService ..> InventoryService : uses
    CustomerOrderService ..> CustomerOrder : manages
    CustomerOrderService ..> InventoryService : uses
```

**Key design decisions:**
- `InventoryItem` and `StockMovement` are deliberately separate: `InventoryItem` is
  the current snapshot (fast to query), `StockMovement` is the append-only audit log
  (never updated, only inserted).
- `InventoryService` is the single choke point through which all quantity changes must
  flow — `PurchaseOrderService` and `CustomerOrderService` both delegate to it rather
  than touching `InventoryItem` directly. This enforces FR13.
