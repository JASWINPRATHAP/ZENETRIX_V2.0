package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.OnboardingStatusResponse;
import com.jaswin.incidentmanagement.service.OnboardingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/org/onboarding")
@RequiredArgsConstructor
@Tag(name = "Organization Onboarding", description = "APIs for tracking and completing the mandatory 8-step organization setup wizard")
public class OnboardingController {

    private final OnboardingService onboardingService;

    @GetMapping("/status")
    @Operation(summary = "Get the 8-step setup wizard completion status and checklist")
    @PreAuthorize("hasAnyRole('ORG_ADMIN', 'SUPER_ADMIN')")
    public ResponseEntity<OnboardingStatusResponse> getStatus() {
        return ResponseEntity.ok(onboardingService.getStatus());
    }

    @PostMapping("/complete")
    @Operation(summary = "Complete organization onboarding and unlock operational dashboard")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<OnboardingStatusResponse> completeOnboarding() {
        return ResponseEntity.ok(onboardingService.completeOnboarding());
    }

    @PutMapping("/step/{step}")
    @Operation(summary = "Update current onboarding wizard step indicator")
    @PreAuthorize("hasRole('ORG_ADMIN')")
    public ResponseEntity<OnboardingStatusResponse> updateStep(@PathVariable int step) {
        return ResponseEntity.ok(onboardingService.updateStep(step));
    }
}
