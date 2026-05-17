package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.Priority;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class TaskRequest {
    @NotBlank
    private String title;

    private String description;

    @NotNull
    private Long serviceId;

    private Long assignedToId;

    private String stage;

    private Priority priority;

    private LocalDateTime dueDate;
}
