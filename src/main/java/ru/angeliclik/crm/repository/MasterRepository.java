package ru.angeliclik.crm.repository;

import ru.angeliclik.crm.model.Master;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MasterRepository extends JpaRepository<Master, Long> {
    List<Master> findByDeletedFalse();
}