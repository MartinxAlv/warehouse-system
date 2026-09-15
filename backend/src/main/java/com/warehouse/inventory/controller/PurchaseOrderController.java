package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.PurchaseOrder;
import com.warehouse.inventory.service.PurchaseOrderService;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/purchase-orders")
public class PurchaseOrderController {

    private final PurchaseOrderService purchaseOrderService;

    public PurchaseOrderController(PurchaseOrderService purchaseOrderService) {
        this.purchaseOrderService = purchaseOrderService;
    }

    @GetMapping
    public List<PurchaseOrder> getAll() {
        return purchaseOrderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public PurchaseOrder getOne(@PathVariable Long id) {
        return purchaseOrderService.getOrder(id);
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public PurchaseOrder create(@RequestBody Map<String, Object> body) {
        Long supplierId = ((Number) body.get("supplierId")).longValue();
        List<Map<String, Object>> lines = (List<Map<String, Object>>) body.get("items");

        Map<Long, Integer> quantities = new HashMap<>();
        Map<Long, BigDecimal> costs = new HashMap<>();
        for (Map<String, Object> line : lines) {
            Long productId = ((Number) line.get("productId")).longValue();
            quantities.put(productId, ((Number) line.get("quantity")).intValue());
            costs.put(productId, new BigDecimal(line.get("unitCost").toString()));
        }
        return purchaseOrderService.createOrder(supplierId, quantities, costs);
    }

    @PostMapping("/{id}/submit")
    public PurchaseOrder submit(@PathVariable Long id) {
        return purchaseOrderService.submitOrder(id);
    }

    @PostMapping("/{id}/receive")
    public PurchaseOrder receive(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Long warehouseId = ((Number) body.get("warehouseId")).longValue();
        @SuppressWarnings("unchecked")
        Map<String, Object> rawReceived = (Map<String, Object>) body.get("receivedQuantitiesByItemId");
        Map<Long, Integer> received = new HashMap<>();
        rawReceived.forEach((k, v) -> received.put(Long.valueOf(k), ((Number) v).intValue()));
        return purchaseOrderService.receiveShipment(id, warehouseId, received);
    }

    @PostMapping("/{id}/cancel")
    public PurchaseOrder cancel(@PathVariable Long id) {
        return purchaseOrderService.cancelOrder(id);
    }
}
