package ru.angeliclik.crm.auth;

import ru.angeliclik.crm.auth.dto.RegisterRequest;
import ru.angeliclik.crm.auth.dto.LoginRequest;
import ru.angeliclik.crm.auth.dto.AuthResponse;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        EmailVerificationTokenRepository tokenRepository,
        PasswordEncoder passwordEncoder,
        EmailService emailService,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.emailService = emailService;
        this.jwtService = jwtService;
    }

    @Transactional
    public void register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Этот email уже зарегистрирован");
        }

        User user = new User();
        user.setFullName(request.fullName().trim());
        user.setEmail(email);
        user.setPhone(request.phone().trim());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(Role.CLIENT);
        user.setEmailVerified(false);

        userRepository.save(user);

        String token = UUID.randomUUID().toString();
        tokenRepository.save(new EmailVerificationToken(
            token, user, LocalDateTime.now().plusHours(24)
        ));

        emailService.sendVerificationEmail(email, token);
    }

    @Transactional
    public void verifyEmail(String token) {
        EmailVerificationToken verificationToken = tokenRepository
            .findByToken(token)
            .orElseThrow(() -> new IllegalArgumentException("Недействительная ссылка подтверждения"));

        if (verificationToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            tokenRepository.delete(verificationToken);
            throw new IllegalArgumentException("Срок действия ссылки истёк. Запросите новую.");
        }

        User user = verificationToken.getUser();
        user.setEmailVerified(true);
        userRepository.save(user);
        tokenRepository.delete(verificationToken);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmailIgnoreCase(request.email().trim())
            .orElseThrow(() -> new IllegalArgumentException("Неверный email или пароль"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Неверный email или пароль");
        }

        if (!user.isEmailVerified()) {
            throw new IllegalArgumentException("Сначала подтвердите email");
        }

        if (!user.isEnabled()) {
            throw new IllegalArgumentException("Доступ к аккаунту заблокирован");
        }

        String token = jwtService.generateToken(user);

        return new AuthResponse(
            token,
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getRole().name()
        );
    }
}