package com.jaswin.incidentmanagement.escalation;

import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.enums.Priority;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class EscalationService {

    private final IncidentRepository incidentRepository;
    private final com.jaswin.incidentmanagement.notification.EmailService emailService;
    private final com.jaswin.incidentmanagement.repository.SlaPolicyRepository slaPolicyRepository;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;

    @Scheduled(fixedRate = 300000) // Runs every 5 minutes
    @Transactional
    public void evaluateEscalations() {
        log.info("Running Smart Escalation Engine...");

        List<Incident> openIncidents = incidentRepository.findByStatus(Status.OPEN, org.springframework.data.domain.Pageable.unpaged()).getContent();

        for (Incident incident : openIncidents) {
            if (incident.getOrganization() == null) continue;

            // Fetch dynamic SLA policy for this org and priority
            com.jaswin.incidentmanagement.entity.SlaPolicy policy = slaPolicyRepository
                    .findByOrganizationIdAndPriority(incident.getOrganization().getId(), incident.getPriority())
                    .orElse(null);

            // Default fallback if no custom policy exists (24h)
            int limitHours = (policy != null) ? policy.getResolutionTimeLimitHours() : 24;

            LocalDateTime threshold = LocalDateTime.now().minusHours(limitHours);

            if (incident.getCreatedAt().isBefore(threshold)) {
                log.info("SLA Breach detected for Incident {}. Limit: {}h", incident.getId(), limitHours);
                
                // Escalate priority
                Priority nextPriority = getNextPriority(incident.getPriority());
                if (nextPriority != incident.getPriority()) {
                    incident.setPriority(nextPriority);
                    incident = incidentRepository.save(incident);
                    
                    emailService.sendEscalationAlert(incident, "admin@zenetrix.local"); // Assuming admin email
                    
                    // Broadcast WebSocket Event
                    messagingTemplate.convertAndSend("/topic/incidents", "ESCALATION:" + incident.getId());
                }
            }
        }
    }

    private Priority getNextPriority(Priority current) {
        switch (current) {
            case LOW: return Priority.MEDIUM;
            case MEDIUM: return Priority.HIGH;
            case HIGH: return Priority.CRITICAL;
            default: return current;
        }
    }
}
