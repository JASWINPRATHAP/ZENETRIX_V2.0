package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.BlastRadiusReport;
import com.jaswin.incidentmanagement.entity.*;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BlastRadiusService {

    private final IncidentService incidentService;
    private final ServiceDependencyRepository dependencyRepository;
    private final WorkTaskRepository taskRepository;
    private final IncidentRepository incidentRepository;
    private final TeamMemberRepository teamMemberRepository;

    public BlastRadiusReport calculate(Long incidentId) {
        Incident incident = incidentService.getIncidentById(incidentId);
        if (incident.getService() == null || incident.getOrganization() == null) {
            return emptyReport();
        }

        Long orgId = incident.getOrganization().getId();
        Map<Long, BlastRadiusReport.AffectedService> affected = new LinkedHashMap<>();
        Deque<ServiceHop> queue = new ArrayDeque<>();
        queue.add(new ServiceHop(incident.getService(), "source", 0));

        while (!queue.isEmpty()) {
            ServiceHop hop = queue.removeFirst();
            affected.putIfAbsent(hop.service().getId(), BlastRadiusReport.AffectedService.builder()
                    .id(hop.service().getId())
                    .name(hop.service().getName())
                    .dependencyType(hop.dependencyType())
                    .ownerTeam(hop.service().getOwnerTeam() == null ? "Unassigned" : hop.service().getOwnerTeam().getName())
                    .depth(hop.depth())
                    .build());

            dependencyRepository.findByToServiceIdAndOrganizationId(hop.service().getId(), orgId)
                    .forEach(dependency -> {
                        ServiceComponent dependent = dependency.getFromService();
                        if (!affected.containsKey(dependent.getId())) {
                            queue.add(new ServiceHop(dependent, dependency.getDependencyType().name().toLowerCase(), hop.depth() + 1));
                        }
                    });
        }

        List<Long> serviceIds = new ArrayList<>(affected.keySet());
        List<WorkTask> activeTasks = taskRepository.findActiveByOrganizationAndServices(orgId, serviceIds, "Done");
        List<Incident> riskyIncidents = incidentRepository.findByOrganizationIdAndServiceIdInAndStatusIn(
                orgId, serviceIds, List.of(Status.OPEN, Status.IN_PROGRESS));

        List<BlastRadiusReport.BlockedTeam> blockedTeams = buildBlockedTeams(serviceIds, activeTasks);
        List<BlastRadiusReport.TaskRisk> taskRisks = activeTasks.stream()
                .map(task -> BlastRadiusReport.TaskRisk.builder()
                        .taskId(task.getId())
                        .title(task.getTitle())
                        .assignedTo(task.getAssignedTo() == null ? "Unassigned" : task.getAssignedTo().getName())
                        .dueDate(task.getDueDate() == null ? null : task.getDueDate().toString())
                        .serviceName(task.getService().getName())
                        .build())
                .toList();

        List<BlastRadiusReport.SlaRisk> slaRisks = riskyIncidents.stream()
                .filter(item -> item.getSlaDeadline() != null)
                .map(item -> {
                    long minutes = Duration.between(LocalDateTime.now(), item.getSlaDeadline()).toMinutes();
                    return BlastRadiusReport.SlaRisk.builder()
                            .incidentId(item.getId())
                            .title(item.getTitle())
                            .minutesRemaining(minutes)
                            .severity(minutes <= 0 ? "breached" : minutes < 60 ? "critical" : minutes < 240 ? "high" : "watch")
                            .build();
                })
                .sorted(Comparator.comparingLong(BlastRadiusReport.SlaRisk::getMinutesRemaining))
                .toList();

        int impactScore = Math.min(100,
                affected.size() * 12
                        + blockedTeams.size() * 10
                        + activeTasks.size() * 5
                        + (int) slaRisks.stream().filter(risk -> risk.getMinutesRemaining() <= 60).count() * 15);

        return BlastRadiusReport.builder()
                .affectedServices(new ArrayList<>(affected.values()))
                .blockedTeams(blockedTeams)
                .tasksAtRisk(taskRisks)
                .slaAtRisk(slaRisks)
                .estimatedImpactScore(impactScore)
                .severity(toSeverity(impactScore))
                .build();
    }

    private List<BlastRadiusReport.BlockedTeam> buildBlockedTeams(List<Long> serviceIds, List<WorkTask> activeTasks) {
        Map<Long, List<WorkTask>> tasksByTeam = activeTasks.stream()
                .filter(task -> task.getService().getOwnerTeam() != null && serviceIds.contains(task.getService().getId()))
                .collect(Collectors.groupingBy(task -> task.getService().getOwnerTeam().getId()));

        return tasksByTeam.entrySet().stream()
                .map(entry -> {
                    Team team = entry.getValue().get(0).getService().getOwnerTeam();
                    List<String> members = teamMemberRepository.findByTeamId(team.getId()).stream()
                            .map(member -> member.getUser().getName())
                            .toList();
                    return BlastRadiusReport.BlockedTeam.builder()
                            .id(team.getId())
                            .teamName(team.getName())
                            .leadId(team.getLead() == null ? null : team.getLead().getId())
                            .leadName(team.getLead() == null ? "Unassigned" : team.getLead().getName())
                            .activeTaskCount(entry.getValue().size())
                            .members(members)
                            .build();
                })
                .sorted(Comparator.comparingLong(BlastRadiusReport.BlockedTeam::getActiveTaskCount).reversed())
                .toList();
    }

    private BlastRadiusReport emptyReport() {
        return BlastRadiusReport.builder()
                .affectedServices(List.of())
                .blockedTeams(List.of())
                .slaAtRisk(List.of())
                .tasksAtRisk(List.of())
                .estimatedImpactScore(0)
                .severity("low")
                .build();
    }

    private String toSeverity(int score) {
        if (score >= 75) return "critical";
        if (score >= 50) return "high";
        if (score >= 25) return "medium";
        return "low";
    }

    private record ServiceHop(ServiceComponent service, String dependencyType, int depth) {
    }
}
