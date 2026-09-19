package com.warehouse.inventory.service;

import com.warehouse.inventory.model.AppLog;
import com.warehouse.inventory.repository.AppLogRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppLogService {

    private final AppLogRepository repo;

    public AppLogService(AppLogRepository repo) {
        this.repo = repo;
    }

    public void error(String message, String context) {
        save("ERROR", message, context, currentUser());
    }

    public void warn(String message, String context) {
        save("WARN", message, context, currentUser());
    }

    public void info(String message, String context) {
        save("INFO", message, context, currentUser());
    }

    public List<AppLog> getLogs() {
        return repo.findAllByOrderByTimestampDesc();
    }

    private void save(String level, String message, String context, String triggeredBy) {
        try {
            AppLog log = new AppLog();
            log.setTimestamp(LocalDateTime.now());
            log.setLevel(level);
            log.setMessage(message != null ? message : "No message");
            log.setContext(context);
            log.setTriggeredBy(triggeredBy);
            repo.save(log);
        } catch (Exception ignored) {
            // Never let logging break the application
        }
    }

    private String currentUser() {
        try {
            Authentication auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
                return auth.getName();
            }
        } catch (Exception ignored) {}
        return null;
    }
}
