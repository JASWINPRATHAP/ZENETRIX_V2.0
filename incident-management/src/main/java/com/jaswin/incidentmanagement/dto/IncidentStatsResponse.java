package com.jaswin.incidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class IncidentStatsResponse {
    private long totalIncidents;
    private long openIncidents;
    private long inProgressIncidents;
    private long resolvedIncidents;
    private long closedIncidents;
    private long highPriorityIncidents;
    private long criticalPriorityIncidents;
}
