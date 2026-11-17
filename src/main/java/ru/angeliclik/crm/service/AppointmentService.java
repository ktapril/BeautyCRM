package ru.angeliclik.crm.service;

import ru.angeliclik.crm.model.Appointment;
import ru.angeliclik.crm.repository.AppointmentRepository;
import ru.angeliclik.crm.repository.ClientRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ClientRepository clientRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.clientRepository = clientRepository;
    }

    public List<Appointment> getAll() {
        return appointmentRepository.findAll();
    }

    @Transactional
    public Appointment create(
            Long clientId,
            Long masterId,
            String serviceName,
            LocalDateTime startTime,
            Integer durationMinutes,
            String notes
    ) {
        if (!clientRepository.existsById(clientId)) {
            throw new RuntimeException("Клиент не найден");
        }

        if (durationMinutes == null || durationMinutes <= 0) {
            throw new RuntimeException("Некорректная длительность услуги");
        }

        if (startTime == null || !startTime.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Нельзя создать запись на прошедшее время");
        }

        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);

        List<Appointment> conflicts =
                appointmentRepository
                        .findByMasterIdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
                                masterId,
                                endTime,
                                startTime,
                                "CANCELED"
                        );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Мастер уже занят в это время");
        }

        Appointment appointment = new Appointment();
        appointment.setClientId(clientId);
        appointment.setMasterId(masterId);
        appointment.setServiceName(serviceName);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus("SCHEDULED");
        appointment.setNotes(notes);

        return appointmentRepository.save(appointment);
    }
}