package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.enums.Role;
import com.jaswin.incidentmanagement.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.Arrays;

@Service
@RequiredArgsConstructor
public class TenantContextService {

    private final UserRepository userRepository;

    public User currentUser() {
        Object principal = SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        if (principal instanceof User user) {
            return userRepository.findById(user.getId()).orElse(user);
        }
        throw new AccessDeniedException("User not authenticated");
    }

    public Organization currentOrganization() {
        User user = currentUser();
        if (user.getOrganization() == null) {
            throw new AccessDeniedException("This action requires an organization-scoped user");
        }
        return user.getOrganization();
    }

    public Long currentOrganizationId() {
        return currentOrganization().getId();
    }

    public void requireAny(Role... roles) {
        Role actual = currentUser().getRole();
        if (actual == Role.SUPER_ADMIN) {
            return;
        }
        boolean allowed = Arrays.stream(roles).anyMatch(role -> role == actual);
        if (!allowed) {
            throw new AccessDeniedException("Insufficient role for this action");
        }
    }

    public boolean hasAny(Role... roles) {
        Role actual = currentUser().getRole();
        if (actual == Role.SUPER_ADMIN) {
            return true;
        }
        return Arrays.stream(roles).anyMatch(role -> role == actual);
    }
}
