package ru.angeliclik.crm.auth.dto;

public record StaffRequest(
    String fullName,
    String email,
    String phone,
    String password,
    String role,
    Long masterId
) {}