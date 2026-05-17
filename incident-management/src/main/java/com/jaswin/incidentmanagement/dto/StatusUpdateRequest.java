package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.Status;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class StatusUpdateRequest {

    @NotNull(message = "Status is required")
    private Status status;
}
