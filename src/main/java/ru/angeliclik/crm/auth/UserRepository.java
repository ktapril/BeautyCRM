package ru.angeliclik.crm.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCaseAndIdNot(String email, Long id);

    boolean existsByRole(Role role);

    boolean existsByMasterId(Long masterId);

    Optional<User> findByMasterId(Long masterId);

    boolean existsByClientId(Long clientId);

    Optional<User> findByClientId(Long clientId);
}