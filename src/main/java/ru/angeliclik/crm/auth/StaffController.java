package ru.angeliclik.crm.auth;

import ru.angeliclik.crm.auth.dto.StaffRequest;
import ru.angeliclik.crm.auth.dto.StaffResponse;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@PreAuthorize("hasRole('OWNER')")
public class StaffController {

    private final StaffService staffService;

    public StaffController(StaffService staffService) {
        this.staffService = staffService;
    }

    @GetMapping
    public List<StaffResponse> getAll() {
        return staffService.getAll();
    }

    @PostMapping
    public StaffResponse create(@RequestBody StaffRequest request) {
        return staffService.create(request);
    }

    @PutMapping("/{id}")
    public StaffResponse update(
        @PathVariable Long id,
        @RequestBody StaffRequest request
    ) {
        return staffService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public StaffResponse setEnabled(
        @PathVariable Long id,
        @RequestParam boolean enabled
    ) {
        return staffService.setEnabled(id, enabled);
    }
}