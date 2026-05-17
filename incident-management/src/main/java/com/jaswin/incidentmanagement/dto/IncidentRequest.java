package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class IncidentRequest {

    @NotBlank(message = "Title is required")
    private String title;

    private String description;

    @NotNull(message = "Priority is required")
    private Priority priority;

    private String reportedBy;

    private Long taskId;

    private Long serviceId;

    private Long assignedToId;
}
