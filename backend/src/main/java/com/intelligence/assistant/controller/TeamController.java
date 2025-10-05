package com.intelligence.assistant.controller;

import com.intelligence.assistant.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/teams")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class TeamController {
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getTeams(@AuthenticationPrincipal User user) {
        log.info("Get teams for user: {}", user.getId());
        // Return empty list for now
        return ResponseEntity.ok(new ArrayList<>());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getTeam(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        log.info("Get team: {}", id);
        Map<String, Object> team = new HashMap<>();
        team.put("id", id);
        team.put("name", "team-" + id);
        team.put("display_name", "Team " + id);
        team.put("members", new ArrayList<>());
        return ResponseEntity.ok(team);
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createTeam(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Create team request from user: {}", user.getId());
        Map<String, Object> team = new HashMap<>();
        team.put("id", System.currentTimeMillis());
        team.put("name", request.get("name"));
        team.put("display_name", request.get("display_name"));
        team.put("description", request.get("description"));
        return ResponseEntity.ok(team);
    }
    
    @PostMapping("/{id}/invite")
    public ResponseEntity<Map<String, String>> inviteMember(
            @PathVariable Long id,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Invite member to team: {}", id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Member invited successfully");
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/{teamId}/members/{memberId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @PathVariable Long teamId,
            @PathVariable Long memberId,
            @AuthenticationPrincipal User user
    ) {
        log.info("Remove member {} from team: {}", memberId, teamId);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Member removed successfully");
        return ResponseEntity.ok(response);
    }
}
