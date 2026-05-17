package com.jaswin.incidentmanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.jaswin.incidentmanagement.enums.Priority;
import com.jaswin.incidentmanagement.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.OPEN;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reported_by_id", nullable = true) // Can be null if created by webhook
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "organization"})
    private User reportedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_to_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "password", "organization"})
    private User assignedTo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "createdBy"})
    private Project project;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "project", "createdBy", "assignedTo"})
    private WorkTask task;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "ownerTeam"})
    private ServiceComponent service;

    @Column
    private String predictedImpact;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    @Column
    private String resolvedVia;

    @Column
    private LocalDateTime slaDeadline;

    @Builder.Default
    private Boolean slaBreached = false;

    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
