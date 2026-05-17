package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.ServiceComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceComponentRepository extends JpaRepository<ServiceComponent, Long> {
    List<ServiceComponent> findByOrganizationIdOrderByNameAsc(Long organizationId);

    Optional<ServiceComponent> findByIdAndOrganizationId(Long id, Long organizationId);

    long countByOrganizationId(Long organizationId);
}
