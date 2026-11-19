package com.warehouse.inventory.controller;

import com.warehouse.inventory.model.CustomerOrder;
import com.warehouse.inventory.service.CustomerOrderService;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class CustomerOrderController {

    private final CustomerOrderService customerOrderService;

    public CustomerOrderController(CustomerOrderService customerOrderService) {
        this.customerOrderService = customerOrderService;
    }

    @GetMapping
    public List<CustomerOrder> getAll() {
        return customerOrderService.getAllOrders();
    }

    @GetMapping("/{id}")
    public CustomerOrder getOne(@PathVariable Long id) {
        return customerOrderService.getOrder(id);
    }

    @SuppressWarnings("unchecked")
    @PostMapping
    public CustomerOrder create(@RequestBody Map<String, Object> body) {
        String customerName = (String) body.get("customerName");
        String customerEmail = (String) body.get("customerEmail");
        Map<String, Object> rawItems = (Map<String, Object>) body.get("productQuantities");
        Map<Long, Integer> quantities = new HashMap<>();
        rawItems.forEach((k, v) -> quantities.put(Long.valueOf(k), ((Number) v).intValue()));
        return customerOrderService.createOrder(customerName, customerEmail, quantities);
    }

    @PostMapping("/{id}/confirm")
    public CustomerOrder confirm(@PathVariable Long id) {
        return customerOrderService.confirmOrder(id);
    }

    /**
     * Body is either:
     *   { "allocations": [ { "productId": 1, "warehouseId": 2, "quantity": 5 }, ... ] }  (split across warehouses)
     *   { "warehouseId": 2 }                                                            (everything from one warehouse)
     */
    @SuppressWarnings("unchecked")
    @PostMapping("/{id}/fulfill")
    public CustomerOrder fulfill(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        Object rawAllocations = body.get("allocations");
        if (rawAllocations instanceof List<?> list) {
            List<CustomerOrderService.Allocation> allocations = new ArrayList<>();
            for (Object o : list) {
                Map<String, Object> a = (Map<String, Object>) o;
                allocations.add(new CustomerOrderService.Allocation(
                        ((Number) a.get("productId")).longValue(),
                        ((Number) a.get("warehouseId")).longValue(),
                        ((Number) a.get("quantity")).intValue()));
            }
            return customerOrderService.fulfillOrder(id, allocations);
        }
        if (body.get("warehouseId") == null) {
            throw new IllegalArgumentException("Provide either allocations or warehouseId");
        }
        Long warehouseId = ((Number) body.get("warehouseId")).longValue();
        return customerOrderService.fulfillOrder(id, warehouseId);
    }

    @PostMapping("/{id}/cancel")
    public CustomerOrder cancel(@PathVariable Long id, @RequestBody(required = false) Map<String, Object> body) {
        Long warehouseId = body != null && body.get("warehouseId") != null
                ? ((Number) body.get("warehouseId")).longValue() : null;
        return customerOrderService.cancelOrder(id, warehouseId);
    }
}
