package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.ServiceStatus;
import com.jaswin.incidentmanagement.enums.ServiceType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServiceComponentRequest {
    @NotBlank
    private String name;

    @NotNull
    private ServiceType type;

    private String customType;

    private String description;

    private Long ownerTeamId;

    private ServiceStatus status;
}
