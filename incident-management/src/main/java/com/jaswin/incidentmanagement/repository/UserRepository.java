package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    List<User> findByRoleAndTeamAndOrganizationId(Role role, String team, Long organizationId);

    List<User> findByOrganizationIdOrderByNameAsc(Long organizationId);

    Optional<User> findByIdAndOrganizationId(Long id, Long organizationId);

    long countByOrganizationId(Long organizationId);

    long countByRoleAndOrganizationId(Role role, Long organizationId);

    long countByRole(Role role);

    boolean existsByEmail(String email);
}

