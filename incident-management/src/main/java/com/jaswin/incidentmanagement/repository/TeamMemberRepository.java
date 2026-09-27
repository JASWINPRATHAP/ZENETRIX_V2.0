package com.jaswin.incidentmanagement.repository;

import com.jaswin.incidentmanagement.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamId(Long teamId);

    List<TeamMember> findByTeamIdIn(List<Long> teamIds);

    boolean existsByTeamIdAndUserId(Long teamId, Long userId);

    void deleteByUserId(Long userId);
}
