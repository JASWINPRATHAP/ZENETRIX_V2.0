package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.OperationalDashboardResponse;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.UserRepository;
import com.jaswin.incidentmanagement.service.OperationalDashboardService;
import com.jaswin.incidentmanagement.service.TenantContextService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org")
@RequiredArgsConstructor
public class OperationsController {

    private final OperationalDashboardService dashboardService;
    private final TenantContextService tenantContext;
    private final UserRepository userRepository;

    @GetMapping("/dashboard")
    public OperationalDashboardResponse dashboard() {
        return dashboardService.dashboard();
    }

    @GetMapping("/users")
    public List<User> users() {
        return userRepository.findByOrganizationIdOrderByNameAsc(tenantContext.currentOrganizationId());
    }

    @PutMapping("/users/{id}/promote")
    public User promoteToManager(@PathVariable Long id) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        User user = userRepository.findByIdAndOrganizationId(id, tenantContext.currentOrganizationId())
                .orElseThrow(() -> new java.util.NoSuchElementException("User not found"));
        user.setRole(Role.MANAGER);
        return userRepository.save(user);
    }
}
