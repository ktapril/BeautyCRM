package ru.angeliclik.crm.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id", nullable = false)
    private Client client;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_id", nullable = false)
    private Master master;

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

    @JsonIgnore
    public Client getClient() { return client; }

    @JsonIgnore
    public Master getMaster() { return master; }

    public Long getClientId() {
        return client != null ? client.getId() : null;
    }

    public Long getMasterId() {
        return master != null ? master.getId() : null;
    }

    public String getServiceName() { return serviceName; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }

    public void setClient(Client client) { this.client = client; }
    public void setMaster(Master master) { this.master = master; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public void setEndTime(LocalDateTime endTime) { this.endTime = endTime; }
    public void setStatus(String status) { this.status = status; }
    public void setNotes(String notes) { this.notes = notes; }
}