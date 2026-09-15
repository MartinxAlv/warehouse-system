package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.Supplier;
import com.warehouse.inventory.repository.SupplierRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
public class SupplierController {

    private final SupplierRepository supplierRepository;

    public SupplierController(SupplierRepository supplierRepository) {
        this.supplierRepository = supplierRepository;
    }

    @GetMapping
    public List<Supplier> getAll() {
        return supplierRepository.findAll();
    }

    @PostMapping
    public Supplier create(@RequestBody Supplier supplier) {
        return supplierRepository.save(supplier);
    }

    @PutMapping("/{id}")
    public Supplier update(@PathVariable Long id, @RequestBody Supplier updated) {
        updated.setId(id);
        return supplierRepository.save(updated);
    }

    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable Long id) {
        Supplier s = supplierRepository.findById(id).orElseThrow();
        s.setActive(false);
        supplierRepository.save(s);
    }
}
