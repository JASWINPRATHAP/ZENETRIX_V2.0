package com.jaswin.incidentmanagement.entity;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.jaswin.incidentmanagement.enums.ServiceStatus;
import com.jaswin.incidentmanagement.enums.ServiceType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "services")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Organization organization;

    @Column(nullable = false)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ServiceType type;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_team_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "lead"})
    private Team ownerTeam;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ServiceStatus status = ServiceStatus.OPERATIONAL;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}
