package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByOrganizationIdOrderByNameAsc(Long organizationId);

    Optional<Team> findByIdAndOrganizationId(Long id, Long organizationId);

    long countByOrganizationId(Long organizationId);
}
