package com.jaswin.incidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OperationalDashboardResponse {
    private long serviceCount;
    private long dependencyCount;
    private long teamCount;
    private long activeProjectCount;
    private long activeTaskCount;
    private long openIncidentCount;
    private long criticalIncidentCount;
    private double slaComplianceRate;
    private List<Map<String, Object>> heatmapByService;
    private List<Map<String, Object>> workloadByOwner;
}
