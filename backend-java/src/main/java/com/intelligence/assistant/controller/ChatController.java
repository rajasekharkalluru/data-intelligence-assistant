package com.intelligence.assistant.controller;

import com.intelligence.assistant.dto.QueryRequest;
import com.intelligence.assistant.model.ChatMessage;
import com.intelligence.assistant.model.ChatSession;
import com.intelligence.assistant.model.User;
import com.intelligence.assistant.service.ChatService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class ChatController {
    
    private final ChatService chatService;
    
    @GetMapping("/sessions")
    public ResponseEntity<List<Map<String, Object>>> getSessions(@AuthenticationPrincipal User user) {
        log.info("Get sessions request for user: {}", user.getId());
        
        List<ChatSession> sessions = chatService.getUserSessions(user.getId());
        
        List<Map<String, Object>> response = sessions.stream()
                .map(session -> {
                    Map<String, Object> sessionMap = new HashMap<>();
                    sessionMap.put("id", session.getId());
                    sessionMap.put("title", session.getTitle());
                    sessionMap.put("created_at", session.getCreatedAt());
                    sessionMap.put("updated_at", session.getUpdatedAt());
                    sessionMap.put("message_count", session.getMessages().size());
                    return sessionMap;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/sessions")
    public ResponseEntity<Map<String, Object>> createSession(@AuthenticationPrincipal User user) {
        log.info("Create session request for user: {}", user.getId());
        
        ChatSession session = chatService.createSession(user);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", session.getId());
        response.put("title", session.getTitle());
        response.put("created_at", session.getCreatedAt());
        response.put("updated_at", session.getUpdatedAt());
        response.put("message_count", 0);
        
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/sessions/{sessionId}/messages")
    public ResponseEntity<List<Map<String, Object>>> getSessionMessages(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User user
    ) {
        log.info("Get messages for session: {}", sessionId);
        
        List<ChatMessage> messages = chatService.getSessionMessages(sessionId, user.getId());
        
        List<Map<String, Object>> response = messages.stream()
                .map(message -> {
                    Map<String, Object> messageMap = new HashMap<>();
                    messageMap.put("id", message.getId());
                    messageMap.put("type", message.getType());
                    messageMap.put("content", message.getContent());
                    messageMap.put("sources", message.getSources());
                    messageMap.put("timestamp", message.getTimestamp());
                    return messageMap;
                })
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @PutMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, Object>> updateSession(
            @PathVariable Long sessionId,
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Update session: {}", sessionId);
        
        String title = request.get("title");
        ChatSession session = chatService.updateSessionTitle(sessionId, user.getId(), title);
        
        Map<String, Object> response = new HashMap<>();
        response.put("id", session.getId());
        response.put("title", session.getTitle());
        response.put("updated_at", session.getUpdatedAt());
        
        return ResponseEntity.ok(response);
    }
    
    @DeleteMapping("/sessions/{sessionId}")
    public ResponseEntity<Map<String, String>> deleteSession(
            @PathVariable Long sessionId,
            @AuthenticationPrincipal User user
    ) {
        log.info("Delete session: {}", sessionId);
        
        chatService.deleteSession(sessionId, user.getId());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Session deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/query")
    public ResponseEntity<Map<String, Object>> query(
            @Valid @RequestBody QueryRequest request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Query request from user: {}", user.getId());
        
        Map<String, Object> response = chatService.processQuery(request, user);
        
        return ResponseEntity.ok(response);
    }
}
