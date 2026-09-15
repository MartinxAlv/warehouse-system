package com.warehouse.inventory.service;

import com.warehouse.inventory.model.InventoryItem;
import com.warehouse.inventory.model.MovementType;

import java.util.List;

/**
 * Single choke point for every inventory quantity change in the system.
 * No other service or controller is allowed to touch InventoryItem.quantityOnHand
 * directly -- it always goes through here so that a StockMovement audit record
 * is guaranteed to be created alongside the change (FR13).
 */
public interface InventoryService {

    InventoryItem getOrCreate(Long productId, Long warehouseId);

    /**
     * Applies a signed quantity change (positive = add stock, negative = remove stock)
     * to a product's stock in a given warehouse, and records a StockMovement.
     * Throws InsufficientStockException if the change would drive quantity below zero.
     */
    InventoryItem applyMovement(Long productId, Long warehouseId, int quantityChange,
                                 MovementType type, String reason, String referenceId);

    /** Manual adjustment made by warehouse staff (damage, correction, loss, found stock). */
    InventoryItem adjustStock(Long productId, Long warehouseId, int delta, String reason);

    /** Moves stock from one warehouse to another as two linked movements. */
    void transferStock(Long productId, Long fromWarehouseId, Long toWarehouseId, int quantity);

    boolean isAvailable(Long productId, Long warehouseId, int requestedQuantity);

    int getTotalStock(Long productId);

    List<InventoryItem> getLowStockItems();
}
