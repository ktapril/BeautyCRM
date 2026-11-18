package ru.angeliclik.crm.auth;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class OwnerInitializer {

    @Bean
    CommandLineRunner initializeOwner(
        UserRepository userRepository,
        PasswordEncoder passwordEncoder,
        @Value("${app.owner.email:}") String email,
        @Value("${app.owner.password:}") String password,
        @Value("${app.owner.name:Владелец}") String name
    ) {
        return args -> {
            if (userRepository.existsByRole(Role.OWNER)) {
                return;
            }

            if (email.isBlank() || password.isBlank()) {
                System.out.println("OWNER не создан: задайте OWNER_EMAIL и OWNER_PASSWORD.");
                return;
            }

            if (password.length() < 12 || password.length() > 72) {
                throw new IllegalStateException("Пароль владельца должен содержать от 12 до 72 символов.");
            }

            String normalizedEmail = email.trim().toLowerCase();

            if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
                throw new IllegalStateException("Email владельца уже занят другим аккаунтом.");
            }

            User owner = new User();
            owner.setFullName(name.trim());
            owner.setEmail(normalizedEmail);
            owner.setPassword(passwordEncoder.encode(password));
            owner.setRole(Role.OWNER);
            owner.setEmailVerified(true);

            userRepository.save(owner);

            System.out.println("Первый аккаунт OWNER успешно создан.");
        };
    }
}
