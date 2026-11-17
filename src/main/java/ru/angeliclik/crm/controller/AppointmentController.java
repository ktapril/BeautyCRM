package ru.angeliclik.crm.controller;

import ru.angeliclik.crm.dto.AppointmentRequest;
import ru.angeliclik.crm.model.Appointment;
import ru.angeliclik.crm.service.AppointmentService;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin
public class AppointmentController {

    private final AppointmentService service;

    public AppointmentController(AppointmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Appointment> getAll() {
        return service.getAll();
    }

    @PostMapping
    public Appointment create(@RequestBody AppointmentRequest request) {
        return service.create(
                request.getClientId(),
                request.getMasterId(),
                request.getServiceName(),
                request.getStartTime(),
                request.getDurationMinutes(),
                request.getNotes()
        );
    }
}