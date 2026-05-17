package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.OperationalDashboardResponse;
import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.entity.ServiceComponent;
import com.jaswin.incidentmanagement.enums.ProjectStatus;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OperationalDashboardService {

    private final TenantContextService tenantContext;
    private final ServiceComponentRepository serviceRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final TeamRepository teamRepository;
    private final ProjectRepository projectRepository;
    private final WorkTaskRepository taskRepository;
    private final IncidentRepository incidentRepository;

    public OperationalDashboardResponse dashboard() {
        Long orgId = tenantContext.currentOrganizationId();
        List<ServiceComponent> services = serviceRepository.findByOrganizationIdOrderByNameAsc(orgId);
        List<Incident> incidents = incidentRepository.findByOrganizationId(orgId, Pageable.unpaged()).getContent();

        long resolvedOrClosed = incidents.stream()
                .filter(incident -> incident.getStatus() == Status.RESOLVED || incident.getStatus() == Status.CLOSED)
                .count();
        double compliance = incidents.isEmpty()
                ? 100
                : Math.round((resolvedOrClosed * 1000.0 / incidents.size())) / 10.0;

        List<Map<String, Object>> heatmap = services.stream()
                .map(service -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("service", service.getName());
                    row.put("status", service.getStatus());
                    row.put("incidents", incidents.stream()
                            .filter(incident -> incident.getService() != null && incident.getService().getId().equals(service.getId()))
                            .count());
                    row.put("owner", service.getOwnerTeam() == null ? "Unassigned" : service.getOwnerTeam().getName());
                    return row;
                })
                .toList();

        List<Map<String, Object>> workload = taskRepository.findByOrganizationIdOrderByUpdatedAtDesc(orgId).stream()
                .collect(Collectors.groupingBy(task -> task.getAssignedTo() == null ? "Unassigned" : task.getAssignedTo().getName()))
                .entrySet()
                .stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("owner", entry.getKey());
                    row.put("tasks", entry.getValue().size());
                    row.put("blocked", entry.getValue().stream().filter(task -> "Blocked".equalsIgnoreCase(task.getStage())).count());
                    return row;
                })
                .sorted(Comparator.comparing(row -> row.get("owner").toString()))
                .toList();

        return OperationalDashboardResponse.builder()
                .serviceCount(serviceRepository.countByOrganizationId(orgId))
                .dependencyCount(dependencyRepository.countByOrganizationId(orgId))
                .teamCount(teamRepository.countByOrganizationId(orgId))
                .activeProjectCount(projectRepository.countByOrganizationIdAndStatus(orgId, ProjectStatus.ACTIVE))
                .activeTaskCount(taskRepository.countActiveByOrganization(orgId, "Done"))
                .openIncidentCount(incidentRepository.countByStatusAndOrganizationId(Status.OPEN, orgId))
                .criticalIncidentCount(incidentRepository.countByPriorityAndOrganizationId(com.jaswin.incidentmanagement.enums.Priority.CRITICAL, orgId))
                .slaComplianceRate(compliance)
                .heatmapByService(heatmap)
                .workloadByOwner(workload)
                .build();
    }
}
