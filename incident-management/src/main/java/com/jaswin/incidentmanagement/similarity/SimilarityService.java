package com.jaswin.incidentmanagement.similarity;

import com.jaswin.incidentmanagement.dto.ResolutionSuggestionResponse;
import com.jaswin.incidentmanagement.entity.Incident;
import com.jaswin.incidentmanagement.enums.Status;
import com.jaswin.incidentmanagement.repository.IncidentRepository;
import com.jaswin.incidentmanagement.service.IncidentService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SimilarityService {

    private final IncidentService incidentService;
    private final IncidentRepository incidentRepository;
    private final SimilarityCalculator similarityCalculator;

    public List<Map<String, Object>> findSimilarIncidents(Long incidentId) {
        Incident targetIncident = incidentService.getIncidentById(incidentId);
        List<Incident> allOrgIncidents = incidentService.getAllIncidents(org.springframework.data.domain.Pageable.unpaged()).getContent(); // Already filtered by org in IncidentService

        return allOrgIncidents.stream()
                .filter(incident -> !incident.getId().equals(incidentId)) // Don't compare with itself
                .map(incident -> {
                    double score = similarityCalculator.calculateJaccardSimilarity(
                            targetIncident.getTitle() + " " + targetIncident.getDescription(),
                            incident.getTitle() + " " + incident.getDescription()
                    );
                    Map<String, Object> result = new HashMap<>();
                    result.put("incident", incident);
                    result.put("similarityScore", score);
                    return result;
                })
                .filter(result -> (double) result.get("similarityScore") > 0.3) // Threshold for similarity
                .sorted((a, b) -> Double.compare((double) b.get("similarityScore"), (double) a.get("similarityScore")))
                .collect(Collectors.toList());
    }

    public List<ResolutionSuggestionResponse> findResolutionSuggestions(Long incidentId) {
        Incident targetIncident = incidentService.getIncidentById(incidentId);
        if (targetIncident.getService() == null || targetIncident.getOrganization() == null) {
            return List.of();
        }

        return incidentRepository
                .findTop3ByOrganizationIdAndServiceIdAndStatusOrderByResolvedAtDesc(
                        targetIncident.getOrganization().getId(),
                        targetIncident.getService().getId(),
                        Status.RESOLVED)
                .stream()
                .filter(incident -> !incident.getId().equals(incidentId))
                .map(incident -> ResolutionSuggestionResponse.builder()
                        .incidentId(incident.getId())
                        .title(incident.getTitle())
                        .resolutionNotes(incident.getResolutionNotes())
                        .resolvedBy(incident.getAssignedTo() != null ? incident.getAssignedTo().getName() : "Unassigned")
                        .resolvedInHours(resolveHours(incident))
                        .score(score(targetIncident, incident))
                        .build())
                .sorted((left, right) -> Integer.compare(right.getScore(), left.getScore()))
                .limit(3)
                .toList();
    }

    private int score(Incident target, Incident candidate) {
        int score = 3;
        if (target.getPriority() == candidate.getPriority()) {
            score += 1;
        }
        if (target.getProject() != null && candidate.getProject() != null
                && target.getProject().getId().equals(candidate.getProject().getId())) {
            score += 2;
        }

        String[] words = target.getTitle().toLowerCase().split("\\W+");
        String candidateTitle = candidate.getTitle().toLowerCase();
        for (String word : words) {
            if (word.length() > 3 && candidateTitle.contains(word)) {
                score += 1;
            }
        }
        return score;
    }

    private long resolveHours(Incident incident) {
        if (incident.getCreatedAt() == null || incident.getResolvedAt() == null) {
            return 0;
        }
        return java.time.Duration.between(incident.getCreatedAt(), incident.getResolvedAt()).toHours();
    }
}
