package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.CreateOrganizationRequest;
import com.jaswin.incidentmanagement.dto.OrganizationSummaryResponse;
import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Plan;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.repository.IncidentRepository;
import com.jaswin.incidentmanagement.repository.OrganizationRepository;
import com.jaswin.incidentmanagement.repository.ServiceComponentRepository;
import com.jaswin.incidentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class PlatformService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ServiceComponentRepository serviceRepository;
    private final IncidentRepository incidentRepository;
    private final PasswordEncoder passwordEncoder;

    public List<OrganizationSummaryResponse> listOrganizations() {
        return organizationRepository.findAll().stream()
                .map(org -> {
                    long users = userRepository.countByOrganizationId(org.getId());
                    long services = serviceRepository.countByOrganizationId(org.getId());
                    long activeIncidents = incidentRepository.countByStatusInAndOrganizationId(
                            List.of(Status.OPEN, Status.IN_PROGRESS), org.getId());

                    return OrganizationSummaryResponse.builder()
                            .id(org.getId())
                            .name(org.getName())
                            .domain(org.getDomain())
                            .slug(org.getSlug())
                            .plan(org.getPlan() == null ? Plan.FREE : org.getPlan())
                            .isActive(org.getIsActive() == null || org.getIsActive())
                            .onboardingCompleted(org.getOnboardingCompleted() != null && org.getOnboardingCompleted())
                            .setupStep(org.getSetupStep() == null ? 1 : org.getSetupStep())
                            .userCount(users)
                            .serviceCount(services)
                            .activeIncidentCount(activeIncidents)
                            .createdAt(org.getCreatedAt())
                            .build();
                })
                .sorted(Comparator.comparing(OrganizationSummaryResponse::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .toList();
    }

    @Transactional
    public OrganizationSummaryResponse createOrganization(CreateOrganizationRequest request) {
        if (organizationRepository.existsByDomain(request.getDomain())) {
            throw new IllegalArgumentException("An organization with domain " + request.getDomain() + " already exists.");
        }

        String slug = request.getSlug();
        if (slug == null || slug.isBlank()) {
            slug = request.getName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
        }

        if (organizationRepository.existsBySlug(slug)) {
            slug = slug + "-" + System.currentTimeMillis() % 10000;
        }

        if (userRepository.existsByEmail(request.getAdminEmail())) {
            throw new IllegalArgumentException("User with email " + request.getAdminEmail() + " already exists.");
        }

        Organization org = Organization.builder()
                .name(request.getName())
                .domain(request.getDomain())
                .slug(slug)
                .plan(request.getPlan() == null ? Plan.FREE : request.getPlan())
                .isActive(true)
                .onboardingCompleted(false)
                .setupStep(1)
                .build();

        org = organizationRepository.save(org);

        String rawPassword = (request.getAdminPassword() == null || request.getAdminPassword().isBlank())
                ? "password"
                : request.getAdminPassword();

        User adminUser = User.builder()
                .name(request.getAdminName())
                .email(request.getAdminEmail())
                .password(passwordEncoder.encode(rawPassword))
                .role(Role.ORG_ADMIN)
                .organization(org)
                .build();

        userRepository.save(adminUser);

        return OrganizationSummaryResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .domain(org.getDomain())
                .slug(org.getSlug())
                .plan(org.getPlan())
                .isActive(org.getIsActive())
                .onboardingCompleted(org.getOnboardingCompleted())
                .setupStep(org.getSetupStep())
                .userCount(1)
                .serviceCount(0)
                .activeIncidentCount(0)
                .createdAt(org.getCreatedAt())
                .build();
    }

    @Transactional
    public OrganizationSummaryResponse toggleOrganizationStatus(Long id) {
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Organization not found with id: " + id));

        org.setIsActive(!Boolean.TRUE.equals(org.getIsActive()));
        org = organizationRepository.save(org);

        long users = userRepository.countByOrganizationId(org.getId());
        long services = serviceRepository.countByOrganizationId(org.getId());
        long activeIncidents = incidentRepository.countByStatusInAndOrganizationId(
                List.of(Status.OPEN, Status.IN_PROGRESS), org.getId());

        return OrganizationSummaryResponse.builder()
                .id(org.getId())
                .name(org.getName())
                .domain(org.getDomain())
                .slug(org.getSlug())
                .plan(org.getPlan())
                .isActive(org.getIsActive())
                .onboardingCompleted(org.getOnboardingCompleted())
                .setupStep(org.getSetupStep())
                .userCount(users)
                .serviceCount(services)
                .activeIncidentCount(activeIncidents)
                .createdAt(org.getCreatedAt())
                .build();
    }

    public Map<String, Object> getPlatformMetrics() {
        List<Organization> orgs = organizationRepository.findAll();
        long totalOrgs = orgs.size();
        long activeOrgs = orgs.stream().filter(o -> Boolean.TRUE.equals(o.getIsActive())).count();
        long completedOnboarding = orgs.stream().filter(o -> Boolean.TRUE.equals(o.getOnboardingCompleted())).count();
        long totalUsers = userRepository.count();
        long totalActiveIncidents = incidentRepository.countByStatusIn(List.of(Status.OPEN, Status.IN_PROGRESS));
        long totalResolved = incidentRepository.countByStatus(Status.RESOLVED) + incidentRepository.countByStatus(Status.CLOSED);
        long totalIncidents = incidentRepository.count();

        double complianceRate = totalIncidents == 0 ? 100.0 : Math.round((totalResolved * 1000.0 / totalIncidents)) / 10.0;

        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalOrganizations", totalOrgs);
        metrics.put("activeOrganizations", activeOrgs);
        metrics.put("pendingSetupOrganizations", totalOrgs - completedOnboarding);
        metrics.put("totalUsers", totalUsers);
        metrics.put("activeIncidents", totalActiveIncidents);
        metrics.put("platformComplianceRate", complianceRate);

        return metrics;
    }
}
