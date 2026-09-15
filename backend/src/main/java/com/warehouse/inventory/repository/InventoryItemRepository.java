package com.warehouse.inventory.repository;

import com.warehouse.inventory.model.InventoryItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface InventoryItemRepository extends JpaRepository<InventoryItem, Long> {
    Optional<InventoryItem> findByProductIdAndWarehouseId(Long productId, Long warehouseId);
    List<InventoryItem> findByProductId(Long productId);
    List<InventoryItem> findByWarehouseId(Long warehouseId);
}
