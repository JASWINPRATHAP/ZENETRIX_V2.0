package com.jaswin.incidentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class ResolveIncidentRequest {
    @NotBlank
    private String resolutionNotes;

    private String resolvedVia;
}
