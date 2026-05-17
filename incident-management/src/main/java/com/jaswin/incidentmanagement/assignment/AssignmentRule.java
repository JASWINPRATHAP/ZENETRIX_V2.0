package com.jaswin.incidentmanagement.assignment;

import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.enums.Priority;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "assignment_rules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AssignmentRule {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String keyword;

    @Column(nullable = false)
    private String targetTeam;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Priority priorityOverride;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "organization_id", nullable = false)
    private Organization organization;
}
