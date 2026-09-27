package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.CreateOrganizationRequest;
import com.jaswin.incidentmanagement.dto.OrganizationSummaryResponse;
import com.jaswin.incidentmanagement.service.PlatformService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/platform")
@RequiredArgsConstructor
@Tag(name = "Platform Administration", description = "Super Admin APIs for tenant organization provisioning and platform health")
public class PlatformController {

    private final PlatformService platformService;

    @GetMapping("/organizations")
    @Operation(summary = "List all organizations on the platform")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<List<OrganizationSummaryResponse>> listOrganizations() {
        return ResponseEntity.ok(platformService.listOrganizations());
    }

    @PostMapping("/organizations")
    @Operation(summary = "Provision a new tenant organization with admin credentials")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<OrganizationSummaryResponse> createOrganization(@Valid @RequestBody CreateOrganizationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(platformService.createOrganization(request));
    }

    @PutMapping("/organizations/{id}/status")
    @Operation(summary = "Activate or deactivate an organization")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<OrganizationSummaryResponse> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(platformService.toggleOrganizationStatus(id));
    }

    @GetMapping("/metrics")
    @Operation(summary = "Get platform-wide aggregated metrics")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> getMetrics() {
        return ResponseEntity.ok(platformService.getPlatformMetrics());
    }
}
