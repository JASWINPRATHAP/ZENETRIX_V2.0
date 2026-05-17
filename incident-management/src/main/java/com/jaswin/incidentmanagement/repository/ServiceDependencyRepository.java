package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.ServiceDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;

@Repository
public interface ServiceDependencyRepository extends JpaRepository<ServiceDependency, Long> {
    List<ServiceDependency> findByOrganizationId(Long organizationId);

    List<ServiceDependency> findByFromServiceIdAndOrganizationId(Long fromServiceId, Long organizationId);

    List<ServiceDependency> findByToServiceIdAndOrganizationId(Long toServiceId, Long organizationId);

    List<ServiceDependency> findByFromServiceIdInAndOrganizationId(Collection<Long> fromServiceIds, Long organizationId);

    boolean existsByFromServiceIdAndToServiceIdAndOrganizationId(Long fromServiceId, Long toServiceId, Long organizationId);

    long countByOrganizationId(Long organizationId);
}
