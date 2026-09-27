package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.Plan;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateOrganizationRequest {

    @NotBlank(message = "Organization name is required")
    private String name;

    @NotBlank(message = "Domain is required")
    private String domain;

    private String slug;

    private Plan plan;

    @NotBlank(message = "Admin name is required")
    private String adminName;

    @NotBlank(message = "Admin email is required")
    @Email(message = "Valid email is required")
    private String adminEmail;

    private String adminPassword;
}
