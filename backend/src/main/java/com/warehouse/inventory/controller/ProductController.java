package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.Product;
import com.warehouse.inventory.service.ProductService;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public List<Product> getAll() {
        return productService.getAllActiveProducts();
    }

    @GetMapping("/{id}")
    public Product getOne(@PathVariable Long id) {
        return productService.getProduct(id);
    }

    @PostMapping
    public Product create(@RequestBody Map<String, Object> body) {
        Product product = new Product();
        product.setSku((String) body.get("sku"));
        product.setName((String) body.get("name"));
        product.setDescription((String) body.get("description"));
        product.setPrice(new java.math.BigDecimal(body.get("price").toString()));
        product.setReorderThreshold(((Number) body.getOrDefault("reorderThreshold", 10)).intValue());
        Long categoryId = ((Number) body.get("categoryId")).longValue();
        return productService.createProduct(product, categoryId);
    }

    @PutMapping("/{id}")
    public Product update(@PathVariable Long id, @RequestBody Product updated) {
        return productService.updateProduct(id, updated);
    }

    @DeleteMapping("/{id}")
    public void deactivate(@PathVariable Long id) {
        productService.deactivateProduct(id);
    }
}
