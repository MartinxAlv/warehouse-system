package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.InventoryItem;
import com.warehouse.inventory.model.StockMovement;
import com.warehouse.inventory.repository.InventoryItemRepository;
import com.warehouse.inventory.repository.StockMovementRepository;
import com.warehouse.inventory.service.InventoryService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/inventory")
public class InventoryController {

    private final InventoryService inventoryService;
    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;

    public InventoryController(InventoryService inventoryService,
                                InventoryItemRepository inventoryItemRepository,
                                StockMovementRepository stockMovementRepository) {
        this.inventoryService = inventoryService;
        this.inventoryItemRepository = inventoryItemRepository;
        this.stockMovementRepository = stockMovementRepository;
    }

    @GetMapping
    public List<InventoryItem> getAll() {
        return inventoryItemRepository.findAll();
    }

    @GetMapping("/low-stock")
    public List<InventoryItem> getLowStock() {
        return inventoryService.getLowStockItems();
    }

    @PostMapping("/adjust")
    public InventoryItem adjustStock(@RequestBody Map<String, Object> body) {
        Long productId = ((Number) body.get("productId")).longValue();
        Long warehouseId = ((Number) body.get("warehouseId")).longValue();
        int delta = ((Number) body.get("delta")).intValue();
        String reason = (String) body.get("reason");
        return inventoryService.adjustStock(productId, warehouseId, delta, reason);
    }

    @PostMapping("/transfer")
    public void transferStock(@RequestBody Map<String, Object> body) {
        Long productId = ((Number) body.get("productId")).longValue();
        Long fromWarehouseId = ((Number) body.get("fromWarehouseId")).longValue();
        Long toWarehouseId = ((Number) body.get("toWarehouseId")).longValue();
        int quantity = ((Number) body.get("quantity")).intValue();
        inventoryService.transferStock(productId, fromWarehouseId, toWarehouseId, quantity);
    }

    @GetMapping("/movements")
    public List<StockMovement> getMovements(@RequestParam(required = false) Long productId,
                                             @RequestParam(required = false) Long warehouseId) {
        if (productId != null) {
            return stockMovementRepository.findByProductIdOrderByTimestampDesc(productId);
        }
        if (warehouseId != null) {
            return stockMovementRepository.findByWarehouseIdOrderByTimestampDesc(warehouseId);
        }
        return stockMovementRepository.findAll();
    }
}
