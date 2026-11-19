package com.warehouse.inventory.service.impl;

import com.warehouse.inventory.exception.InsufficientStockException;
import com.warehouse.inventory.exception.InvalidOrderStateException;
import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.model.*;
import com.warehouse.inventory.repository.CustomerOrderRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.repository.StockMovementRepository;
import com.warehouse.inventory.service.CustomerOrderService;
import com.warehouse.inventory.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final StockMovementRepository stockMovementRepository;

    public CustomerOrderServiceImpl(CustomerOrderRepository customerOrderRepository,
                                     ProductRepository productRepository,
                                     InventoryService inventoryService,
                                     StockMovementRepository stockMovementRepository) {
        this.customerOrderRepository = customerOrderRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.stockMovementRepository = stockMovementRepository;
    }

    @Override
    @Transactional
    public CustomerOrder createOrder(String customerName, String customerEmail, Map<Long, Integer> productQuantities) {
        CustomerOrder order = new CustomerOrder();
        order.setCustomerName(customerName);
        order.setCustomerEmail(customerEmail);
        order.setStatus(OrderStatus.PENDING);

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + entry.getKey()));

            if (inventoryService.getTotalStock(product.getId()) < entry.getValue()) {
                throw new InsufficientStockException(
                        "Not enough stock for product '" + product.getName() + "' to place order");
            }

            OrderItem item = new OrderItem();
            item.setCustomerOrder(order);
            item.setProduct(product);
            item.setQuantity(entry.getValue());
            item.setUnitPrice(product.getPrice());
            order.getItems().add(item);
        }

        return customerOrderRepository.save(order);
    }

    @Override
    @Transactional
    public CustomerOrder confirmOrder(Long orderId) {
        CustomerOrder order = getOrder(orderId);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException("Only PENDING orders can be confirmed");
        }
        order.setStatus(OrderStatus.CONFIRMED);
        return customerOrderRepository.save(order);
    }

    @Override
    @Transactional
    public CustomerOrder fulfillOrder(Long orderId, Long warehouseId) {
        CustomerOrder order = getOrder(orderId);
        List<Allocation> allocations = order.getItems().stream()
                .map(i -> new Allocation(i.getProduct().getId(), warehouseId, i.getQuantity()))
                .toList();
        return fulfillOrder(orderId, allocations);
    }

    @Override
    @Transactional
    public CustomerOrder fulfillOrder(Long orderId, List<Allocation> allocations) {
        CustomerOrder order = getOrder(orderId);
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidOrderStateException("Only CONFIRMED orders can be fulfilled");
        }
        if (allocations == null || allocations.isEmpty()) {
            throw new IllegalArgumentException("Choose at least one warehouse to fulfill from");
        }

        // What the order needs, per product
        Map<Long, OrderItem> itemsByProduct = new HashMap<>();
        for (OrderItem item : order.getItems()) {
            itemsByProduct.put(item.getProduct().getId(), item);
        }

        // Validate the allocations before touching any stock
        Map<Long, Integer> allocatedByProduct = new HashMap<>();
        for (Allocation a : allocations) {
            if (a.productId() == null || a.warehouseId() == null) {
                throw new IllegalArgumentException("Each allocation needs a productId and warehouseId");
            }
            if (a.quantity() <= 0) {
                throw new IllegalArgumentException("Allocation quantities must be greater than zero");
            }
            if (!itemsByProduct.containsKey(a.productId())) {
                throw new IllegalArgumentException("Product " + a.productId() + " is not part of order #" + orderId);
            }
            allocatedByProduct.merge(a.productId(), a.quantity(), Integer::sum);
        }
        for (OrderItem item : order.getItems()) {
            int allocated = allocatedByProduct.getOrDefault(item.getProduct().getId(), 0);
            if (allocated != item.getQuantity()) {
                throw new IllegalArgumentException("'" + item.getProduct().getName() + "' needs "
                        + item.getQuantity() + " units but " + allocated + " were allocated");
            }
        }

        // Pull the stock. applyMovement throws if a warehouse doesn't have enough,
        // which rolls back the whole transaction, so the order is all-or-nothing.
        for (Allocation a : allocations) {
            inventoryService.applyMovement(a.productId(), a.warehouseId(), -a.quantity(),
                    MovementType.SALE_FULFILLED, "Fulfilled order #" + order.getId(),
                    "ORDER-" + order.getId());
        }

        order.setStatus(OrderStatus.FULFILLED);
        return customerOrderRepository.save(order);
    }

    @Override
    @Transactional
    public CustomerOrder cancelOrder(Long orderId, Long warehouseId) {
        CustomerOrder order = getOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Order is already cancelled");
        }

        // If it was already fulfilled, restore the stock that was taken out (FR24),
        // putting each unit back in the warehouse it was originally pulled from.
        if (order.getStatus() == OrderStatus.FULFILLED) {
            String ref = "ORDER-" + order.getId();
            List<StockMovement> pulled = stockMovementRepository.findByReferenceIdAndType(ref, MovementType.SALE_FULFILLED);
            if (!pulled.isEmpty()) {
                for (StockMovement m : pulled) {
                    inventoryService.applyMovement(m.getProduct().getId(), m.getWarehouse().getId(),
                            -m.getQuantityChange(), MovementType.RETURN,
                            "Cancelled order #" + order.getId(), ref);
                }
            } else {
                if (warehouseId == null) {
                    throw new IllegalArgumentException("No fulfillment record found; specify a warehouse to return stock to");
                }
                for (OrderItem item : order.getItems()) {
                    inventoryService.applyMovement(item.getProduct().getId(), warehouseId, item.getQuantity(),
                            MovementType.RETURN, "Cancelled order #" + order.getId(), ref);
                }
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        return customerOrderRepository.save(order);
    }

    @Override
    public CustomerOrder getOrder(Long orderId) {
        return customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer order not found: " + orderId));
    }

    @Override
    public List<CustomerOrder> getAllOrders() {
        return customerOrderRepository.findAll();
    }
}
