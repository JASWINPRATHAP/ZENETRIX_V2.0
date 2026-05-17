package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.WorkTask;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorkTaskRepository extends JpaRepository<WorkTask, Long> {
    List<WorkTask> findByOrganizationIdOrderByUpdatedAtDesc(Long organizationId);

    List<WorkTask> findByProjectIdOrderByUpdatedAtDesc(Long projectId);

    List<WorkTask> findByAssignedToIdAndOrganizationIdOrderByDueDateAsc(Long assignedToId, Long organizationId);

    Optional<WorkTask> findByIdAndOrganizationId(Long id, Long organizationId);

    @Query("""
            select task from WorkTask task
            where task.organization.id = :organizationId
              and task.service.id in :serviceIds
              and lower(task.stage) <> lower(:stage)
            """)
    List<WorkTask> findActiveByOrganizationAndServices(
            @Param("organizationId") Long organizationId,
            @Param("serviceIds") Collection<Long> serviceIds,
            @Param("stage") String stage);

    @Query("""
            select count(task) from WorkTask task
            where task.organization.id = :organizationId
              and lower(task.stage) <> lower(:stage)
            """)
    long countActiveByOrganization(@Param("organizationId") Long organizationId, @Param("stage") String stage);
}
