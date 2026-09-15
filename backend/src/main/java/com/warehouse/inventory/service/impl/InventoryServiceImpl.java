package com.warehouse.inventory.service.impl;

import com.warehouse.inventory.exception.InsufficientStockException;
import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.model.*;
import com.warehouse.inventory.repository.InventoryItemRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.repository.StockMovementRepository;
import com.warehouse.inventory.repository.WarehouseRepository;
import com.warehouse.inventory.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class InventoryServiceImpl implements InventoryService {

    private final InventoryItemRepository inventoryItemRepository;
    private final StockMovementRepository stockMovementRepository;
    private final ProductRepository productRepository;
    private final WarehouseRepository warehouseRepository;

    public InventoryServiceImpl(InventoryItemRepository inventoryItemRepository,
                                 StockMovementRepository stockMovementRepository,
                                 ProductRepository productRepository,
                                 WarehouseRepository warehouseRepository) {
        this.inventoryItemRepository = inventoryItemRepository;
        this.stockMovementRepository = stockMovementRepository;
        this.productRepository = productRepository;
        this.warehouseRepository = warehouseRepository;
    }

    @Override
    @Transactional
    public InventoryItem getOrCreate(Long productId, Long warehouseId) {
        return inventoryItemRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .orElseGet(() -> {
                    Product product = productRepository.findById(productId)
                            .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
                    Warehouse warehouse = warehouseRepository.findById(warehouseId)
                            .orElseThrow(() -> new ResourceNotFoundException("Warehouse not found: " + warehouseId));
                    InventoryItem item = new InventoryItem();
                    item.setProduct(product);
                    item.setWarehouse(warehouse);
                    item.setQuantityOnHand(0);
                    return inventoryItemRepository.save(item);
                });
    }

    @Override
    @Transactional
    public InventoryItem applyMovement(Long productId, Long warehouseId, int quantityChange,
                                        MovementType type, String reason, String referenceId) {
        InventoryItem item = getOrCreate(productId, warehouseId);

        int newQuantity = item.getQuantityOnHand() + quantityChange;
        if (newQuantity < 0) {
            throw new InsufficientStockException(
                    "Insufficient stock for product " + productId + " in warehouse " + warehouseId +
                    ": have " + item.getQuantityOnHand() + ", requested change " + quantityChange);
        }

        item.setQuantityOnHand(newQuantity);
        inventoryItemRepository.save(item);

        StockMovement movement = new StockMovement();
        movement.setProduct(item.getProduct());
        movement.setWarehouse(item.getWarehouse());
        movement.setQuantityChange(quantityChange);
        movement.setType(type);
        movement.setReason(reason);
        movement.setReferenceId(referenceId);
        stockMovementRepository.save(movement);

        return item;
    }

    @Override
    @Transactional
    public InventoryItem adjustStock(Long productId, Long warehouseId, int delta, String reason) {
        return applyMovement(productId, warehouseId, delta, MovementType.MANUAL_ADJUSTMENT, reason, null);
    }

    @Override
    @Transactional
    public void transferStock(Long productId, Long fromWarehouseId, Long toWarehouseId, int quantity) {
        if (quantity <= 0) {
            throw new IllegalArgumentException("Transfer quantity must be positive");
        }
        String ref = "TRANSFER-" + productId + "-" + System.currentTimeMillis();
        applyMovement(productId, fromWarehouseId, -quantity, MovementType.TRANSFER_OUT,
                "Transfer to warehouse " + toWarehouseId, ref);
        applyMovement(productId, toWarehouseId, quantity, MovementType.TRANSFER_IN,
                "Transfer from warehouse " + fromWarehouseId, ref);
    }

    @Override
    public boolean isAvailable(Long productId, Long warehouseId, int requestedQuantity) {
        return inventoryItemRepository.findByProductIdAndWarehouseId(productId, warehouseId)
                .map(i -> i.getQuantityOnHand() >= requestedQuantity)
                .orElse(requestedQuantity <= 0);
    }

    @Override
    public int getTotalStock(Long productId) {
        return inventoryItemRepository.findByProductId(productId).stream()
                .mapToInt(InventoryItem::getQuantityOnHand)
                .sum();
    }

    @Override
    public List<InventoryItem> getLowStockItems() {
        return inventoryItemRepository.findAll().stream()
                .filter(InventoryItem::isLowStock)
                .toList();
    }
}
