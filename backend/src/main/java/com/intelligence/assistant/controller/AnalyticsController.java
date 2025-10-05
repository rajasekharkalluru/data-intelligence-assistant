package com.intelligence.assistant.controller;

import com.intelligence.assistant.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/analytics")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class AnalyticsController {
    
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(@AuthenticationPrincipal User user) {
        log.info("Get analytics stats for user: {}", user.getId());
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("total_queries", 0);
        stats.put("total_sessions", 0);
        stats.put("total_sources", 0);
        stats.put("avg_response_time", 0.0);
        
        return ResponseEntity.ok(stats);
    }
}
