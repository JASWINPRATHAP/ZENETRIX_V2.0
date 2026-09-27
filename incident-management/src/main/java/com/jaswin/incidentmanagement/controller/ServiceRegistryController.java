package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.ServiceComponentRequest;
import com.jaswin.incidentmanagement.dto.ServiceDependencyRequest;
import com.jaswin.incidentmanagement.dto.TeamRequest;
import com.jaswin.incidentmanagement.entity.ServiceComponent;
import com.jaswin.incidentmanagement.entity.ServiceDependency;
import com.jaswin.incidentmanagement.entity.Team;
import com.jaswin.incidentmanagement.entity.TeamMember;
import com.jaswin.incidentmanagement.service.ServiceRegistryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
public class ServiceRegistryController {

    private final ServiceRegistryService registryService;

    @GetMapping("/api/services")
    public List<ServiceComponent> services() {
        return registryService.listServices();
    }

    @PostMapping("/api/services")
    public ResponseEntity<ServiceComponent> createService(@Valid @RequestBody ServiceComponentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registryService.createService(request));
    }

    @PutMapping("/api/services/{id}")
    public ServiceComponent updateService(@PathVariable Long id, @Valid @RequestBody ServiceComponentRequest request) {
        return registryService.updateService(id, request);
    }

    @DeleteMapping("/api/services/{id}")
    public ResponseEntity<Void> deleteService(@PathVariable Long id) {
        registryService.deleteService(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/services/{id}/graph")
    public Map<String, Object> serviceGraph(@PathVariable Long id) {
        return registryService.graph();
    }

    @GetMapping("/api/dependencies")
    public List<ServiceDependency> dependencies() {
        return registryService.listDependencies();
    }

    @PostMapping("/api/dependencies")
    public ResponseEntity<ServiceDependency> createDependency(@Valid @RequestBody ServiceDependencyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registryService.createDependency(request));
    }

    @PutMapping("/api/dependencies/{id}")
    public ServiceDependency updateDependency(@PathVariable Long id, @Valid @RequestBody ServiceDependencyRequest request) {
        return registryService.updateDependency(id, request);
    }

    @DeleteMapping("/api/dependencies/{id}")
    public ResponseEntity<Void> deleteDependency(@PathVariable Long id) {
        registryService.deleteDependency(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/api/dependencies/graph")
    public Map<String, Object> dependencyGraph() {
        return registryService.graph();
    }

    @GetMapping("/api/teams")
    public List<Team> teams() {
        return registryService.listTeams();
    }

    @PostMapping("/api/teams")
    public ResponseEntity<Team> createTeam(@Valid @RequestBody TeamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registryService.createTeam(request));
    }

    @GetMapping("/api/teams/{id}/members")
    public List<TeamMember> teamMembers(@PathVariable Long id) {
        return registryService.listTeamMembers(id);
    }

    @PostMapping("/api/teams/{id}/members/{userId}")
    public ResponseEntity<TeamMember> addTeamMember(@PathVariable Long id, @PathVariable Long userId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(registryService.addTeamMember(id, userId));
    }
}
