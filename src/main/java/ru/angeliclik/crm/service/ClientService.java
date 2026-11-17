package ru.angeliclik.crm.service;

import ru.angeliclik.crm.model.Client;
import ru.angeliclik.crm.repository.ClientRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ClientService {

    private final ClientRepository repository;

    public ClientService(ClientRepository repository) {
        this.repository = repository;
    }

    public List<Client> getAll() {
        return repository.findByDeletedFalse();
    }

    public Client create(Client client) {
        return repository.save(client);
    }

    public Client update(Long id, Client updated) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Клиент не найден"));

        client.setFullName(updated.getFullName());
        client.setPhone(updated.getPhone());
        client.setEmail(updated.getEmail());
        client.setNotes(updated.getNotes());

        return repository.save(client);
    }

    public Client updatePhoto(Long id, String photoUrl) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Клиент не найден"));

        client.setPhotoUrl(photoUrl);
        return repository.save(client);
    }

    public void delete(Long id) {
        Client client = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Клиент не найден"));

        client.setDeleted(true);
        repository.save(client);
    }
}