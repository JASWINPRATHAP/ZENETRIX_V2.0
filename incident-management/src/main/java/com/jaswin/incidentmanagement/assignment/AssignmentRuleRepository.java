package com.jaswin.incidentmanagement.assignment;

import com.jaswin.incidentmanagement.assignment.AssignmentRule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AssignmentRuleRepository extends JpaRepository<AssignmentRule, Long> {
    List<AssignmentRule> findByOrganizationId(Long organizationId);
}
