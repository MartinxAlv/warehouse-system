package com.warehouse.inventory.service;

import com.warehouse.inventory.model.*;
import com.warehouse.inventory.repository.*;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Service
public class SampleDataService {

    private final CategoryRepository categoryRepository;
    private final SupplierRepository supplierRepository;
    private final WarehouseRepository warehouseRepository;
    private final ProductRepository productRepository;
    private final PurchaseOrderService purchaseOrderService;
    private final CustomerOrderService customerOrderService;
    private final InventoryService inventoryService;
    private final JdbcTemplate jdbc;

    public SampleDataService(CategoryRepository categoryRepository,
                              SupplierRepository supplierRepository,
                              WarehouseRepository warehouseRepository,
                              ProductRepository productRepository,
                              PurchaseOrderService purchaseOrderService,
                              CustomerOrderService customerOrderService,
                              InventoryService inventoryService,
                              JdbcTemplate jdbc) {
        this.categoryRepository = categoryRepository;
        this.supplierRepository = supplierRepository;
        this.warehouseRepository = warehouseRepository;
        this.productRepository = productRepository;
        this.purchaseOrderService = purchaseOrderService;
        this.customerOrderService = customerOrderService;
        this.inventoryService = inventoryService;
        this.jdbc = jdbc;
    }

    public boolean isLoaded() {
        return productRepository.count() > 0;
    }

