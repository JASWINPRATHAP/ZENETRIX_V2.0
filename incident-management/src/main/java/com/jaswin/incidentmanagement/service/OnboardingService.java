package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.OnboardingStatusResponse;
import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.entity.ServiceComponent;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OnboardingService {

    private final TenantContextService tenantContext;
    private final OrganizationRepository organizationRepository;
    private final ServiceComponentRepository serviceRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final TeamRepository teamRepository;
    private final SlaPolicyRepository slaPolicyRepository;
    private final UserRepository userRepository;

    @Transactional
    public OnboardingStatusResponse getStatus() {
        Organization org = tenantContext.currentOrganization();
        Long orgId = org.getId();

        long serviceCount = serviceRepository.countByOrganizationId(orgId);
        long dependencyCount = dependencyRepository.countByOrganizationId(orgId);
        long teamCount = teamRepository.countByOrganizationId(orgId);

        List<ServiceComponent> services = serviceRepository.findByOrganizationIdOrderByNameAsc(orgId);
        long servicesWithOwnerCount = services.stream().filter(s -> s.getOwnerTeam() != null).count();

        long slaPolicyCount = slaPolicyRepository.countByOrganizationId(orgId);
        if (slaPolicyCount == 0) {
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.CRITICAL).resolutionTimeLimitHours(1).build());
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.HIGH).resolutionTimeLimitHours(4).build());
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.MEDIUM).resolutionTimeLimitHours(8).build());
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.LOW).resolutionTimeLimitHours(24).build());
            slaPolicyCount = 4;
        }
        long managerCount = userRepository.countByRoleAndOrganizationId(Role.MANAGER, orgId);
        long totalUsers = userRepository.countByOrganizationId(orgId);

        boolean step1Done = serviceCount > 0;
        boolean step2Done = serviceCount > 1 ? dependencyCount > 0 : (serviceCount == 1);
        boolean step3Done = teamCount > 0;
        boolean step4Done = serviceCount > 0 && servicesWithOwnerCount > 0;
        boolean step5Done = slaPolicyCount > 0;
        boolean step6Done = slaPolicyCount > 0; // baseline policy active
        boolean step7Done = managerCount > 0 || totalUsers > 1; // At least one staff member/lead created beyond admin

        // Strict Invariant: An organization cannot be marked completed if Step 1 or Step 3 is incomplete
        boolean isCompleted = Boolean.TRUE.equals(org.getOnboardingCompleted());
        if (isCompleted && (!step1Done || !step3Done)) {
            org.setOnboardingCompleted(false);
            org.setSetupStep(1);
            organizationRepository.save(org);
            isCompleted = false;
        }

        boolean step8Done = isCompleted || (step1Done && step2Done && step3Done && step4Done && step5Done && step6Done && step7Done);

        List<OnboardingStatusResponse.StepStatus> stepList = new ArrayList<>();
        stepList.add(new OnboardingStatusResponse.StepStatus(1, "Services & Components", "Register services and atomic components", step1Done, serviceCount + " added"));
        stepList.add(new OnboardingStatusResponse.StepStatus(2, "Service Dependencies", "Define directional dependencies (HARD, SOFT, DATA)", step2Done, dependencyCount + " dependencies"));
        stepList.add(new OnboardingStatusResponse.StepStatus(3, "Teams", "Create operational teams and assign leads", step3Done, teamCount + " teams"));
        stepList.add(new OnboardingStatusResponse.StepStatus(4, "Service Ownership", "Link responsible teams to services", step4Done, servicesWithOwnerCount + " assigned"));
        stepList.add(new OnboardingStatusResponse.StepStatus(5, "SLA Rules", "Configure resolution time limits per priority", step5Done, slaPolicyCount + " policies"));
        stepList.add(new OnboardingStatusResponse.StepStatus(6, "Escalation Policies", "Configure warning triggers and notification paths", step6Done, "Configured"));
        stepList.add(new OnboardingStatusResponse.StepStatus(7, "Provision Staff IDs", "Provision Team Leads, Dev/Testers, and End Employees", step7Done, (totalUsers > 1 ? (totalUsers - 1) : 0) + " staff provisioned"));
        stepList.add(new OnboardingStatusResponse.StepStatus(8, "Graph Preview & Launch", "Verify blast radius graph and unlock operations", step8Done, isCompleted ? "Completed" : (step8Done ? "Ready to launch" : "Locked")));

        int currentStep = org.getSetupStep() != null ? org.getSetupStep() : 1;
        if (!step1Done) currentStep = 1;
        else if (!step2Done) currentStep = 2;
        else if (!step3Done) currentStep = 3;
        else if (!step4Done) currentStep = 4;
        else if (!step5Done) currentStep = 5;
        else if (!step6Done) currentStep = 6;
        else if (!step7Done) currentStep = 7;
        else if (!isCompleted) currentStep = 8;

        return OnboardingStatusResponse.builder()
                .isCompleted(isCompleted)
                .currentStep(currentStep)
                .serviceCount(serviceCount)
                .dependencyCount(dependencyCount)
                .teamCount(teamCount)
                .servicesWithOwnerCount(servicesWithOwnerCount)
                .slaPolicyCount(slaPolicyCount)
                .managerCount(managerCount)
                .steps(stepList)
                .build();
    }

    @Transactional
    public OnboardingStatusResponse completeOnboarding() {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Organization org = tenantContext.currentOrganization();
        Long orgId = org.getId();

        long serviceCount = serviceRepository.countByOrganizationId(orgId);
        if (serviceCount == 0) {
            throw new IllegalStateException("Cannot complete onboarding: Step 1 (Services & Components) requires at least 1 registered service.");
        }
        long dependencyCount = dependencyRepository.countByOrganizationId(orgId);
        if (serviceCount > 1 && dependencyCount == 0) {
            throw new IllegalStateException("Cannot complete onboarding: Step 2 (Service Dependencies) requires at least 1 dependency link when multiple services exist.");
        }
        long teamCount = teamRepository.countByOrganizationId(orgId);
        if (teamCount == 0) {
            throw new IllegalStateException("Cannot complete onboarding: Step 3 (Teams) requires at least 1 operational response team.");
        }
        List<ServiceComponent> services = serviceRepository.findByOrganizationIdOrderByNameAsc(orgId);
        long servicesWithOwnerCount = services.stream().filter(s -> s.getOwnerTeam() != null).count();
        if (servicesWithOwnerCount == 0) {
            throw new IllegalStateException("Cannot complete onboarding: Step 4 (Service Ownership) requires service ownership assignments.");
        }
        long slaPolicyCount = slaPolicyRepository.countByOrganizationId(orgId);
        if (slaPolicyCount == 0) {
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.CRITICAL).resolutionTimeLimitHours(1).build());
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.HIGH).resolutionTimeLimitHours(4).build());
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.MEDIUM).resolutionTimeLimitHours(8).build());
            slaPolicyRepository.save(com.jaswin.incidentmanagement.entity.SlaPolicy.builder().organization(org).priority(com.jaswin.incidentmanagement.enums.Priority.LOW).resolutionTimeLimitHours(24).build());
        }

        org.setOnboardingCompleted(true);
        org.setSetupStep(8);
        organizationRepository.save(org);
        return getStatus();
    }

    @Transactional
    public OnboardingStatusResponse updateStep(int step) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Organization org = tenantContext.currentOrganization();
        Long orgId = org.getId();

        long serviceCount = serviceRepository.countByOrganizationId(orgId);
        long dependencyCount = dependencyRepository.countByOrganizationId(orgId);
        long teamCount = teamRepository.countByOrganizationId(orgId);

        // Strict sequential gating: Cannot advance to a step if prior steps are unfulfilled
        if (step > 1 && serviceCount == 0) {
            throw new IllegalStateException("Step 1 must be completed (add at least 1 service) before proceeding to subsequent steps.");
        }
        if (step > 2 && serviceCount > 1 && dependencyCount == 0) {
            throw new IllegalStateException("Step 2 must be completed (link dependencies) before proceeding.");
        }
        if (step > 3 && teamCount == 0) {
            throw new IllegalStateException("Step 3 must be completed (create at least 1 team) before proceeding.");
        }

        org.setSetupStep(Math.max(1, Math.min(8, step)));
        organizationRepository.save(org);
        return getStatus();
    }
}
