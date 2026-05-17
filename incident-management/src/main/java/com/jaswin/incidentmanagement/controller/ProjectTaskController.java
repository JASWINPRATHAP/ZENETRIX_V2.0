package com.jaswin.incidentmanagement.controller;

import com.jaswin.incidentmanagement.dto.AssignTaskRequest;
import com.jaswin.incidentmanagement.dto.ProjectRequest;
import com.jaswin.incidentmanagement.dto.TaskRequest;
import com.jaswin.incidentmanagement.entity.Project;
import com.jaswin.incidentmanagement.entity.ProjectService;
import com.jaswin.incidentmanagement.entity.WorkTask;
import com.jaswin.incidentmanagement.service.ProjectTaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProjectTaskController {

    private final ProjectTaskService projectTaskService;

    @GetMapping("/api/projects")
    public List<Project> projects() {
        return projectTaskService.listProjects();
    }

    @PostMapping("/api/projects")
    public ResponseEntity<Project> createProject(@Valid @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectTaskService.createProject(request));
    }

    @PutMapping("/api/projects/{id}")
    public Project updateProject(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return projectTaskService.updateProject(id, request);
    }

    @GetMapping("/api/projects/{id}/services")
    public List<ProjectService> projectServices(@PathVariable Long id) {
        return projectTaskService.listProjectServices(id);
    }

    @GetMapping("/api/projects/{id}/tasks")
    public List<WorkTask> projectTasks(@PathVariable Long id) {
        return projectTaskService.listProjectTasks(id);
    }

    @PostMapping("/api/projects/{id}/tasks")
    public ResponseEntity<WorkTask> createTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectTaskService.createTask(id, request));
    }

    @GetMapping("/api/tasks")
    public List<WorkTask> tasks() {
        return projectTaskService.listTasks();
    }

    @PutMapping("/api/tasks/{id}")
    public WorkTask updateTask(@PathVariable Long id, @Valid @RequestBody TaskRequest request) {
        return projectTaskService.updateTask(id, request);
    }

    @PutMapping("/api/tasks/{id}/assign")
    public WorkTask assignTask(@PathVariable Long id, @Valid @RequestBody AssignTaskRequest request) {
        return projectTaskService.assignTask(id, request);
    }
}
