package com.warehouse.inventory.service.impl;

import com.warehouse.inventory.exception.InsufficientStockException;
import com.warehouse.inventory.exception.InvalidOrderStateException;
import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.model.*;
import com.warehouse.inventory.repository.CustomerOrderRepository;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.service.CustomerOrderService;
import com.warehouse.inventory.service.InventoryService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Service
public class CustomerOrderServiceImpl implements CustomerOrderService {

    private final CustomerOrderRepository customerOrderRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public CustomerOrderServiceImpl(CustomerOrderRepository customerOrderRepository,
                                     ProductRepository productRepository,
                                     InventoryService inventoryService) {
        this.customerOrderRepository = customerOrderRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional
    public CustomerOrder createOrder(String customerName, String customerEmail, Map<Long, Integer> productQuantities) {
        CustomerOrder order = new CustomerOrder();
        order.setCustomerName(customerName);
        order.setCustomerEmail(customerEmail);
        order.setStatus(OrderStatus.PENDING);

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + entry.getKey()));

            if (inventoryService.getTotalStock(product.getId()) < entry.getValue()) {
                throw new InsufficientStockException(
                        "Not enough stock for product '" + product.getName() + "' to place order");
            }

            OrderItem item = new OrderItem();
            item.setCustomerOrder(order);
            item.setProduct(product);
            item.setQuantity(entry.getValue());
            item.setUnitPrice(product.getPrice());
            order.getItems().add(item);
        }

        return customerOrderRepository.save(order);
    }

    @Override
    @Transactional
    public CustomerOrder confirmOrder(Long orderId) {
        CustomerOrder order = getOrder(orderId);
        if (order.getStatus() != OrderStatus.PENDING) {
            throw new InvalidOrderStateException("Only PENDING orders can be confirmed");
        }
        order.setStatus(OrderStatus.CONFIRMED);
        return customerOrderRepository.save(order);
    }

    @Override
    @Transactional
    public CustomerOrder fulfillOrder(Long orderId, Long warehouseId) {
        CustomerOrder order = getOrder(orderId);
        if (order.getStatus() != OrderStatus.CONFIRMED) {
            throw new InvalidOrderStateException("Only CONFIRMED orders can be fulfilled");
        }

        for (OrderItem item : order.getItems()) {
            inventoryService.applyMovement(item.getProduct().getId(), warehouseId, -item.getQuantity(),
                    MovementType.SALE_FULFILLED, "Fulfilled order #" + order.getId(),
                    "ORDER-" + order.getId());
        }

        order.setStatus(OrderStatus.FULFILLED);
        return customerOrderRepository.save(order);
    }

    @Override
    @Transactional
    public CustomerOrder cancelOrder(Long orderId, Long warehouseId) {
        CustomerOrder order = getOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED) {
            throw new InvalidOrderStateException("Order is already cancelled");
        }

        // If it was already fulfilled, restore the stock that was taken out (FR24)
        if (order.getStatus() == OrderStatus.FULFILLED) {
            for (OrderItem item : order.getItems()) {
                inventoryService.applyMovement(item.getProduct().getId(), warehouseId, item.getQuantity(),
                        MovementType.RETURN, "Cancelled order #" + order.getId(),
                        "ORDER-" + order.getId());
            }
        }

        order.setStatus(OrderStatus.CANCELLED);
        return customerOrderRepository.save(order);
    }

    @Override
    public CustomerOrder getOrder(Long orderId) {
        return customerOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Customer order not found: " + orderId));
    }

    @Override
    public List<CustomerOrder> getAllOrders() {
        return customerOrderRepository.findAll();
    }
}
