package ru.angeliclik.crm.controller;

import ru.angeliclik.crm.dto.MasterAppointmentResponse;
import ru.angeliclik.crm.service.AppointmentService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/appointments")
@PreAuthorize("hasRole('MASTER')")
@CrossOrigin
public class MasterAppointmentController {

    private final AppointmentService appointmentService;

    public MasterAppointmentController(AppointmentService appointmentService) {
        this.appointmentService = appointmentService;
    }

    @GetMapping("/my")
    public List<MasterAppointmentResponse> getMyAppointments(
            Authentication authentication
    ) {
        return appointmentService.getMyAppointments(authentication.getName());
    }
}