    // Not @Transactional — each service call commits independently so later calls see prior data
    public void seed() {
        if (isLoaded()) {
            throw new IllegalStateException("Data already exists. Clear all data first.");
        }

        // ── Categories ───────────────────────────────────────────────────────────
        Category cables   = cat("Cables & Adapters",  "Data, video, and charging cables");
        Category periph   = cat("Peripherals",        "Mice, keyboards, hubs, webcams, and stands");
        Category power    = cat("Power & Charging",   "Chargers, power banks, and adapters");
        Category audio    = cat("Audio & Video",      "Headsets, speakers, and display accessories");

        // ── Suppliers ────────────────────────────────────────────────────────────
        Supplier asiaLink   = sup("AsiaLink Electronics",  "orders@asialink.com",   "+1-555-0101", "88 Trade District, Los Angeles CA");
        Supplier swiftParts = sup("SwiftParts Co.",        "supply@swiftparts.com", "+1-555-0202", "14 Commerce Ave, Seattle WA");
        Supplier proGear    = sup("ProGear Supplies",      "sales@progear.io",      "+1-555-0303", "31 Industrial Park, Austin TX");

        // ── Warehouses ───────────────────────────────────────────────────────────
        Warehouse main = wh("Main Warehouse",   "123 Industrial Blvd, Chicago IL");
        Warehouse east = wh("East Coast Hub",   "45 Logistics Way, New York NY");
        Warehouse west = wh("West Coast Depot", "12 Harbor Blvd, Los Angeles CA");

        // ── Products ─────────────────────────────────────────────────────────────
        //  threshold set deliberately high on some products to trigger LOW STOCK alerts
        Product usbC    = prod("CBL-USBC-2M",   "USB-C Cable 2m",             "High-speed 60W USB-C cable, 2 metres",         new BigDecimal("14.99"),  40, cables);
        Product hdmi    = prod("CBL-HDMI-3M",   "HDMI Cable 3m",              "4K 60Hz HDMI 2.0 cable, 3 metres",             new BigDecimal("24.99"),  30, cables);
        Product charger = prod("CHG-GAN-65W",   "65W GaN Charger",            "Compact 65W GaN USB-C charger",                new BigDecimal("49.99"),  80, power);  // ← threshold high → LOW STOCK
        Product laptop  = prod("CHG-LPT-130W",  "130W Laptop Charger",        "Universal 130W laptop power adapter",          new BigDecimal("89.99"),  10, power);
        Product mouse   = prod("PER-MSE-WL",    "Wireless Mouse",             "Ergonomic 2.4GHz wireless mouse, USB receiver",new BigDecimal("29.99"),  40, periph);
        Product kb      = prod("PER-KB-MECH",   "Mechanical Keyboard (TKL)",  "Tenkeyless mechanical keyboard, blue switches",new BigDecimal("89.99"),  20, periph); // ← LOW STOCK
        Product hub     = prod("PER-HUB-7IN1",  "USB-C Hub 7-in-1",          "HDMI, USB-A ×3, SD, MicroSD, PD 100W",        new BigDecimal("54.99"),  20, periph);
        Product webcam  = prod("PER-CAM-1080",  "1080p Webcam",               "Full HD webcam with built-in microphone",      new BigDecimal("69.99"),  15, periph);
        Product headset = prod("AV-HST-NC",     "Noise-Cancelling Headset",   "USB-C active noise-cancelling headset",        new BigDecimal("129.99"), 12, audio); // ← LOW STOCK (West)
        Product stand   = prod("PER-STD-ALU",   "Laptop Stand",               "Adjustable aluminium laptop stand",            new BigDecimal("39.99"),  15, periph);

        // ── Purchase Orders — RECEIVED (populate inventory) ───────────────────────
        // PO1  AsiaLink → Main:  500× USB-C, 300× HDMI, 200× Hub
        receivePo(asiaLink.getId(), main.getId(),
            qmap(usbC, 500, hdmi, 300, hub, 200),
            cmap(usbC, "6.00", hdmi, "10.00", hub, "24.00"));

        // PO2  SwiftParts → Main:  400× Mouse, 150× Keyboard, 80× Headset, 150× Stand
        receivePo(swiftParts.getId(), main.getId(),
            qmap(mouse, 400, kb, 150, headset, 80, stand, 150),
            cmap(mouse, "13.00", kb, "42.00", headset, "58.00", stand, "16.00"));

        // PO3  ProGear → Main:  250× 65W Charger, 120× 130W Charger, 100× Webcam
        receivePo(proGear.getId(), main.getId(),
            qmap(charger, 250, laptop, 120, webcam, 100),
            cmap(charger, "22.00", laptop, "38.00", webcam, "30.00"));

        // PO4  AsiaLink → East:  200× USB-C, 150× HDMI
        receivePo(asiaLink.getId(), east.getId(),
            qmap(usbC, 200, hdmi, 150),
            cmap(usbC, "6.00", hdmi, "10.00"));

        // PO5  SwiftParts → East:  200× Mouse, 100× Keyboard, 80× Webcam, 40× Headset
        receivePo(swiftParts.getId(), east.getId(),
            qmap(mouse, 200, kb, 100, webcam, 80, headset, 40),
            cmap(mouse, "13.00", kb, "42.00", webcam, "30.00", headset, "58.00"));

        // PO6  ProGear → West (initial stock):  150× Mouse, 80× Keyboard, 60× Stand
        receivePo(proGear.getId(), west.getId(),
            qmap(mouse, 150, kb, 80, stand, 60),
            cmap(mouse, "13.00", kb, "42.00", stand, "16.00"));

        // Stock after received POs:
        //  Main  USB-C=500  HDMI=300  Charger=250  Laptop=120  Mouse=400  KB=150  Hub=200  Webcam=100  Headset=80  Stand=150
        //  East  USB-C=200  HDMI=150  Mouse=200  KB=100  Webcam=80  Headset=40
        //  West  Mouse=150  KB=80  Stand=60

        // ── Purchase Orders — SUBMITTED (ordered, goods not yet arrived) ──────────
        // PO7  AsiaLink → Main: reorder USB-C + HDMI
        PurchaseOrder po7 = purchaseOrderService.createOrder(asiaLink.getId(),
            qmap(usbC, 400, hdmi, 250),
            cmap(usbC, "6.00", hdmi, "10.00"));
        purchaseOrderService.submitOrder(po7.getId());

        // PO8  SwiftParts → Main: reorder Mouse + Headset
        PurchaseOrder po8 = purchaseOrderService.createOrder(swiftParts.getId(),
            qmap(mouse, 300, headset, 100),
            cmap(mouse, "13.00", headset, "58.00"));
        purchaseOrderService.submitOrder(po8.getId());

        // ── Purchase Order — DRAFT (not yet submitted) ───────────────────────────
        // PO9  ProGear → Main: planned charger reorder
        purchaseOrderService.createOrder(proGear.getId(),
            qmap(charger, 300, laptop, 80, webcam, 60),
            cmap(charger, "22.00", laptop, "38.00", webcam, "30.00"));

        // ── Customer Orders — FULFILLED from Main ─────────────────────────────────
        // CO1  BigBox Electronics
        fulfill(main, "BigBox Electronics",    "procurement@bigbox.com",
            qmap(usbC, 120, hdmi, 80, charger, 60, mouse, 100));
        // Main: USB-C=380  HDMI=220  Charger=190  Mouse=300

        // CO2  TechCorp Ltd
        fulfill(main, "TechCorp Ltd",          "tech@techcorp.com",
            qmap(mouse, 80, kb, 50, hub, 60));
        // Main: Mouse=220  KB=100  Hub=140

        // CO3  University IT Department
        fulfill(main, "University IT Dept",    "it@uni.edu",
            qmap(usbC, 90, charger, 40, webcam, 30, stand, 50));
        // Main: USB-C=290  Charger=150  Webcam=70  Stand=100

        // CO4  StartupHub Office
        fulfill(main, "StartupHub Office",     "ops@startuphub.io",
            qmap(kb, 40, hub, 60, headset, 20));
        // Main: KB=60  Hub=80  Headset=60

        // CO5  Corporate Essentials
        fulfill(main, "Corporate Essentials",  "orders@corpessentials.com",
            qmap(mouse, 70, kb, 30, charger, 30));
        // Main: Mouse=150  KB=30  Charger=120

        // CO6  City Government IT
        fulfill(main, "City Gov IT Services",  "itsupply@cityit.gov",
            qmap(usbC, 80, hdmi, 60, laptop, 40));
        // Main: USB-C=210  HDMI=160  Laptop=80

        // ── Customer Order — FULFILLED from East ──────────────────────────────────
        // CO7  Atlantic Tech Retailers
        fulfill(east, "Atlantic Tech Retailers", "buy@atlantictech.com",
            qmap(usbC, 50, mouse, 60, webcam, 20));
        // East: USB-C=150  Mouse=140  Webcam=60

        // ── Customer Orders — CONFIRMED (awaiting dispatch) ───────────────────────
        // CO8
        confirmOnly("MediaPro Studios",       "gear@mediapro.com",
            qmap(webcam, 25, headset, 15, hub, 30));

        // CO9
        confirmOnly("Regional Schools Supply","bulk@rss.edu",
            qmap(usbC, 100, mouse, 80, kb, 40));

        // CO10  (confirmed at East — uses East stock for stock-check)
        confirmOnly("NY Electronics Depot",   "orders@nyelectronics.com",
            qmap(hdmi, 40, mouse, 40, kb, 30));

        // ── Customer Orders — PENDING ─────────────────────────────────────────────
        // CO11
        pending("HomeOffice Direct",          "shop@homeofficedirect.com",
            qmap(mouse, 50, stand, 30, headset, 10));

        // CO12
        pending("PCBuilders Inc.",            "parts@pcbuilders.net",
            qmap(usbC, 60, hdmi, 40, hub, 40));

        // CO13
        pending("GovSupply NSW",              "ict@govsupply.gov",
            qmap(laptop, 20, charger, 25));

        // ── Customer Orders — CANCELLED ───────────────────────────────────────────
        // CO14  Cancelled from CONFIRMED
        CustomerOrder co14 = customerOrderService.createOrder(
            "CheapDeals Online", "buy@cheapdeals.com", qmap(kb, 20, mouse, 30));
        customerOrderService.confirmOrder(co14.getId());
        customerOrderService.cancelOrder(co14.getId(), main.getId());

        // CO15  Cancelled while still PENDING
        CustomerOrder co15 = customerOrderService.createOrder(
            "WebShop Deals", "hello@webshopdeals.com", qmap(usbC, 50, hdmi, 30));
        customerOrderService.cancelOrder(co15.getId(), main.getId());

        // ── Manual stock adjustments ──────────────────────────────────────────────
        inventoryService.adjustStock(usbC.getId(),    main.getId(),  -5,  "Damaged");
        inventoryService.adjustStock(kb.getId(),      main.getId(), -12,  "Recount");   // KB: 30→18 (LOW ≤20)
        inventoryService.adjustStock(mouse.getId(),   main.getId(), +20,  "Restocked");
        inventoryService.adjustStock(webcam.getId(),  east.getId(),  -2,  "Damaged");
        inventoryService.adjustStock(charger.getId(), main.getId(), -45,  "Expired");   // 120→75 (LOW ≤80)
        inventoryService.adjustStock(headset.getId(), east.getId(),  -3,  "Damaged");

        // ── Stock transfers between warehouses ────────────────────────────────────
        inventoryService.transferStock(mouse.getId(),  main.getId(), east.getId(), 50);  // spread mouse stock east
        inventoryService.transferStock(usbC.getId(),   main.getId(), west.getId(), 30);  // seed West with cables
        inventoryService.transferStock(headset.getId(),main.getId(), west.getId(), 10);  // West Headset=10 (LOW ≤12)

        // ── Final inventory summary ───────────────────────────────────────────────
        // Main:  USB-C=175  HDMI=160  Charger=75(LOW)  Laptop=80  Mouse=120  KB=18(LOW)  Hub=80  Webcam=70  Headset=50  Stand=100
        // East:  USB-C=150  HDMI=150  Mouse=190  KB=100  Webcam=58  Headset=37
        // West:  USB-C=30   Mouse=50  KB=80  Stand=60  Headset=10(LOW)
    }

