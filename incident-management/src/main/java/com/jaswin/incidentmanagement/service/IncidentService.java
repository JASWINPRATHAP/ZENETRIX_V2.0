package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.IncidentRequest;
import com.jaswin.incidentmanagement.dto.IncidentStatsResponse;
import com.jaswin.incidentmanagement.dto.ResolveIncidentRequest;
import com.jaswin.incidentmanagement.dto.StatusUpdateRequest;
import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.entity.Project;
import com.jaswin.incidentmanagement.entity.ServiceComponent;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.entity.WorkTask;
import com.jaswin.incidentmanagement.enums.Priority;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.exception.IncidentNotFoundException;
import com.jaswin.incidentmanagement.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IncidentService {

    private final IncidentRepository incidentRepository;
    private final com.jaswin.incidentmanagement.notification.EmailService emailService;
    private final com.jaswin.incidentmanagement.repository.IncidentHistoryRepository incidentHistoryRepository;
    private final com.jaswin.incidentmanagement.assignment.AssignmentEngine assignmentEngine;
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final com.jaswin.incidentmanagement.repository.WorkTaskRepository taskRepository;
    private final com.jaswin.incidentmanagement.repository.ServiceComponentRepository serviceRepository;
    private final com.jaswin.incidentmanagement.repository.UserRepository userRepository;
    private final com.jaswin.incidentmanagement.repository.SlaPolicyRepository slaPolicyRepository;

    // CREATE incident
    public Incident createIncident(IncidentRequest request) {
        User currentUser = getCurrentUser();
        WorkTask task = null;
        Project project = null;
        ServiceComponent service = null;

        if (request.getTaskId() != null) {
            task = taskRepository.findByIdAndOrganizationId(request.getTaskId(), currentUser.getOrganization().getId())
                    .orElseThrow(() -> new RuntimeException("Task not found"));
            if (currentUser.getRole() == Role.EMPLOYEE
                    && (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(currentUser.getId()))) {
                throw new RuntimeException("Employees can only raise incidents on their assigned tasks");
            }
            project = task.getProject();
            service = task.getService();
        } else if (request.getServiceId() != null) {
            service = serviceRepository.findByIdAndOrganizationId(request.getServiceId(), currentUser.getOrganization().getId())
                    .orElseThrow(() -> new RuntimeException("Service not found"));
        }

        User assignedTo = null;
        if (request.getAssignedToId() != null) {
            assignedTo = userRepository.findByIdAndOrganizationId(request.getAssignedToId(), currentUser.getOrganization().getId())
                    .orElseThrow(() -> new RuntimeException("Assigned user not found"));
        }

        Incident incident = Incident.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .priority(request.getPriority())
                .reportedBy(currentUser)
                .organization(currentUser.getOrganization())
                .assignedTo(assignedTo)
                .task(task)
                .project(project)
                .service(service)
                .status(Status.OPEN)
                .slaDeadline(calculateSlaDeadline(currentUser, request.getPriority()))
                .slaBreached(false)
                .build();
        
        // Smart Assignment Engine Flow
        if (incident.getAssignedTo() == null) {
            assignmentEngine.autoAssignIncident(incident);
        }
        
        incident = incidentRepository.save(incident);
        
        logHistory(incident, null, Status.OPEN, currentUser.getName(), "Incident Created");
        
        emailService.sendIncidentCreatedNotification(incident, currentUser.getEmail());
        
        // Broadcast WebSocket Event
        messagingTemplate.convertAndSend("/topic/incidents", "NEW_INCIDENT:" + incident.getId());
        
        return incident;
    }

    // GET ALL incidents for tenant
    public org.springframework.data.domain.Page<Incident> getAllIncidents(org.springframework.data.domain.Pageable pageable) {
        Long orgId = getCurrentUserOrgId();
        if (orgId == null) return incidentRepository.findAll(pageable); // SUPER_ADMIN
        return incidentRepository.findByOrganizationId(orgId, pageable);
    }

    // GET incident by ID with tenant check
    public Incident getIncidentById(Long id) {
        Incident incident = incidentRepository.findById(id)
                .orElseThrow(() -> new IncidentNotFoundException("Incident not found with id: " + id));
        
        Long orgId = getCurrentUserOrgId();
        if (orgId != null && !incident.getOrganization().getId().equals(orgId)) {
            throw new RuntimeException("Access Denied to this incident");
        }
        return incident;
    }

    // GET incident history
    public List<com.jaswin.incidentmanagement.entity.IncidentHistory> getIncidentHistory(Long id) {
        // First verify access via getIncidentById
        Incident incident = getIncidentById(id);
        return incidentHistoryRepository.findByIncidentIdOrderByUpdatedAtDesc(incident.getId());
    }

    // UPDATE status
    public Incident updateStatus(Long id, StatusUpdateRequest request) {
        Incident incident = getIncidentById(id);
        Status oldStatus = incident.getStatus();
        incident.setStatus(request.getStatus());
        if (request.getStatus() == Status.RESOLVED || request.getStatus() == Status.CLOSED) {
            incident.setResolvedAt(LocalDateTime.now());
        }
        incident = incidentRepository.save(incident);
        
        User currentUser = getCurrentUser();
        logHistory(incident, oldStatus, request.getStatus(), currentUser.getName(), "Status manually updated");
        
        if (incident.getStatus() == Status.RESOLVED || incident.getStatus() == Status.CLOSED) {
            emailService.sendIncidentResolvedNotification(incident, currentUser.getEmail());
        }
        
        // Broadcast WebSocket Event
        messagingTemplate.convertAndSend("/topic/incidents", "STATUS_UPDATE:" + incident.getId());
        
        return incident;
    }

    public Incident resolveIncident(Long id, ResolveIncidentRequest request) {
        Incident incident = getIncidentById(id);
        Status oldStatus = incident.getStatus();
        incident.setStatus(Status.RESOLVED);
        incident.setResolutionNotes(request.getResolutionNotes());
        incident.setResolvedVia(request.getResolvedVia() == null ? "manual" : request.getResolvedVia());
        incident.setResolvedAt(LocalDateTime.now());
        incident = incidentRepository.save(incident);

        User currentUser = getCurrentUser();
        logHistory(incident, oldStatus, Status.RESOLVED, currentUser.getName(), "Incident resolved");
        emailService.sendIncidentResolvedNotification(incident, currentUser.getEmail());
        messagingTemplate.convertAndSend("/topic/incidents", "RESOLVED:" + incident.getId());
        return incident;
    }
    
    private void logHistory(Incident incident, Status oldStatus, Status newStatus, String updatedBy, String changeReason) {
        com.jaswin.incidentmanagement.entity.IncidentHistory history = com.jaswin.incidentmanagement.entity.IncidentHistory.builder()
                .incident(incident)
                .oldStatus(oldStatus)
                .newStatus(newStatus)
                .updatedBy(updatedBy)
                .changeReason(changeReason)
                .build();
        incidentHistoryRepository.save(history);
    }

    // FILTER by status and/or priority for tenant
    public org.springframework.data.domain.Page<Incident> filterIncidents(Status status, Priority priority, org.springframework.data.domain.Pageable pageable) {
        Long orgId = getCurrentUserOrgId();
        if (orgId == null) {
            // Fallback for SUPER_ADMIN
            if (status != null && priority != null) return incidentRepository.findByStatusAndPriority(status, priority, pageable);
            if (status != null) return incidentRepository.findByStatus(status, pageable);
            if (priority != null) return incidentRepository.findByPriority(priority, pageable);
            return incidentRepository.findAll(pageable);
        }

        if (status != null && priority != null) {
            return incidentRepository.findByStatusAndPriorityAndOrganizationId(status, priority, orgId, pageable);
        } else if (status != null) {
            return incidentRepository.findByStatusAndOrganizationId(status, orgId, pageable);
        } else if (priority != null) {
            return incidentRepository.findByPriorityAndOrganizationId(priority, orgId, pageable);
        }
        return incidentRepository.findByOrganizationId(orgId, pageable);
    }

    // DELETE incident
    public void deleteIncident(Long id) {
        Incident incident = getIncidentById(id);
        incidentRepository.delete(incident);
    }

    // ANALYTICS / STATS
    public IncidentStatsResponse getStats() {
        Long orgId = getCurrentUserOrgId();
        if (orgId == null) {
            return new IncidentStatsResponse(
                incidentRepository.count(),
                incidentRepository.countByStatus(Status.OPEN),
                incidentRepository.countByStatus(Status.IN_PROGRESS),
                incidentRepository.countByStatus(Status.RESOLVED),
                incidentRepository.countByStatus(Status.CLOSED),
                incidentRepository.countByPriority(Priority.HIGH),
                incidentRepository.countByPriority(Priority.CRITICAL)
            );
        }

        long total = incidentRepository.countByOrganizationId(orgId);
        long open = incidentRepository.countByStatusAndOrganizationId(Status.OPEN, orgId);
        long inProgress = incidentRepository.countByStatusAndOrganizationId(Status.IN_PROGRESS, orgId);
        long resolved = incidentRepository.countByStatusAndOrganizationId(Status.RESOLVED, orgId);
        long closed = incidentRepository.countByStatusAndOrganizationId(Status.CLOSED, orgId);
        long high = incidentRepository.countByPriorityAndOrganizationId(Priority.HIGH, orgId);
        long critical = incidentRepository.countByPriorityAndOrganizationId(Priority.CRITICAL, orgId);

        return new IncidentStatsResponse(total, open, inProgress, resolved, closed, high, critical);
    }

    private User getCurrentUser() {
        Object principal = org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User) {
            return (User) principal;
        }
        throw new RuntimeException("User not authenticated");
    }

    private Long getCurrentUserOrgId() {
        User user = getCurrentUser();
        return (user.getOrganization() != null) ? user.getOrganization().getId() : null;
    }

    private LocalDateTime calculateSlaDeadline(User currentUser, Priority priority) {
        int fallbackMinutes = switch (priority) {
            case CRITICAL -> 60;
            case HIGH -> 240;
            case MEDIUM -> 1440;
            case LOW -> 4320;
        };
        if (currentUser.getOrganization() == null) {
            return LocalDateTime.now().plusMinutes(fallbackMinutes);
        }
        return slaPolicyRepository
                .findByOrganizationIdAndPriority(currentUser.getOrganization().getId(), priority)
                .map(policy -> LocalDateTime.now().plusHours(policy.getResolutionTimeLimitHours()))
                .orElseGet(() -> LocalDateTime.now().plusMinutes(fallbackMinutes));
    }
}
