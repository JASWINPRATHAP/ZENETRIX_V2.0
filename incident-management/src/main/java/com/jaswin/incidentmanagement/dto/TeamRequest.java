package com.jaswin.incidentmanagement.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class TeamRequest {
    @NotBlank
    private String name;

    private Long leadId;
}
