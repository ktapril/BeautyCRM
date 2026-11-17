package ru.angeliclik.crm.service;

import ru.angeliclik.crm.model.Master;
import ru.angeliclik.crm.repository.MasterRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class MasterService {

    private final MasterRepository repository;

    public MasterService(MasterRepository repository) {
        this.repository = repository;
    }

    public List<Master> getAll() {
        return repository.findByDeletedFalse();
    }

    public Master create(Master master) {
        master.setDeleted(false);
        return repository.save(master);
    }

    public Master update(Long id, Master data) {
        Master master = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Мастер не найден"));

        if (master.isDeleted()) {
            throw new RuntimeException("Мастер не найден");
        }

        master.setFullName(data.getFullName());
        master.setSpecialization(data.getSpecialization());
        master.setPhone(data.getPhone());
        master.setEmail(data.getEmail());

        return repository.save(master);
    }

    public void delete(Long id) {
        Master master = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Мастер не найден"));

        master.setDeleted(true);
        repository.save(master);
    }
}