package com.jaswin.incidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OnboardingStatusResponse {

    private Boolean isCompleted;
    private Integer currentStep;
    private long serviceCount;
    private long dependencyCount;
    private long teamCount;
    private long servicesWithOwnerCount;
    private long slaPolicyCount;
    private long managerCount;
    private List<StepStatus> steps;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StepStatus {
        private int stepNumber;
        private String name;
        private String description;
        private boolean isDone;
        private String statusText;
    }
}
