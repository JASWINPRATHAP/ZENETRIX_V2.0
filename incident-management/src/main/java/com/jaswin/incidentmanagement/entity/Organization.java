package com.jaswin.incidentmanagement.entity;

import com.jaswin.incidentmanagement.enums.Plan;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "organizations")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Organization {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false, unique = true)
    private String domain;

    @Column(unique = true)
    private String slug;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Plan plan = Plan.FREE;

    @Column(nullable = false)
    @Builder.Default
    private Boolean isActive = true;

    @Column(nullable = false)
    @Builder.Default
    private Boolean onboardingCompleted = false;

    @Column(nullable = false)
    @Builder.Default
    private Integer setupStep = 1;

    @Column(columnDefinition = "TEXT")
    private String settings;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;
}

