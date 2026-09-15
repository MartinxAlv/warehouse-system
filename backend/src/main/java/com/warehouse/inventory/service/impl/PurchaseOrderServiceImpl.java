package com.warehouse.inventory.service.impl;

import com.warehouse.inventory.exception.InvalidOrderStateException;
import com.warehouse.inventory.exception.ResourceNotFoundException;
import com.warehouse.inventory.model.*;
import com.warehouse.inventory.repository.ProductRepository;
import com.warehouse.inventory.repository.PurchaseOrderRepository;
import com.warehouse.inventory.repository.SupplierRepository;
import com.warehouse.inventory.service.InventoryService;
import com.warehouse.inventory.service.PurchaseOrderService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Service
public class PurchaseOrderServiceImpl implements PurchaseOrderService {

    private final PurchaseOrderRepository purchaseOrderRepository;
    private final SupplierRepository supplierRepository;
    private final ProductRepository productRepository;
    private final InventoryService inventoryService;

    public PurchaseOrderServiceImpl(PurchaseOrderRepository purchaseOrderRepository,
                                     SupplierRepository supplierRepository,
                                     ProductRepository productRepository,
                                     InventoryService inventoryService) {
        this.purchaseOrderRepository = purchaseOrderRepository;
        this.supplierRepository = supplierRepository;
        this.productRepository = productRepository;
        this.inventoryService = inventoryService;
    }

    @Override
    @Transactional
    public PurchaseOrder createOrder(Long supplierId, Map<Long, Integer> productQuantities,
                                      Map<Long, BigDecimal> unitCosts) {
        Supplier supplier = supplierRepository.findById(supplierId)
                .orElseThrow(() -> new ResourceNotFoundException("Supplier not found: " + supplierId));

        PurchaseOrder order = new PurchaseOrder();
        order.setSupplier(supplier);
        order.setStatus(PurchaseOrderStatus.DRAFT);

        for (Map.Entry<Long, Integer> entry : productQuantities.entrySet()) {
            Product product = productRepository.findById(entry.getKey())
                    .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + entry.getKey()));
            PurchaseOrderItem item = new PurchaseOrderItem();
            item.setPurchaseOrder(order);
            item.setProduct(product);
            item.setQuantityOrdered(entry.getValue());
            item.setQuantityReceived(0);
            item.setUnitCost(unitCosts.getOrDefault(entry.getKey(), BigDecimal.ZERO));
            order.getItems().add(item);
        }

        return purchaseOrderRepository.save(order);
    }

    @Override
    @Transactional
    public PurchaseOrder submitOrder(Long orderId) {
        PurchaseOrder order = getOrder(orderId);
        if (order.getStatus() != PurchaseOrderStatus.DRAFT) {
            throw new InvalidOrderStateException("Only DRAFT orders can be submitted");
        }
        order.setStatus(PurchaseOrderStatus.SUBMITTED);
        return purchaseOrderRepository.save(order);
    }

    @Override
    @Transactional
    public PurchaseOrder receiveShipment(Long orderId, Long warehouseId, Map<Long, Integer> receivedQuantitiesByPoItemId) {
        PurchaseOrder order = getOrder(orderId);
        if (order.getStatus() != PurchaseOrderStatus.SUBMITTED
                && order.getStatus() != PurchaseOrderStatus.PARTIALLY_RECEIVED) {
            throw new InvalidOrderStateException("Order must be SUBMITTED or PARTIALLY_RECEIVED to receive stock");
        }

        for (PurchaseOrderItem item : order.getItems()) {
            Integer receivedNow = receivedQuantitiesByPoItemId.get(item.getId());
            if (receivedNow == null || receivedNow <= 0) continue;

            int remaining = item.getQuantityOrdered() - item.getQuantityReceived();
            int toReceive = Math.min(remaining, receivedNow);
            if (toReceive <= 0) continue;

            item.setQuantityReceived(item.getQuantityReceived() + toReceive);

            inventoryService.applyMovement(item.getProduct().getId(), warehouseId, toReceive,
                    MovementType.PURCHASE_RECEIVED, "Received from PO #" + order.getId(),
                    "PO-" + order.getId());
        }

        boolean allReceived = order.getItems().stream()
                .allMatch(i -> i.getQuantityReceived() >= i.getQuantityOrdered());
        order.setStatus(allReceived ? PurchaseOrderStatus.RECEIVED : PurchaseOrderStatus.PARTIALLY_RECEIVED);

        return purchaseOrderRepository.save(order);
    }

    @Override
    @Transactional
    public PurchaseOrder cancelOrder(Long orderId) {
        PurchaseOrder order = getOrder(orderId);
        if (order.getStatus() == PurchaseOrderStatus.RECEIVED) {
            throw new InvalidOrderStateException("Cannot cancel a fully received order");
        }
        order.setStatus(PurchaseOrderStatus.CANCELLED);
        return purchaseOrderRepository.save(order);
    }

    @Override
    public PurchaseOrder getOrder(Long orderId) {
        return purchaseOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Purchase order not found: " + orderId));
    }

    @Override
    public List<PurchaseOrder> getAllOrders() {
        return purchaseOrderRepository.findAll();
    }
}
