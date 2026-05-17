package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.IncidentHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentHistoryRepository extends JpaRepository<IncidentHistory, Long> {
    List<IncidentHistory> findByIncidentIdOrderByUpdatedAtDesc(Long incidentId);
}
