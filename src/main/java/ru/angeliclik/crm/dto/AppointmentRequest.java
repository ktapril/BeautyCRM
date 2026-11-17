package ru.angeliclik.crm.dto;

import java.time.LocalDateTime;

public class AppointmentRequest {

    private Long clientId;
    private Long masterId;
    private String serviceName;
    private LocalDateTime startTime;
    private Integer durationMinutes;
    private String notes;

    public Long getClientId() { return clientId; }
    public Long getMasterId() { return masterId; }
    public String getServiceName() { return serviceName; }
    public LocalDateTime getStartTime() { return startTime; }
    public Integer getDurationMinutes() { return durationMinutes; }
    public String getNotes() { return notes; }

    public void setClientId(Long clientId) { this.clientId = clientId; }
    public void setMasterId(Long masterId) { this.masterId = masterId; }
    public void setServiceName(String serviceName) { this.serviceName = serviceName; }
    public void setStartTime(LocalDateTime startTime) { this.startTime = startTime; }
    public void setDurationMinutes(Integer durationMinutes) { this.durationMinutes = durationMinutes; }
    public void setNotes(String notes) { this.notes = notes; }
}