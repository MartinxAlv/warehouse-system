package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.OrderStatus;
import com.warehouse.inventory.model.PurchaseOrderStatus;
import com.warehouse.inventory.repository.*;
import com.warehouse.inventory.service.InventoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final ProductRepository productRepository;
    private final InventoryService inventoryService;
    private final PurchaseOrderRepository purchaseOrderRepository;
    private final CustomerOrderRepository customerOrderRepository;

    public DashboardController(ProductRepository productRepository, InventoryService inventoryService,
                                PurchaseOrderRepository purchaseOrderRepository,
                                CustomerOrderRepository customerOrderRepository) {
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.customerOrderRepository = customerOrderRepository;
    }

    @GetMapping("/summary")
    public Map<String, Object> summary() {
        Map<String, Object> summary = new HashMap<>();
        summary.put("totalProducts", productRepository.count());
        summary.put("lowStockCount", inventoryService.getLowStockItems().size());
        summary.put("pendingPurchaseOrders",
                purchaseOrderRepository.findByStatus(PurchaseOrderStatus.SUBMITTED).size());
        summary.put("pendingCustomerOrders",
                customerOrderRepository.findByStatus(OrderStatus.PENDING).size());
        return summary;
    }
}
