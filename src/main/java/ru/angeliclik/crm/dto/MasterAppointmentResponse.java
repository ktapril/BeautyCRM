package ru.angeliclik.crm.dto;

import java.time.LocalDateTime;

public class MasterAppointmentResponse {

    private Long id;
    private String clientName;
    private String clientPhone;
    private String serviceName;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String status;
    private String notes;

    public MasterAppointmentResponse(
            Long id,
            String clientName,
            String clientPhone,
            String serviceName,
            LocalDateTime startTime,
            LocalDateTime endTime,
            String status,
            String notes
    ) {
        this.id = id;
        this.clientName = clientName;
        this.clientPhone = clientPhone;
        this.serviceName = serviceName;
        this.startTime = startTime;
        this.endTime = endTime;
        this.status = status;
        this.notes = notes;
    }

    public Long getId() { return id; }
    public String getClientName() { return clientName; }
    public String getClientPhone() { return clientPhone; }
    public String getServiceName() { return serviceName; }
    public LocalDateTime getStartTime() { return startTime; }
    public LocalDateTime getEndTime() { return endTime; }
    public String getStatus() { return status; }
    public String getNotes() { return notes; }
}