    @Transactional
    public void clear() {
        jdbc.execute("DELETE FROM stock_movements");
        jdbc.execute("DELETE FROM order_items");
        jdbc.execute("DELETE FROM customer_orders");
        jdbc.execute("DELETE FROM purchase_order_items");
        jdbc.execute("DELETE FROM purchase_orders");
        jdbc.execute("DELETE FROM inventory_items");
        jdbc.execute("DELETE FROM product_suppliers");
        jdbc.execute("DELETE FROM products");
        jdbc.execute("DELETE FROM categories");
        jdbc.execute("DELETE FROM suppliers");
        jdbc.execute("DELETE FROM warehouses");
        jdbc.update("DELETE FROM users WHERE email NOT IN (?, ?, ?)",
                "admin@warehouse.com", "staff@warehouse.com", "sales@warehouse.com");
    }

    // ── private helpers ──────────────────────────────────────────────────────────

    private Category cat(String name, String desc) {
        Category c = new Category(); c.setName(name); c.setDescription(desc);
        return categoryRepository.save(c);
    }

    private Supplier sup(String name, String email, String phone, String address) {
        Supplier s = new Supplier(); s.setName(name); s.setContactEmail(email);
        s.setPhone(phone); s.setAddress(address); s.setActive(true);
        return supplierRepository.save(s);
    }

