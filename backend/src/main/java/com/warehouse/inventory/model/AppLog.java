package com.warehouse.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "app_logs")
public class AppLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime timestamp;

    @Column(length = 10)
    private String level;

    @Column(length = 500)
    private String message;

    @Column(length = 200)
    private String context;

    @Column(length = 100)
    private String triggeredBy;

    public Long getId()                        { return id; }
    public LocalDateTime getTimestamp()        { return timestamp; }
    public void setTimestamp(LocalDateTime t)  { this.timestamp = t; }
    public String getLevel()                   { return level; }
    public void setLevel(String level)         { this.level = level; }
    public String getMessage()                 { return message; }
    public void setMessage(String message)     { this.message = message; }
    public String getContext()                 { return context; }
    public void setContext(String context)     { this.context = context; }
    public String getTriggeredBy()             { return triggeredBy; }
    public void setTriggeredBy(String t)       { this.triggeredBy = t; }
}
