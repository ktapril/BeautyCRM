package ru.angeliclik.crm.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long clientId;

    @Column(nullable = false)
    private Long masterId;

    @Column(nullable = false, length = 150)
    private String serviceName;

    @Column(nullable = false)
    private LocalDateTime startTime;

    @Column(nullable = false)
    private LocalDateTime endTime;

    @Column(nullable = false, length = 20)
    private String status = "SCHEDULED";

    @Column(columnDefinition = "TEXT")
    private String notes;

    public Appointment() {}

    public Long getId() { return id; }
    public Long getClientId() { return clientId; }
    public Long getMasterId() { return masterId; }
    public String getServiceName() { return serviceName; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }

    public void setClientId(Long clientId) { this.clientId = clientId; }
    public void setMasterId(Long masterId) { this.masterId = masterId; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public void setStatus(String status) { this.status = status; }
    public void setNotes(String notes) { this.notes = notes; }
}