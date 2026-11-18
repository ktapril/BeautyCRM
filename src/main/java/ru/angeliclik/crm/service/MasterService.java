package ru.angeliclik.crm.service;

import ru.angeliclik.crm.auth.User;
import ru.angeliclik.crm.auth.UserRepository;
import ru.angeliclik.crm.model.Master;
import ru.angeliclik.crm.repository.MasterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
public class MasterService {

    private final MasterRepository repository;
    private final UserRepository userRepository;

    public MasterService(
        MasterRepository repository,
        UserRepository userRepository
    ) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Master> getAll() {
        return repository.findByDeletedFalse();
    }

    @Transactional
    public Master create(Master master) {
        master.setFullName(validateName(master.getFullName()));
        master.setEmail(normalizeEmail(master.getEmail()));
        master.setPhone(normalizePhone(master.getPhone()));

        if (userRepository.existsByEmailIgnoreCase(master.getEmail())) {
            throw new IllegalArgumentException("Этот email уже используется другим аккаунтом");
        }

        master.setDeleted(false);
        return repository.save(master);
    }

    @Transactional
    public Master update(Long id, Master data) {
        Master master = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Мастер не найден"));

        if (master.isDeleted()) {
            throw new RuntimeException("Мастер не найден");
        }

        String fullName = validateName(data.getFullName());
        String email = normalizeEmail(data.getEmail());
        String phone = normalizePhone(data.getPhone());

        var linkedUser = userRepository.findByMasterId(id);

        if (linkedUser.isPresent()) {
            User user = linkedUser.get();

            if (userRepository.existsByEmailIgnoreCaseAndIdNot(email, user.getId())) {
                throw new IllegalArgumentException("Этот email уже используется другим аккаунтом");
            }

            user.setFullName(fullName);
            user.setEmail(email);
            user.setPhone(phone);
        } else if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new IllegalArgumentException("Этот email уже используется другим аккаунтом");
        }

        master.setFullName(fullName);
        master.setSpecialization(data.getSpecialization());
        master.setPhone(phone);
        master.setEmail(email);

        return repository.save(master);
    }

    @Transactional
    public void delete(Long id) {
        Master master = repository.findById(id)
            .orElseThrow(() -> new RuntimeException("Мастер не найден"));

        master.setDeleted(true);
        repository.save(master);
    }

    private String normalizeEmail(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Укажите email мастера");
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
            throw new IllegalArgumentException("ФИО должно содержать от 1 до 100 символов");
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
}