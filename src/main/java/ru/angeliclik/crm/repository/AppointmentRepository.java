package ru.angeliclik.crm.repository;

import ru.angeliclik.crm.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    List<Appointment> findByMaster_IdOrderByStartTimeAsc(Long masterId);

    List<Appointment> findByMaster_IdAndStartTimeBetween(
            Long masterId,
            LocalDateTime from,
            LocalDateTime to
    );

    List<Appointment> findByClient_Id(Long clientId);

    List<Appointment> findByMaster_IdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
            Long masterId,
            LocalDateTime endTime,
            LocalDateTime startTime,
            String status
    );
}