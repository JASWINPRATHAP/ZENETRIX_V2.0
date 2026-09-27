package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.Plan;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OrganizationSummaryResponse {

    private Long id;
    private String name;
    private String domain;
    private String slug;
    private Plan plan;
    private Boolean isActive;
    private Boolean onboardingCompleted;
    private Integer setupStep;
    private long userCount;
    private long serviceCount;
    private long activeIncidentCount;
    private LocalDateTime createdAt;
}
