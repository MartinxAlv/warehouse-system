package com.warehouse.inventory.repository;

import com.warehouse.inventory.model.AppLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AppLogRepository extends JpaRepository<AppLog, Long> {
    List<AppLog> findAllByOrderByTimestampDesc();
}
