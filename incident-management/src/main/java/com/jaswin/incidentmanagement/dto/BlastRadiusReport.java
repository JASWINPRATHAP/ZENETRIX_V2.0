package com.jaswin.incidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlastRadiusReport {
    private List<AffectedService> affectedServices;
    private List<BlockedTeam> blockedTeams;
    private List<SlaRisk> slaAtRisk;
    private List<TaskRisk> tasksAtRisk;
    private int estimatedImpactScore;
    private String severity;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AffectedService {
        private Long id;
        private String name;
        private String dependencyType;
        private String ownerTeam;
        private int depth;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BlockedTeam {
        private Long id;
        private String teamName;
        private Long leadId;
        private String leadName;
        private long activeTaskCount;
        private List<String> members;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SlaRisk {
        private Long incidentId;
        private String title;
        private long minutesRemaining;
        private String severity;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TaskRisk {
        private Long taskId;
        private String title;
        private String assignedTo;
        private String dueDate;
        private String serviceName;
    }
}
