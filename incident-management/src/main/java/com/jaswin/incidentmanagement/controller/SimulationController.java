package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.service.SimulationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/simulation")
@RequiredArgsConstructor
@Tag(name = "Platform Simulation", description = "Endpoints for managing automated simulation lifecycle and database purge")
public class SimulationController {

    private final SimulationService simulationService;

    @GetMapping("/status")
    @Operation(summary = "Check if simulation organization data currently exists in the database")
    public ResponseEntity<Map<String, Object>> getStatus(@RequestParam(required = false) String domain) {
        return ResponseEntity.ok(simulationService.getSimulationStatus(domain));
    }

    @DeleteMapping("/cleanup")
    @Operation(summary = "Purge simulation organization and all its cascade-related data from Supabase")
    public ResponseEntity<Map<String, Object>> cleanup(@RequestParam(required = false) String domain) {
        Map<String, Object> result = simulationService.purgeSimulationData(domain);
        return ResponseEntity.ok(result);
    }
}
