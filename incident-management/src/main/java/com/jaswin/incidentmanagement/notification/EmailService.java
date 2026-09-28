package com.jaswin.incidentmanagement.notification;

import com.jaswin.incidentmanagement.entity.Incident;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendIncidentCreatedNotification(Incident incident, String toEmail) {
        String subject = "New Incident Created: [" + incident.getPriority() + "] " + incident.getTitle();
        String reporterName = incident.getReportedBy() != null ? incident.getReportedBy().getName() : "System";
        String text = String.format("A new incident has been created.\n\nID: %d\nTitle: %s\nPriority: %s\nReported By: %s\n\nDescription: %s",
                incident.getId(), incident.getTitle(), incident.getPriority(), reporterName, incident.getDescription());
        
        sendEmail(toEmail, subject, text, NotificationEventType.INCIDENT_CREATED);
    }

    public void sendIncidentResolvedNotification(Incident incident, String toEmail) {
        String subject = "Incident Resolved: " + incident.getTitle();
        String text = String.format("The following incident has been resolved.\n\nID: %d\nTitle: %s\nStatus: %s\n\nThank you.",
                incident.getId(), incident.getTitle(), incident.getStatus());

        sendEmail(toEmail, subject, text, NotificationEventType.INCIDENT_RESOLVED);
    }

    public void sendEscalationAlert(Incident incident, String toEmail) {
        String subject = "URGENT ESCALATION: Incident #" + incident.getId();
        String text = String.format("CRITICAL ALERT\n\nIncident '%s' (ID: %d) has breached SLA and has been escalated to %s priority.\n\nPlease take immediate action.",
                incident.getTitle(), incident.getId(), incident.getPriority());

        sendEmail(toEmail, subject, text, NotificationEventType.INCIDENT_ESCALATED);
    }

    private void sendEmail(String to, String subject, String text, NotificationEventType eventType) {
        if (fromEmail == null || fromEmail.isEmpty()) {
            log.warn("Mocking Email Send for Event {}: To: {}, Subject: {}", eventType, to, subject);
            return;
        }

        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
            log.info("Successfully sent {} email to {}", eventType, to);
        } catch (Exception e) {
            log.error("Failed to send {} email to {}: {}", eventType, to, e.getMessage());
        }
    }
}
