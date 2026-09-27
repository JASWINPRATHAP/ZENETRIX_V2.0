package com.jaswin.incidentmanagement.authorization;

import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.IncidentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;

@Service("incidentAuthorizationService")
@RequiredArgsConstructor
public class IncidentAuthorizationService {

    private final IncidentRepository incidentRepository;

    public boolean canAccessIncident(Authentication authentication, Long incidentId) {
        User user = (User) authentication.getPrincipal();
        Incident incident = incidentRepository.findById(incidentId).orElse(null);

        if (incident == null) return false;

        if (user.getRole() == Role.SUPER_ADMIN) {
            return true;
        }

        // Must be in the same organization
        if (incident.getOrganization() != null && user.getOrganization() != null &&
            !incident.getOrganization().getId().equals(user.getOrganization().getId())) {
            return false;
        }

        if (user.getRole() == Role.ORG_ADMIN || user.getRole() == Role.MANAGER) {
            return true;
        }

        if (user.getRole() == Role.SUPPORT_ENGINEER) {
            return true;
        }

        if (user.getRole() == Role.EMPLOYEE) {
            boolean reportedByUser = incident.getReportedBy() != null && incident.getReportedBy().getId().equals(user.getId());
            boolean assignedToUser = incident.getAssignedTo() != null && incident.getAssignedTo().getId().equals(user.getId());
            return reportedByUser || assignedToUser;
        }

        return false;
    }

    public boolean canModifyIncident(Authentication authentication, Long incidentId) {
        User user = (User) authentication.getPrincipal();
        Incident incident = incidentRepository.findById(incidentId).orElse(null);

        if (incident == null) return false;

        if (user.getRole() == Role.SUPER_ADMIN || user.getRole() == Role.ORG_ADMIN || user.getRole() == Role.MANAGER) {
            return true;
        }

        // Support engineers (Dev/Tester) can modify if assigned to them or if unassigned (claiming)
        if (user.getRole() == Role.SUPPORT_ENGINEER) {
            return incident.getAssignedTo() == null || incident.getAssignedTo().getId().equals(user.getId());
        }

        // Employees cannot modify (e.g. status updates) once created
        return false;
    }
}
