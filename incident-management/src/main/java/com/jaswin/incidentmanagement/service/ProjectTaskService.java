package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.AssignTaskRequest;
import com.jaswin.incidentmanagement.dto.ProjectRequest;
import com.jaswin.incidentmanagement.dto.TaskRequest;
import com.jaswin.incidentmanagement.entity.*;
import com.jaswin.incidentmanagement.enums.Priority;
import com.jaswin.incidentmanagement.enums.ProjectStatus;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.List;
import java.util.NoSuchElementException;

@Service
@RequiredArgsConstructor
public class ProjectTaskService {

    private final TenantContextService tenantContext;
    private final ProjectRepository projectRepository;
    private final ProjectServiceRepository projectServiceRepository;
    private final ServiceComponentRepository serviceRepository;
    private final WorkTaskRepository taskRepository;
    private final UserRepository userRepository;

    public List<Project> listProjects() {
        return projectRepository.findByOrganizationIdOrderByCreatedAtDesc(tenantContext.currentOrganizationId());
    }

    @Transactional
    public Project createProject(ProjectRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        Organization org = tenantContext.currentOrganization();
        Project project = projectRepository.save(Project.builder()
                .organization(org)
                .name(request.getName())
                .description(request.getDescription())
                .createdBy(tenantContext.currentUser())
                .status(request.getStatus() == null ? ProjectStatus.ACTIVE : request.getStatus())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .build());

        replaceProjectServices(project, request.getServiceIds() == null ? Collections.emptyList() : request.getServiceIds());
        return project;
    }

    @Transactional
    public Project updateProject(Long id, ProjectRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        Project project = findProject(id);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setStatus(request.getStatus() == null ? project.getStatus() : request.getStatus());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        replaceProjectServices(project, request.getServiceIds() == null ? Collections.emptyList() : request.getServiceIds());
        return projectRepository.save(project);
    }

    public List<ProjectService> listProjectServices(Long projectId) {
        Project project = findProject(projectId);
        return projectServiceRepository.findByProjectId(project.getId());
    }

    public List<WorkTask> listTasks() {
        User user = tenantContext.currentUser();
        Long orgId = tenantContext.currentOrganizationId();
        if (user.getRole() == Role.EMPLOYEE) {
            return taskRepository.findByAssignedToIdAndOrganizationIdOrderByDueDateAsc(user.getId(), orgId);
        }
        return taskRepository.findByOrganizationIdOrderByUpdatedAtDesc(orgId);
    }

    public List<WorkTask> listProjectTasks(Long projectId) {
        Project project = findProject(projectId);
        return taskRepository.findByProjectIdOrderByUpdatedAtDesc(project.getId());
    }

    @Transactional
    public WorkTask createTask(Long projectId, TaskRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        Long orgId = tenantContext.currentOrganizationId();
        Project project = findProject(projectId);
        ServiceComponent service = serviceRepository.findByIdAndOrganizationId(request.getServiceId(), orgId)
                .orElseThrow(() -> new NoSuchElementException("Service not found"));
        User assignedTo = request.getAssignedToId() == null ? null : findUser(request.getAssignedToId(), orgId);

        return taskRepository.save(WorkTask.builder()
                .organization(tenantContext.currentOrganization())
                .project(project)
                .title(request.getTitle())
                .description(request.getDescription())
                .createdBy(tenantContext.currentUser())
                .assignedTo(assignedTo)
                .service(service)
                .stage(request.getStage() == null ? "To Do" : request.getStage())
                .priority(request.getPriority() == null ? Priority.MEDIUM : request.getPriority())
                .dueDate(request.getDueDate())
                .build());
    }

    @Transactional
    public WorkTask updateTask(Long taskId, TaskRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        Long orgId = tenantContext.currentOrganizationId();
        WorkTask task = findTask(taskId);
        ServiceComponent service = serviceRepository.findByIdAndOrganizationId(request.getServiceId(), orgId)
                .orElseThrow(() -> new NoSuchElementException("Service not found"));
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setService(service);
        task.setAssignedTo(request.getAssignedToId() == null ? null : findUser(request.getAssignedToId(), orgId));
        task.setStage(request.getStage() == null ? task.getStage() : request.getStage());
        task.setPriority(request.getPriority() == null ? task.getPriority() : request.getPriority());
        task.setDueDate(request.getDueDate());
        return taskRepository.save(task);
    }

    @Transactional
    public WorkTask assignTask(Long taskId, AssignTaskRequest request) {
        tenantContext.requireAny(Role.ORG_ADMIN, Role.MANAGER, Role.SUPPORT_ENGINEER);
        WorkTask task = findTask(taskId);
        task.setAssignedTo(findUser(request.getAssignedToId(), tenantContext.currentOrganizationId()));
        return taskRepository.save(task);
    }

    private Project findProject(Long id) {
        return projectRepository.findByIdAndOrganizationId(id, tenantContext.currentOrganizationId())
                .orElseThrow(() -> new NoSuchElementException("Project not found"));
    }

    private WorkTask findTask(Long id) {
        return taskRepository.findByIdAndOrganizationId(id, tenantContext.currentOrganizationId())
                .orElseThrow(() -> new NoSuchElementException("Task not found"));
    }

    private User findUser(Long id, Long orgId) {
        return userRepository.findByIdAndOrganizationId(id, orgId)
                .orElseThrow(() -> new NoSuchElementException("User not found"));
    }

    private void replaceProjectServices(Project project, List<Long> serviceIds) {
        projectServiceRepository.deleteByProjectId(project.getId());
        Long orgId = tenantContext.currentOrganizationId();
        serviceIds.stream()
                .distinct()
                .map(serviceId -> serviceRepository.findByIdAndOrganizationId(serviceId, orgId)
                        .orElseThrow(() -> new NoSuchElementException("Service not found: " + serviceId)))
                .map(service -> ProjectService.builder().project(project).service(service).build())
                .forEach(projectServiceRepository::save);
    }
}
