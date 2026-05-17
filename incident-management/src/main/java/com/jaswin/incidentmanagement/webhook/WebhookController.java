package com.jaswin.incidentmanagement.webhook;

import com.jaswin.incidentmanagement.dto.IncidentRequest;
import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.repository.IncidentRepository;
import com.jaswin.incidentmanagement.repository.OrganizationRepository;
import com.jaswin.incidentmanagement.notification.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/webhooks")
@RequiredArgsConstructor
@Slf4j
public class WebhookController {

    private final WebhookAuthService webhookAuthService;
    private final IncidentRepository incidentRepository;
    private final OrganizationRepository organizationRepository;
    private final EmailService emailService;

    @PostMapping("/incident")
    public ResponseEntity<String> receiveIncidentWebhook(
            @RequestHeader(value = "X-API-KEY", required = false) String apiKey,
            @RequestBody WebhookIncidentRequest request) {

        if (!webhookAuthService.validateApiKey(apiKey)) {
            log.warn("Unauthorized webhook attempt");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Invalid API Key");
        }

        Organization org = null;
        if (request.getOrganizationId() != null) {
            org = organizationRepository.findById(request.getOrganizationId()).orElse(null);
        }

        Incident incident = Incident.builder()
                .title("[WEBHOOK] " + request.getAlertName())
                .description(request.getAlertDescription() + "\n\nSource: " + request.getSourceSystem())
                .priority(request.getPriority())
                .organization(org)
                .status(Status.OPEN)
                .build();

        incident = incidentRepository.save(incident);
        log.info("Incident created successfully via webhook. ID: {}", incident.getId());
        
        // Let's assume there's an admin email. In a real system, we'd fetch org admins.
        emailService.sendIncidentCreatedNotification(incident, "admin@zenetrix.local");

        return ResponseEntity.status(HttpStatus.CREATED).body("Incident created from webhook. ID: " + incident.getId());
    }
}
