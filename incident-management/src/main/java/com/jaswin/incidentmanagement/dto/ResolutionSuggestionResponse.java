package com.jaswin.incidentmanagement.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResolutionSuggestionResponse {
    private Long incidentId;
    private String title;
    private String resolutionNotes;
    private String resolvedBy;
    private long resolvedInHours;
    private int score;
}
