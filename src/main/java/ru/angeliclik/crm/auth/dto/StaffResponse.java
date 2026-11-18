package ru.angeliclik.crm.auth.dto;

import java.time.LocalDateTime;

public record StaffResponse(
    Long id,
    String fullName,
    String email,
    String phone,
    String role,
    boolean enabled,
    Long masterId,
    LocalDateTime createdAt
) {}