package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.IncidentRequest;
import com.jaswin.incidentmanagement.dto.IncidentStatsResponse;
import com.jaswin.incidentmanagement.dto.ResolveIncidentRequest;
import com.jaswin.incidentmanagement.dto.StatusUpdateRequest;
import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.enums.Priority;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.service.IncidentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/incidents")
@RequiredArgsConstructor
@Tag(name = "Incident Management", description = "APIs for managing incidents lifecycle")
public class IncidentController {

    private final IncidentService incidentService;

    @PostMapping
    @Operation(summary = "Create a new incident")
    public ResponseEntity<Incident> createIncident(@Valid @RequestBody IncidentRequest request) {
        Incident created = incidentService.createIncident(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping
    @Operation(summary = "Get all incidents or filter by status/priority with pagination")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('EMPLOYEE', 'MANAGER', 'SUPPORT_ENGINEER', 'ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<org.springframework.data.domain.Page<Incident>> getIncidents(
            @RequestParam(required = false) Status status,
            @RequestParam(required = false) Priority priority,
            @org.springframework.data.web.PageableDefault(size = 10, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) org.springframework.data.domain.Pageable pageable) {
        return ResponseEntity.ok(incidentService.filterIncidents(status, priority, pageable));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get incident by ID")
    @org.springframework.security.access.prepost.PreAuthorize("@incidentAuthorizationService.canAccessIncident(authentication, #id)")
    public ResponseEntity<Incident> getIncidentById(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getIncidentById(id));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Get lifecycle history of an incident")
    @org.springframework.security.access.prepost.PreAuthorize("@incidentAuthorizationService.canAccessIncident(authentication, #id)")
    public ResponseEntity<java.util.List<com.jaswin.incidentmanagement.entity.IncidentHistory>> getIncidentHistory(@PathVariable Long id) {
        return ResponseEntity.ok(incidentService.getIncidentHistory(id));
    }

    @PutMapping("/{id}/status")
    @Operation(summary = "Update status of an incident")
    @org.springframework.security.access.prepost.PreAuthorize("@incidentAuthorizationService.canModifyIncident(authentication, #id)")
    public ResponseEntity<Incident> updateStatus(
            @PathVariable Long id,
            @Valid @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(incidentService.updateStatus(id, request));
    }

    @PutMapping("/{id}/resolve")
    @Operation(summary = "Resolve an incident with notes")
    @org.springframework.security.access.prepost.PreAuthorize("@incidentAuthorizationService.canModifyIncident(authentication, #id)")
    public ResponseEntity<Incident> resolveIncident(
            @PathVariable Long id,
            @Valid @RequestBody ResolveIncidentRequest request) {
        return ResponseEntity.ok(incidentService.resolveIncident(id, request));
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Delete an incident")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<String> deleteIncident(@PathVariable Long id) {
        incidentService.deleteIncident(id);
        return ResponseEntity.ok("Incident deleted successfully");
    }

    @GetMapping("/stats")
    @Operation(summary = "Get incident analytics and statistics")
    @org.springframework.security.access.prepost.PreAuthorize("hasAnyRole('ORG_ADMIN', 'MANAGER', 'SUPPORT_ENGINEER', 'SUPER_ADMIN')")
    public ResponseEntity<IncidentStatsResponse> getStats() {
        return ResponseEntity.ok(incidentService.getStats());
    }

    @GetMapping("/{id}/similar")
    @Operation(summary = "Find similar past incidents")
    public ResponseEntity<?> getSimilarIncidents(@PathVariable Long id, @org.springframework.beans.factory.annotation.Autowired com.jaswin.incidentmanagement.similarity.SimilarityService similarityService) {
        return ResponseEntity.ok(similarityService.findSimilarIncidents(id));
    }

    @GetMapping("/{id}/blast-radius")
    @Operation(summary = "Get blast radius report for an incident")
    @org.springframework.security.access.prepost.PreAuthorize("@incidentAuthorizationService.canAccessIncident(authentication, #id)")
    public ResponseEntity<?> getBlastRadius(@PathVariable Long id, @org.springframework.beans.factory.annotation.Autowired com.jaswin.incidentmanagement.service.BlastRadiusService blastRadiusService) {
        return ResponseEntity.ok(blastRadiusService.calculateForIncident(id));
    }

    @GetMapping("/{id}/suggestions")
    @Operation(summary = "Get resolution suggestions for an incident")
    @org.springframework.security.access.prepost.PreAuthorize("@incidentAuthorizationService.canAccessIncident(authentication, #id)")
    public ResponseEntity<?> getResolutionSuggestions(@PathVariable Long id, @org.springframework.beans.factory.annotation.Autowired com.jaswin.incidentmanagement.similarity.SimilarityService similarityService) {
        return ResponseEntity.ok(similarityService.findResolutionSuggestions(id));
    }
}
