package com.jaswin.incidentmanagement.assignment;

import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
@Slf4j
public class AssignmentEngine {

    private final AssignmentRuleRepository ruleRepository;
    private final UserRepository userRepository;

    public void autoAssignIncident(Incident incident) {
        if (incident.getOrganization() == null) {
            return; // No org to assign within
        }

        List<AssignmentRule> rules = ruleRepository.findByOrganizationId(incident.getOrganization().getId());
        String fullText = (incident.getTitle() + " " + incident.getDescription()).toLowerCase();

        for (AssignmentRule rule : rules) {
            if (fullText.contains(rule.getKeyword().toLowerCase())) {
                log.info("Assignment rule matched keyword '{}'. Target Team: {}", rule.getKeyword(), rule.getTargetTeam());

                // Priority Override Logic
                if (rule.getPriorityOverride() != null) {
                    incident.setPriority(rule.getPriorityOverride());
                    log.info("Incident priority overridden to {}", rule.getPriorityOverride());
                }

                // Random Engineer Assignment Logic
                List<User> engineers = userRepository.findByRoleAndTeamAndOrganizationId(
                        Role.SUPPORT_ENGINEER, rule.getTargetTeam(), incident.getOrganization().getId());

                if (!engineers.isEmpty()) {
                    User assignedEngineer = engineers.get(ThreadLocalRandom.current().nextInt(engineers.size()));
                    incident.setAssignedTo(assignedEngineer);
                    log.info("Incident successfully auto-assigned to engineer: {}", assignedEngineer.getName());
                } else {
                    log.warn("No engineers found in team {} for organization {}", rule.getTargetTeam(), incident.getOrganization().getName());
                }
                
                // Break after first match or keep evaluating? Let's just use the first matched rule.
                break;
            }
        }
    }
}
