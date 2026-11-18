package ru.angeliclik.crm.controller;

import ru.angeliclik.crm.model.Master;
import ru.angeliclik.crm.service.MasterService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@PreAuthorize("hasAnyRole('OWNER', 'ADMIN')")
@RequestMapping("/api/masters")
@CrossOrigin
public class MasterController {

    private final MasterService service;

    public MasterController(MasterService service) {
        this.service = service;
    }

    @GetMapping
    public List<Master> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Master create(@RequestBody Master master) {
        return service.create(master);
    }

    @PutMapping("/{id}")
    public Master update(@PathVariable Long id, @RequestBody Master master) {
        return service.update(id, master);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}