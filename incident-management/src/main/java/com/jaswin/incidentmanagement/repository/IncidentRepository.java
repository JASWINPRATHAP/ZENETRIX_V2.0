package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.enums.Priority;
import com.jaswin.incidentmanagement.enums.Status;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {

    Page<Incident> findByStatus(Status status, Pageable pageable);

    Page<Incident> findByPriority(Priority priority, Pageable pageable);

    Page<Incident> findByStatusAndPriority(Status status, Priority priority, Pageable pageable);

    long countByStatus(Status status);

    long countByPriority(Priority priority);

    Page<Incident> findByOrganizationId(Long organizationId, Pageable pageable);

    Page<Incident> findByStatusAndOrganizationId(Status status, Long organizationId, Pageable pageable);

    Page<Incident> findByPriorityAndOrganizationId(Priority priority, Long organizationId, Pageable pageable);

    Page<Incident> findByStatusAndPriorityAndOrganizationId(Status status, Priority priority, Long organizationId, Pageable pageable);

    long countByStatusAndOrganizationId(Status status, Long organizationId);

    long countByPriorityAndOrganizationId(Priority priority, Long organizationId);

    long countByOrganizationId(Long organizationId);

    List<Incident> findTop3ByOrganizationIdAndServiceIdAndStatusOrderByResolvedAtDesc(Long organizationId, Long serviceId, Status status);

    List<Incident> findByOrganizationIdAndServiceIdInAndStatusIn(Long organizationId, Collection<Long> serviceIds, Collection<Status> statuses);

    List<Incident> findByReportedByIdAndOrganizationIdOrderByCreatedAtDesc(Long reportedById, Long organizationId);
}
