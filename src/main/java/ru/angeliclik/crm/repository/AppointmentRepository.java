package ru.angeliclik.crm.repository;

import ru.angeliclik.crm.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByMasterIdAndStartTimeBetween(
            Long masterId,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Appointment> findByClientId(Long clientId);

    List<Appointment> findByMasterIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
            Long masterId,
            LocalDateTime endTime,
            LocalDateTime startTime,
            String status
    );
}