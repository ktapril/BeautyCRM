package ru.angeliclik.crm.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.frontend-url}")
    private String frontendUrl;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendVerificationEmail(String email, String token) {
        String link = frontendUrl + "/verify-email?token=" + token;

        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(from);
        message.setTo(email);
        message.setSubject("Подтверждение регистрации | Ангельский лик");
        message.setText(
            "Здравствуйте!\n\n" +
            "Для подтверждения регистрации перейдите по ссылке:\n" +
            link + "\n\n" +
            "Ссылка действительна 24 часа.\n" +
            "Если вы не регистрировались, просто проигнорируйте это письмо."
        );

        mailSender.send(message);
    }
}