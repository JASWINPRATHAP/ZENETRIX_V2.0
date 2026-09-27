package com.jaswin.incidentmanagement.dto;

import com.jaswin.incidentmanagement.enums.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateOrgUserRequest {

    @NotBlank(message = "Employee name is required")
    private String name;

    @NotBlank(message = "Employee email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String password;

    @NotNull(message = "User type / role is required")
    private Role role; // MANAGER (Team Lead), SUPPORT_ENGINEER (Dev/Tester), EMPLOYEE (End Employee)

    private String team;

    private Long teamId;
}
