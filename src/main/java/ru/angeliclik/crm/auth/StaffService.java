package ru.angeliclik.crm.auth;

import ru.angeliclik.crm.auth.dto.StaffRequest;
import ru.angeliclik.crm.auth.dto.StaffResponse;
import ru.angeliclik.crm.model.Master;
import ru.angeliclik.crm.repository.MasterRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class StaffService {

    private final UserRepository userRepository;
    private final MasterRepository masterRepository;
    private final PasswordEncoder passwordEncoder;

    public StaffService(
        UserRepository userRepository,
        MasterRepository masterRepository,
        PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.masterRepository = masterRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<StaffResponse> getAll() {
        return userRepository.findAll().stream()
            .filter(user -> user.getRole() == Role.ADMIN || user.getRole() == Role.MASTER)
            .map(this::toResponse)
            .toList();
    }

    @Transactional
    public StaffResponse create(StaffRequest request) {
        Role role = parseRole(request.role());
        Master master = resolveMaster(role, request.masterId(), null);

        String fullName = role == Role.MASTER
            ? validateName(master.getFullName())
            : validateName(request.fullName());

        String email = role == Role.MASTER
            ? normalizeEmail(master.getEmail())
            : normalizeEmail(request.email());

        String phone = role == Role.MASTER
            ? normalizePhone(master.getPhone())
            : normalizePhone(request.phone());

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Этот email уже используется");
        }

        validatePassword(request.password());

        User user = new User();
        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole(role);
        user.setEmailVerified(true);
        user.setEnabled(true);
        user.setMaster(master);

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public StaffResponse update(Long id, StaffRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Сотрудник не найден"));

        if (user.getRole() != Role.ADMIN && user.getRole() != Role.MASTER) {
            throw new IllegalArgumentException("Нельзя изменять эту учётную запись");
        }

        Role role = parseRole(request.role());
        Master master = resolveMaster(role, request.masterId(), id);

        String fullName = role == Role.MASTER
            ? validateName(master.getFullName())
            : validateName(request.fullName());

        String email = role == Role.MASTER
            ? normalizeEmail(master.getEmail())
            : normalizeEmail(request.email());

        String phone = role == Role.MASTER
            ? normalizePhone(master.getPhone())
            : normalizePhone(request.phone());

        if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, id)) {
            throw new IllegalArgumentException("Этот email уже используется");
        }

        user.setFullName(fullName);
        user.setEmail(email);
        user.setPhone(phone);
        user.setRole(role);
        user.setMaster(master);

        if (request.password() != null && !request.password().isBlank()) {
            validatePassword(request.password());
            user.setPassword(passwordEncoder.encode(request.password()));
        }

        return toResponse(userRepository.save(user));
    }

    @Transactional
    public StaffResponse setEnabled(Long id, boolean enabled) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Сотрудник не найден"));

        if (user.getRole() != Role.ADMIN && user.getRole() != Role.MASTER) {
            throw new IllegalArgumentException("Нельзя изменять эту учётную запись");
        }

        user.setEnabled(enabled);
        return toResponse(userRepository.save(user));
    }

    private Master resolveMaster(Role role, Long masterId, Long currentUserId) {
        if (role == Role.ADMIN) {
            if (masterId != null) {
                throw new IllegalArgumentException("Для администратора не нужна карточка мастера");
            }
            return null;
        }

        if (masterId == null) {
            throw new IllegalArgumentException("Для мастера необходимо выбрать карточку сотрудника");
        }

        Master master = masterRepository.findByIdAndDeletedFalse(masterId)
            .orElseThrow(() -> new IllegalArgumentException("Активная карточка мастера не найдена"));

        userRepository.findByMasterId(masterId).ifPresent(existing -> {
            if (!existing.getId().equals(currentUserId)) {
                throw new IllegalArgumentException("Эта карточка уже привязана к аккаунту");
            }
        });

        return master;
    }

    private Role parseRole(String value) {
        if (value == null) {
            throw new IllegalArgumentException("Необходимо указать роль");
        }

        try {
            Role role = Role.valueOf(value.trim().toUpperCase(Locale.ROOT));
            if (role != Role.ADMIN && role != Role.MASTER) {
                throw new IllegalArgumentException();
            }
            return role;
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Допустимые роли: ADMIN и MASTER");
        }
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("В карточке мастера или форме сотрудника не указан email");
        }

        String value = email.trim().toLowerCase(Locale.ROOT);

        if (value.length() > 150
            || !value.matches("^[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\\.[A-Za-z0-9!#$%&'*+/=?^_`{|}~-]+)*@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)*\\.[A-Za-z]{2,}$")) {
            throw new IllegalArgumentException("Укажите корректный email");
        }

        return value;
    }

    private String validateName(String name) {
        if (name == null || name.isBlank() || name.trim().length() > 100) {
            throw new IllegalArgumentException("Имя должно содержать от 1 до 100 символов");
        }
        return name.trim();
    }

    private String normalizePhone(String phone) {
        if (phone == null || phone.isBlank()) {
            throw new IllegalArgumentException("Укажите номер телефона");
        }

        String value = phone.trim();

        if (!value.matches("^[+0-9()\\s-]+$")) {
            throw new IllegalArgumentException("Телефон содержит недопустимые символы");
        }

        String digits = value.replaceAll("\\D", "");

        if (digits.length() == 10) {
            digits = "7" + digits;
        } else if (digits.length() == 11 && digits.startsWith("8")) {
            digits = "7" + digits.substring(1);
        }

        if (digits.length() != 11 || !digits.startsWith("7")) {
            throw new IllegalArgumentException("Телефон должен быть в формате +7 (999) 123-45-67");
        }

        return "+7 (" + digits.substring(1, 4) + ") "
            + digits.substring(4, 7) + "-"
            + digits.substring(7, 9) + "-"
            + digits.substring(9, 11);
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 12 || password.length() > 72) {
            throw new IllegalArgumentException("Пароль должен содержать от 12 до 72 символов");
        }
    }

    private StaffResponse toResponse(User user) {
        return new StaffResponse(
            user.getId(),
            user.getFullName(),
            user.getEmail(),
            user.getPhone(),
            user.getRole().name(),
            user.isEnabled(),
            user.getMaster() == null ? null : user.getMaster().getId(),
            user.getCreatedAt()
        );
    }
}