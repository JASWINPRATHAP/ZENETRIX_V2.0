package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.CreateOrgUserRequest;
import com.jaswin.incidentmanagement.dto.OperationalDashboardResponse;
import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.entity.TeamMember;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.TeamMemberRepository;
import com.jaswin.incidentmanagement.repository.TeamRepository;
import com.jaswin.incidentmanagement.repository.UserRepository;
import com.jaswin.incidentmanagement.service.OperationalDashboardService;
import com.jaswin.incidentmanagement.service.TenantContextService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationalDashboardService dashboardService;
    private final TenantContextService tenantContext;
    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/dashboard")
    public OperationalDashboardResponse dashboard() {
        return dashboardService.dashboard();
    }

    @GetMapping("/users")
    public List<User> users() {
        return userRepository.findByOrganizationIdOrderByNameAsc(tenantContext.currentOrganizationId());
    }

    @PostMapping("/users")
    @Transactional
    public ResponseEntity<User> createOrgUser(@Valid @RequestBody CreateOrgUserRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Organization org = tenantContext.currentOrganization();

        // Enforce role hierarchy: Org Admin can only provision Team Leads, Dev/Testers, and End Employees
        if (request.getRole() == Role.SUPER_ADMIN || request.getRole() == Role.ORG_ADMIN) {
            throw new IllegalArgumentException("Org Admins can only provision Team Leads (MANAGER), Dev/Testers (SUPPORT_ENGINEER), or End Employees (EMPLOYEE).");
        }

        String email = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("User with email " + email + " already exists.");
        }

        String rawPassword = (request.getPassword() == null || request.getPassword().isBlank())
                ? "password"
                : request.getPassword().trim();

        User user = User.builder()
                .name(request.getName().trim())
                .email(email)
                .password(passwordEncoder.encode(rawPassword))
                .role(request.getRole())
                .team(request.getTeam())
                .organization(org)
                .build();

        user = userRepository.save(user);

        if (request.getTeamId() != null) {
            final User savedUser = user;
            teamRepository.findByIdAndOrganizationId(request.getTeamId(), org.getId())
                    .ifPresent(team -> {
                        teamMemberRepository.save(TeamMember.builder()
                                .team(team)
                                .user(savedUser)
                                .build());
                    });
        }

        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @PutMapping("/users/{id}/promote")
    public User promoteToManager(@PathVariable Long id) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        User user = userRepository.findByIdAndOrganizationId(id, tenantContext.currentOrganizationId())
                .orElseThrow(() -> new java.util.NoSuchElementException("User not found"));
        user.setRole(Role.MANAGER);
        return userRepository.save(user);
    }

    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        User currentUser = tenantContext.currentUser();
        if (currentUser.getId().equals(id)) {
            throw new IllegalArgumentException("Cannot delete your own administrative account.");
        }
        User user = userRepository.findByIdAndOrganizationId(id, tenantContext.currentOrganizationId())
                .orElseThrow(() -> new java.util.NoSuchElementException("User not found"));
        
        teamMemberRepository.deleteByUserId(id);
        userRepository.delete(user);
        return ResponseEntity.noContent().build();
    }
}
