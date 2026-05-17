package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.ServiceComponentRequest;
import com.jaswin.incidentmanagement.dto.ServiceDependencyRequest;
import com.jaswin.incidentmanagement.dto.TeamRequest;
import com.jaswin.incidentmanagement.entity.*;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.enums.ServiceStatus;
import com.jaswin.incidentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class ServiceRegistryService {

    private final TenantContextService tenantContext;
    private final ServiceComponentRepository serviceRepository;
    private final ServiceDependencyRepository dependencyRepository;
    private final TeamRepository teamRepository;
    private final TeamMemberRepository teamMemberRepository;
    private final UserRepository userRepository;
    private final WorkTaskRepository taskRepository;
    private final IncidentRepository incidentRepository;

    public List<ServiceComponent> listServices() {
        return serviceRepository.findByOrganizationIdOrderByNameAsc(tenantContext.currentOrganizationId());
    }

    @Transactional
    public ServiceComponent createService(ServiceComponentRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Organization org = tenantContext.currentOrganization();
        Team ownerTeam = request.getOwnerTeamId() == null ? null : findTeam(request.getOwnerTeamId(), org.getId());

        ServiceComponent service = ServiceComponent.builder()
                .organization(org)
                .name(request.getName())
                .type(request.getType())
                .description(request.getDescription())
                .ownerTeam(ownerTeam)
                .status(request.getStatus() == null ? ServiceStatus.OPERATIONAL : request.getStatus())
                .build();

        return serviceRepository.save(service);
    }

    @Transactional
    public ServiceComponent updateService(Long id, ServiceComponentRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Long orgId = tenantContext.currentOrganizationId();
        ServiceComponent service = findService(id, orgId);

        service.setName(request.getName());
        service.setType(request.getType());
        service.setDescription(request.getDescription());
        service.setStatus(request.getStatus() == null ? service.getStatus() : request.getStatus());
        service.setOwnerTeam(request.getOwnerTeamId() == null ? null : findTeam(request.getOwnerTeamId(), orgId));

        return serviceRepository.save(service);
    }

    @Transactional
    public void deleteService(Long id) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Long orgId = tenantContext.currentOrganizationId();
        ServiceComponent service = findService(id, orgId);

        boolean hasOpenIncidents = incidentRepository
                .findByOrganizationIdAndServiceIdInAndStatusIn(orgId, List.of(id), List.of(com.jaswin.incidentmanagement.enums.Status.OPEN, com.jaswin.incidentmanagement.enums.Status.IN_PROGRESS))
                .size() > 0;
        boolean hasActiveTasks = !taskRepository.findActiveByOrganizationAndServices(orgId, List.of(id), "Done").isEmpty();
        if (hasOpenIncidents || hasActiveTasks) {
            throw new IllegalStateException("Service cannot be deleted while active tasks or incidents are linked to it");
        }

        serviceRepository.delete(service);
    }

    public List<ServiceDependency> listDependencies() {
        return dependencyRepository.findByOrganizationId(tenantContext.currentOrganizationId());
    }

    @Transactional
    public ServiceDependency createDependency(ServiceDependencyRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        Long orgId = tenantContext.currentOrganizationId();
        if (request.getFromServiceId().equals(request.getToServiceId())) {
            throw new IllegalArgumentException("A service cannot depend on itself");
        }
        if (dependencyRepository.existsByFromServiceIdAndToServiceIdAndOrganizationId(
                request.getFromServiceId(), request.getToServiceId(), orgId)) {
            throw new IllegalArgumentException("Dependency already exists");
        }

        ServiceComponent fromService = findService(request.getFromServiceId(), orgId);
        ServiceComponent toService = findService(request.getToServiceId(), orgId);
        if (wouldCreateCycle(fromService.getId(), toService.getId(), orgId)) {
            throw new IllegalArgumentException("Circular service dependencies are not allowed");
        }

        return dependencyRepository.save(ServiceDependency.builder()
                .organization(tenantContext.currentOrganization())
                .fromService(fromService)
                .toService(toService)
                .dependencyType(request.getDependencyType())
                .build());
    }

    @Transactional
    public void deleteDependency(Long id) {
        tenantContext.requireAny(Role.ORG_ADMIN);
        ServiceDependency dependency = dependencyRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Dependency not found"));
        if (!dependency.getOrganization().getId().equals(tenantContext.currentOrganizationId())) {
            throw new NoSuchElementException("Dependency not found");
        }
        dependencyRepository.delete(dependency);
    }

    public Map<String, Object> graph() {
        Long orgId = tenantContext.currentOrganizationId();
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("services", serviceRepository.findByOrganizationIdOrderByNameAsc(orgId));
        result.put("dependencies", dependencyRepository.findByOrganizationId(orgId));
        return result;
    }

    public List<Team> listTeams() {
        return teamRepository.findByOrganizationIdOrderByNameAsc(tenantContext.currentOrganizationId());
    }

    @Transactional
    public Team createTeam(TeamRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        Organization org = tenantContext.currentOrganization();
        User lead = request.getLeadId() == null ? tenantContext.currentUser() : findUser(request.getLeadId(), org.getId());
        return teamRepository.save(Team.builder()
                .organization(org)
                .name(request.getName())
                .lead(lead)
                .build());
    }

    @Transactional
    public TeamMember addTeamMember(Long teamId, Long userId) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        Long orgId = tenantContext.currentOrganizationId();
        Team team = findTeam(teamId, orgId);
        User user = findUser(userId, orgId);
        if (teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            return teamMemberRepository.findByTeamId(teamId).stream()
                    .filter(member -> member.getUser().getId().equals(userId))
                    .findFirst()
                    .orElseThrow();
        }
        return teamMemberRepository.save(TeamMember.builder().team(team).user(user).build());
    }

    public List<TeamMember> listTeamMembers(Long teamId) {
        Team team = findTeam(teamId, tenantContext.currentOrganizationId());
        return teamMemberRepository.findByTeamId(team.getId());
    }

    private ServiceComponent findService(Long id, Long orgId) {
        return serviceRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("Service not found"));
    }

    private Team findTeam(Long id, Long orgId) {
        return teamRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("Team not found"));
    }

    private User findUser(Long id, Long orgId) {
        return userRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    private boolean wouldCreateCycle(Long fromServiceId, Long toServiceId, Long orgId) {
        Deque<Long> stack = new ArrayDeque<>();
        Set<Long> visited = new HashSet<>();
        stack.push(toServiceId);

        while (!stack.isEmpty()) {
            Long current = stack.pop();
            if (!visited.add(current)) {
                continue;
            }
            if (current.equals(fromServiceId)) {
                return true;
            }
            dependencyRepository.findByFromServiceIdAndOrganizationId(current, orgId)
                    .forEach(dependency -> stack.push(dependency.getToService().getId()));
        }
        return false;
    }
}
