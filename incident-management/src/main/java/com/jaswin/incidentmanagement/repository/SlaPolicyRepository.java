package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.SlaPolicy;
import com.jaswin.incidentmanagement.enums.Priority;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {
    Optional<SlaPolicy> findByOrganizationIdAndPriority(Long organizationId, Priority priority);
    List<SlaPolicy> findByOrganizationId(Long organizationId);
    long countByOrganizationId(Long organizationId);
}
