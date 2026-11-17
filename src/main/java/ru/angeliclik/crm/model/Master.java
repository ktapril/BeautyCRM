package ru.angeliclik.crm.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "masters")
public class Master {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 100)
    private String specialization;

    @Column(length = 30)
    private String phone;

    @Column(length = 100)
    private String email;

    private boolean deleted = false;

    private LocalDateTime createdAt = LocalDateTime.now();

    public Master() {}

    public Long getId() { return id; }
    public String getFullName() { return fullName; }
    public String getSpecialization() { return specialization; }
    public String getPhone() { return phone; }
    public String getEmail() { return email; }
    public boolean isDeleted() { return deleted; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setFullName(String fullName) { this.fullName = fullName; }
    public void setSpecialization(String specialization) { this.specialization = specialization; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setEmail(String email) { this.email = email; }
    public void setDeleted(boolean deleted) { this.deleted = deleted; }
}