    private Warehouse wh(String name, String location) {
        Warehouse w = new Warehouse(); w.setName(name); w.setLocation(location);
        return warehouseRepository.save(w);
    }

    private Product prod(String sku, String name, String desc, BigDecimal price, int threshold, Category cat) {
        Product p = new Product(); p.setSku(sku); p.setName(name); p.setDescription(desc);
        p.setPrice(price); p.setReorderThreshold(threshold); p.setActive(true); p.setCategory(cat);
        return productRepository.save(p);
    }

    /** Create, submit, and fully receive a purchase order — stocks up inventory immediately. */
    private void receivePo(Long supplierId, Long warehouseId,
                            Map<Long, Integer> quantities, Map<Long, BigDecimal> costs) {
        PurchaseOrder po = purchaseOrderService.createOrder(supplierId, quantities, costs);
        po = purchaseOrderService.submitOrder(po.getId());
        Map<Long, Integer> receiveMap = new HashMap<>();
        for (PurchaseOrderItem item : po.getItems()) {
            receiveMap.put(item.getId(), item.getQuantityOrdered());
        }
        purchaseOrderService.receiveShipment(po.getId(), warehouseId, receiveMap);
    }

    private void fulfill(Warehouse warehouse, String customer, String email,
                          Map<Long, Integer> items) {
        CustomerOrder co = customerOrderService.createOrder(customer, email, items);
        customerOrderService.confirmOrder(co.getId());
        customerOrderService.fulfillOrder(co.getId(), warehouse.getId());
    }

    private void confirmOnly(String customer, String email, Map<Long, Integer> items) {
        CustomerOrder co = customerOrderService.createOrder(customer, email, items);
        customerOrderService.confirmOrder(co.getId());
    }

    private void pending(String customer, String email, Map<Long, Integer> items) {
        customerOrderService.createOrder(customer, email, items);
    }

    /** Build a product-id → quantity map from alternating Product, int pairs. */
    private Map<Long, Integer> qmap(Object... pairs) {
        Map<Long, Integer> m = new HashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            m.put(((Product) pairs[i]).getId(), (Integer) pairs[i + 1]);
        }
        return m;
    }

    /** Build a product-id → BigDecimal cost map from alternating Product, String pairs. */
    private Map<Long, BigDecimal> cmap(Object... pairs) {
        Map<Long, BigDecimal> m = new HashMap<>();
        for (int i = 0; i < pairs.length; i += 2) {
            m.put(((Product) pairs[i]).getId(), new BigDecimal((String) pairs[i + 1]));
        }
        return m;
    }
}
