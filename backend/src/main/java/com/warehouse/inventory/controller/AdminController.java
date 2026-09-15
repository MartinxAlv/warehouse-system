package com.warehouse.inventory.controller;

import com.warehouse.inventory.service.SampleDataService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final SampleDataService sampleDataService;

    public AdminController(SampleDataService sampleDataService) {
        this.sampleDataService = sampleDataService;
    }

    @GetMapping("/sample-data/status")
    public ResponseEntity<Map<String, Boolean>> status() {
        return ResponseEntity.ok(Map.of("loaded", sampleDataService.isLoaded()));
    }

    @PostMapping("/sample-data/seed")
    public ResponseEntity<Map<String, String>> seed() {
        sampleDataService.seed();
        return ResponseEntity.ok(Map.of("message", "Sample data loaded successfully"));
    }

    @DeleteMapping("/sample-data/clear")
    public ResponseEntity<Map<String, String>> clear() {
        sampleDataService.clear();
        return ResponseEntity.ok(Map.of("message", "All data cleared successfully"));
    }
}
