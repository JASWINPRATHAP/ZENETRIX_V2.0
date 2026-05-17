package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.DependencyType;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class ServiceDependencyRequest {
    @NotNull
    private Long fromServiceId;

    @NotNull
    private Long toServiceId;

    @NotNull
    private DependencyType dependencyType;
}
