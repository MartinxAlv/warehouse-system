package com.warehouse.inventory.service;

import com.warehouse.inventory.model.CustomerOrder;

import java.util.List;
import java.util.Map;

public interface CustomerOrderService {
    CustomerOrder createOrder(String customerName, String customerEmail, Map<Long, Integer> productQuantities);
    CustomerOrder confirmOrder(Long orderId);
    CustomerOrder fulfillOrder(Long orderId, Long warehouseId);
    CustomerOrder cancelOrder(Long orderId, Long warehouseId);
    CustomerOrder getOrder(Long orderId);
    List<CustomerOrder> getAllOrders();
}
