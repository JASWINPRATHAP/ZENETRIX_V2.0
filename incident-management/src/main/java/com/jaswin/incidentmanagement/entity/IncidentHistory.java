package com.jaswin.incidentmanagement.entity;

import com.jaswin.incidentmanagement.enums.Status;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "incident_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class IncidentHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @Enumerated(EnumType.STRING)
    @Column(nullable = true)
    private Status oldStatus;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status newStatus;

    @Column(nullable = false)
    private String updatedBy;

    @Column(columnDefinition = "TEXT")
    private String changeReason;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime updatedAt;
}
