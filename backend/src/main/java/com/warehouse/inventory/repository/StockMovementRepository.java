package com.warehouse.inventory.repository;

import com.warehouse.inventory.model.StockMovement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface StockMovementRepository extends JpaRepository<StockMovement, Long> {
    List<StockMovement> findByProductIdOrderByTimestampDesc(Long productId);
    List<StockMovement> findByWarehouseIdOrderByTimestampDesc(Long warehouseId);
    List<StockMovement> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
}
