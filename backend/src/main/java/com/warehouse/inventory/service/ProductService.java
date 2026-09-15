package com.warehouse.inventory.service;

import com.warehouse.inventory.model.Product;

import java.util.List;

public interface ProductService {
    Product createProduct(Product product, Long categoryId);
    Product updateProduct(Long id, Product updated);
    Product getProduct(Long id);
    List<Product> getAllActiveProducts();
    void deactivateProduct(Long id);
}
