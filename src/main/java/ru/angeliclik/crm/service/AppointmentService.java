package ru.angeliclik.crm.service;

import ru.angeliclik.crm.auth.Role;
import ru.angeliclik.crm.auth.User;
import ru.angeliclik.crm.auth.UserRepository;
import ru.angeliclik.crm.dto.MasterAppointmentResponse;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
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
    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final MasterRepository masterRepository;

    public AppointmentService(
            AppointmentRepository appointmentRepository,
            ClientRepository clientRepository,
            MasterRepository masterRepository,
            UserRepository userRepository
    ) {
        this.appointmentRepository = appointmentRepository;
        this.clientRepository = clientRepository;
        this.masterRepository = masterRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Appointment> getAll() {
        return appointmentRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<MasterAppointmentResponse> getMyAppointments(String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Пользователь не найден"
                ));

        if (user.getRole() != Role.MASTER) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "Доступ разрешён только мастерам"
            );
        }

        if (user.getMaster() == null || user.getMaster().isDeleted()) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "К аккаунту не привязана активная карточка мастера"
            );
        }

        Long masterId = user.getMaster().getId();

        return appointmentRepository.findByMaster_IdOrderByStartTimeAsc(masterId)
                .stream()
                .map(appointment -> new MasterAppointmentResponse(
                        appointment.getId(),
                        appointment.getClient().getFullName(),
                        appointment.getClient().getPhone(),
                        appointment.getServiceName(),
                        appointment.getStartTime(),
                        appointment.getEndTime(),
                        appointment.getStatus(),
                        appointment.getNotes()
                ))
                .toList();
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