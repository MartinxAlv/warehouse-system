package com.warehouse.inventory.repository;

import com.warehouse.inventory.model.PurchaseOrder;
import com.warehouse.inventory.model.PurchaseOrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface PurchaseOrderRepository extends JpaRepository<PurchaseOrder, Long> {
    List<PurchaseOrder> findByStatus(PurchaseOrderStatus status);
}
