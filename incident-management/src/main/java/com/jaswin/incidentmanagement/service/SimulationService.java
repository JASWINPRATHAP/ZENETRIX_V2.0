package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.repository.OrganizationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class SimulationService {

    private final OrganizationRepository organizationRepository;

    @PersistenceContext
    private EntityManager entityManager;

    public static final String DEFAULT_SIMULATION_DOMAIN = "apexcloud.io";

    @Transactional(readOnly = true)
    public Map<String, Object> getSimulationStatus(String domain) {
        String targetDomain = (domain == null || domain.isBlank()) ? DEFAULT_SIMULATION_DOMAIN : domain.trim().toLowerCase();
        Optional<Organization> orgOpt = organizationRepository.findByDomain(targetDomain);

        Map<String, Object> response = new HashMap<>();
        response.put("domain", targetDomain);
        response.put("exists", orgOpt.isPresent());
        orgOpt.ifPresent(org -> {
            response.put("organizationId", org.getId());
            response.put("organizationName", org.getName());
            response.put("createdAt", org.getCreatedAt());
        });
        return response;
    }

    @Transactional
    public Map<String, Object> purgeSimulationData(String domain) {
        String targetDomain = (domain == null || domain.isBlank()) ? DEFAULT_SIMULATION_DOMAIN : domain.trim().toLowerCase();
        log.info("Starting simulation purge for domain: {}", targetDomain);

        Optional<Organization> orgOpt = organizationRepository.findByDomain(targetDomain);
        Map<String, Object> response = new HashMap<>();

        if (orgOpt.isEmpty()) {
            response.put("success", true);
            response.put("message", "No simulation organization found with domain: " + targetDomain);
            response.put("purged", false);
            return response;
        }

        Long orgId = orgOpt.get().getId();

        try {
            // Cascade delete all child entities referencing this organization
            entityManager.createNativeQuery("DELETE FROM incident_history WHERE incident_id IN (SELECT id FROM incidents WHERE organization_id = :orgId)")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM incidents WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM tasks WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM project_services WHERE project_id IN (SELECT id FROM projects WHERE organization_id = :orgId)")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM projects WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM service_dependencies WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM services WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM team_members WHERE team_id IN (SELECT id FROM teams WHERE organization_id = :orgId)")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM teams WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM sla_policies WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM assignment_rules WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM users WHERE organization_id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            entityManager.createNativeQuery("DELETE FROM organizations WHERE id = :orgId")
                    .setParameter("orgId", orgId).executeUpdate();

            log.info("Successfully purged simulation tenant {} (ID: {}) from database", targetDomain, orgId);

            response.put("success", true);
            response.put("purged", true);
            response.put("organizationId", orgId);
            response.put("domain", targetDomain);
            response.put("message", "Simulation organization '" + targetDomain + "' and all associated data were successfully purged from database.");
            return response;
        } catch (Exception e) {
            log.error("Failed to purge simulation tenant {}: {}", targetDomain, e.getMessage(), e);
            response.put("success", false);
            response.put("message", "Failed to purge simulation data: " + e.getMessage());
            return response;
        }
    }
}
