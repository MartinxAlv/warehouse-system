package com.warehouse.inventory.controller;

import com.warehouse.inventory.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public ProfileController(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @PutMapping("/password")
    public ResponseEntity<?> changePassword(@RequestBody Map<String, String> body,
                                             @AuthenticationPrincipal UserDetails userDetails) {
        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (newPassword == null || newPassword.length() < 6) {
            return ResponseEntity.badRequest()
                    .body(Map.of("message", "New password must be at least 6 characters"));
        }

        return userRepository.findByEmail(userDetails.getUsername())
                .map(user -> {
                    if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
                        return ResponseEntity.badRequest()
                                .body(Map.of("message", "Current password is incorrect"));
                    }
                    user.setPasswordHash(passwordEncoder.encode(newPassword));
                    userRepository.save(user);
                    return ResponseEntity.<Object>ok(Map.of("message", "Password updated successfully"));
                })
                .orElse(ResponseEntity.status(404).body(Map.of("message", "User not found")));
    }
}
