package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.Project;
import com.jaswin.incidentmanagement.enums.ProjectStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByOrganizationIdOrderByCreatedAtDesc(Long organizationId);

    Optional<Project> findByIdAndOrganizationId(Long id, Long organizationId);

    List<Project> findByIdInAndOrganizationId(Collection<Long> ids, Long organizationId);

    List<Project> findByOrganizationIdAndStatusAndEndDateLessThanEqual(Long organizationId, ProjectStatus status, LocalDate endDate);

    long countByOrganizationIdAndStatus(Long organizationId, ProjectStatus status);
}
