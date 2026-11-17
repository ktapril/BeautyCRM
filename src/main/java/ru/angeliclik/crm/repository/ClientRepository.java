package ru.angeliclik.crm.repository;

import ru.angeliclik.crm.model.Client;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ClientRepository extends JpaRepository<Client, Long> {

    List<Client> findByDeletedFalse();

}
