package ru.angeliclik.crm.controller;

import ru.angeliclik.crm.model.Client;
import ru.angeliclik.crm.service.ClientService;
import ru.angeliclik.crm.service.FileStorageService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
@RequestMapping("/api/clients")
@CrossOrigin
public class ClientController {

    private final ClientService service;
    private final FileStorageService fileStorageService;

    public ClientController(ClientService service, FileStorageService fileStorageService) {
        this.service = service;
        this.fileStorageService = fileStorageService;
    }

    @GetMapping
    public List<Client> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Client create(@RequestBody Client client) {
        return service.create(client);
    }

    @PutMapping("/{id}")
    public Client update(@PathVariable Long id, @RequestBody Client updated) {
        return service.update(id, updated);
    }

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public Client uploadPhoto(
            @PathVariable Long id,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        String photoUrl = fileStorageService.saveClientPhoto(file);
        return service.updatePhoto(id, photoUrl);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}