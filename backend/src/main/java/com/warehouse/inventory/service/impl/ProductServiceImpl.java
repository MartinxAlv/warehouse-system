package com.warehouse.inventory.service.impl;

import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.model.Category;
import com.warehouse.inventory.model.Product;
import com.warehouse.inventory.repository.CategoryRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.service.ProductService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public ProductServiceImpl(ProductRepository productRepository, CategoryRepository categoryRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
    }

    @Override
    @Transactional
    public Product createProduct(Product product, Long categoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
        product.setCategory(category);
        product.setActive(true);
        return productRepository.save(product);
    }

    @Override
    @Transactional
    public Product updateProduct(Long id, Product updated) {
        Product existing = getProduct(id);
        existing.setName(updated.getName());
        existing.setDescription(updated.getDescription());
        existing.setPrice(updated.getPrice());
        existing.setReorderThreshold(updated.getReorderThreshold());
        if (updated.getCategory() != null && updated.getCategory().getId() != null) {
            Category category = categoryRepository.findById(updated.getCategory().getId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
            existing.setCategory(category);
        }
        return productRepository.save(existing);
    }

    @Override
    public Product getProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
    }

    @Override
    public List<Product> getAllActiveProducts() {
        return productRepository.findAll().stream().filter(Product::isActive).toList();
    }

    @Override
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @Override
    @Transactional
    public void deactivateProduct(Long id) {
        Product product = getProduct(id);
        product.setActive(false);
        productRepository.save(product);
    }

    @Override
    @Transactional
    public void reactivateProduct(Long id) {
        Product product = getProduct(id);
        product.setActive(true);
        productRepository.save(product);
    }
}
