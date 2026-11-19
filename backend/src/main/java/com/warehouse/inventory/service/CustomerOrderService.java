package com.warehouse.inventory.service;

import com.warehouse.inventory.model.CustomerOrder;

import java.util.List;
import java.util.Map;

public interface CustomerOrderService {
    CustomerOrder createOrder(String customerName, String customerEmail, Map<Long, Integer> productQuantities);
    CustomerOrder confirmOrder(Long orderId);
    /** One pick: take {@code quantity} units of a product from a specific warehouse. */
    record Allocation(Long productId, Long warehouseId, int quantity) {}

    /** Fulfills the whole order from a single warehouse. */
    CustomerOrder fulfillOrder(Long orderId, Long warehouseId);

    /**
     * Fulfills the order by pulling stock from one or more warehouses.
     * The allocations for each product must add up exactly to that line item's quantity.
     */
    CustomerOrder fulfillOrder(Long orderId, List<Allocation> allocations);

    /**
     * Cancels the order. If it was already fulfilled, stock is returned to the warehouses
     * it was originally pulled from; {@code warehouseId} is only a fallback for orders
     * with no recorded fulfillment movements.
     */
    CustomerOrder cancelOrder(Long orderId, Long warehouseId);
    CustomerOrder getOrder(Long orderId);
    List<CustomerOrder> getAllOrders();
}
