package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.ProjectService;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ProjectServiceRepository extends JpaRepository<ProjectService, Long> {
    List<ProjectService> findByProjectId(Long projectId);

    List<ProjectService> findByServiceIdIn(Collection<Long> serviceIds);

    void deleteByProjectId(Long projectId);
}
