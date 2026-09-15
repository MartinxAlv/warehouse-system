package com.warehouse.inventory.service;

import com.warehouse.inventory.model.PurchaseOrder;

import java.util.List;
import java.util.Map;

public interface PurchaseOrderService {
    PurchaseOrder createOrder(Long supplierId, Map<Long, Integer> productQuantities, Map<Long, java.math.BigDecimal> unitCosts);
    PurchaseOrder submitOrder(Long orderId);
    PurchaseOrder receiveShipment(Long orderId, Long warehouseId, Map<Long, Integer> receivedQuantitiesByPoItemId);
    PurchaseOrder cancelOrder(Long orderId);
    PurchaseOrder getOrder(Long orderId);
    List<PurchaseOrder> getAllOrders();
}
