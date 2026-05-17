package com.jaswin.incidentmanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.jaswin.incidentmanagement.enums.DependencyType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "service_dependencies")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceDependency {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Organization organization;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "from_service_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "ownerTeam"})
    private ServiceComponent fromService;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "to_service_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "organization", "ownerTeam"})
    private ServiceComponent toService;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DependencyType dependencyType;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
