package com.warehouse.inventory.config;

import com.warehouse.inventory.model.Role;
import com.warehouse.inventory.model.User;
import com.warehouse.inventory.repository.UserRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements ApplicationRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (userRepository.count() > 0) return;

        create("Admin User",      "admin@warehouse.com",   "admin123",  Role.ADMIN);
        create("Warehouse Staff", "staff@warehouse.com",   "staff123",  Role.WAREHOUSE_STAFF);
        create("Sales Rep",       "sales@warehouse.com",   "sales123",  Role.SALES_STAFF);
    }

    private void create(String fullName, String email, String password, Role role) {
        User u = new User();
        u.setFullName(fullName);
        u.setEmail(email);
        u.setPasswordHash(passwordEncoder.encode(password));
        u.setRole(role);
        u.setActive(true);
        userRepository.save(u);
    }
}
