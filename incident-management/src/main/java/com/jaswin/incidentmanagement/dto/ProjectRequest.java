package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;

@Data
public class ProjectRequest {
    @NotBlank
    private String name;

    private String description;

    private ProjectStatus status;

    private LocalDate startDate;

    private LocalDate endDate;

    private List<Long> serviceIds;
}
