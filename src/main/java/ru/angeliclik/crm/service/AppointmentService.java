package ru.angeliclik.crm.service;

import ru.angeliclik.crm.model.Appointment;
import ru.angeliclik.crm.model.Client;
import ru.angeliclik.crm.model.Master;
import ru.angeliclik.crm.repository.AppointmentRepository;
import ru.angeliclik.crm.repository.ClientRepository;
import ru.angeliclik.crm.repository.MasterRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final ClientRepository clientRepository;
    private final MasterRepository masterRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ClientRepository clientRepository,
            MasterRepository masterRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.clientRepository = clientRepository;
        this.masterRepository = masterRepository;
    }

    @Transactional(readOnly = true)
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
        Client client = clientRepository.findById(clientId)
                .orElseThrow(() -> new RuntimeException("Клиент не найден"));

        if (client.isDeleted()) {
            throw new RuntimeException("Клиент удалён");
        }

        Master master = masterRepository.findByIdAndDeletedFalse(masterId)
                .orElseThrow(() -> new RuntimeException("Мастер не найден или удалён"));

        if (durationMinutes == null || durationMinutes <= 0) {
            throw new RuntimeException("Некорректная длительность услуги");
        }

        if (startTime == null || !startTime.isAfter(LocalDateTime.now())) {
            throw new RuntimeException("Нельзя создать запись на прошедшее время");
        }

        LocalDateTime endTime = startTime.plusMinutes(durationMinutes);

        List<Appointment> conflicts =
                appointmentRepository
                        .findByMaster_IdAndStartTimeLessThanAndEndTimeGreaterThanAndStatusNot(
                                masterId,
                                endTime,
                                startTime,
                                "CANCELED"
                        );

        if (!conflicts.isEmpty()) {
            throw new RuntimeException("Мастер уже занят в это время");
        }

        Appointment appointment = new Appointment();
        appointment.setClient(client);
        appointment.setMaster(master);
        appointment.setServiceName(serviceName);
        appointment.setStartTime(startTime);
        appointment.setEndTime(endTime);
        appointment.setStatus("SCHEDULED");
        appointment.setNotes(notes);

        return appointmentRepository.save(appointment);
    }
}