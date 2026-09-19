package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.AppLog;
import com.warehouse.inventory.service.AppLogService;
import com.warehouse.inventory.service.SampleDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SampleDataService sampleDataService;
    private final AppLogService appLogService;

    public AdminController(SampleDataService sampleDataService, AppLogService appLogService) {
        this.sampleDataService = sampleDataService;
        this.appLogService = appLogService;
    }

    @GetMapping("/sample-data/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        return ResponseEntity.ok(Map.of("loaded", sampleDataService.isLoaded()));
    }

    @PostMapping("/sample-data/seed")
    public ResponseEntity<Map<String, String>> seed() {
        sampleDataService.seed();
        appLogService.info("Sample data loaded", "Admin: Load Sample Data");
        return ResponseEntity.ok(Map.of("message", "Sample data loaded successfully"));
    }

    @DeleteMapping("/sample-data/clear")
    public ResponseEntity<Map<String, String>> clear() {
        sampleDataService.clear();
        appLogService.info("All data cleared", "Admin: Clear All Data");
        return ResponseEntity.ok(Map.of("message", "All data cleared successfully"));
    }

    @GetMapping("/logs")
    public ResponseEntity<List<AppLog>> getLogs() {
        return ResponseEntity.ok(appLogService.getLogs());
    }
}
