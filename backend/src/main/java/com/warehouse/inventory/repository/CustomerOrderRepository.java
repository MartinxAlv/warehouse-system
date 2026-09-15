package com.warehouse.inventory.repository;

import com.warehouse.inventory.model.CustomerOrder;
import com.warehouse.inventory.model.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CustomerOrderRepository extends JpaRepository<CustomerOrder, Long> {
    List<CustomerOrder> findByStatus(OrderStatus status);
}
