package ru.angeliclik.crm.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

    @NotBlank(message = "Введите имя")
    @Size(min = 2, max = 100, message = "Имя должно содержать от 2 до 100 символов")
    String fullName,

    @NotBlank(message = "Введите email")
    @Email(message = "Некорректный email")
    @Size(max = 150)
    String email,

    @NotBlank(message = "Введите телефон")
    @Pattern(
        regexp = "^[+]?[0-9()\\-\\s]{10,20}$",
        message = "Некорректный номер телефона"
    )
    String phone,

    @NotBlank(message = "Введите пароль")
    @Size(min = 8, max = 72, message = "Пароль должен содержать от 8 до 72 символов")
    String password

) {}