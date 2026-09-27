package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, Long> {
    Optional<Organization> findByDomain(String domain);
    Optional<Organization> findBySlug(String slug);
    boolean existsByDomain(String domain);
    boolean existsBySlug(String slug);
}

