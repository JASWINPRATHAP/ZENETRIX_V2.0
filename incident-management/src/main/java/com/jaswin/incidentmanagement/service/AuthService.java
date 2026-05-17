package com.jaswin.incidentmanagement.service;

import com.jaswin.incidentmanagement.dto.AuthRequest;
import com.jaswin.incidentmanagement.dto.AuthResponse;
import com.jaswin.incidentmanagement.dto.RegisterRequest;
import com.jaswin.incidentmanagement.entity.Organization;
import com.jaswin.incidentmanagement.entity.User;
import com.jaswin.incidentmanagement.repository.OrganizationRepository;
import com.jaswin.incidentmanagement.repository.UserRepository;
import com.jaswin.incidentmanagement.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        Organization org = null;
        if (request.getOrganizationId() != null) {
            org = organizationRepository.findById(request.getOrganizationId())
                    .orElseThrow(() -> new RuntimeException("Organization not found"));
        }

        User user = User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .organization(org)
                .build();

        userRepository.save(user);

        Long orgId = (org != null) ? org.getId() : null;
        String jwtToken = jwtUtil.generateToken(user, orgId);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("User registered successfully")
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User not found"));

        Long orgId = (user.getOrganization() != null) ? user.getOrganization().getId() : null;
        String jwtToken = jwtUtil.generateToken(user, orgId);

        return AuthResponse.builder()
                .token(jwtToken)
                .message("Login successful")
                .build();
    }
}
