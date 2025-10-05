package com.intelligence.assistant.service;

import com.intelligence.assistant.dto.QueryRequest;
import com.intelligence.assistant.model.ChatMessage;
import com.intelligence.assistant.model.ChatSession;
import com.intelligence.assistant.model.User;
import com.intelligence.assistant.repository.ChatMessageRepository;
import com.intelligence.assistant.repository.ChatSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class ChatService {
    
    private final ChatSessionRepository sessionRepository;
    private final ChatMessageRepository messageRepository;
    private final RAGService ragService;
    private final ObjectMapper objectMapper;
    
    @Transactional
    public ChatSession createSession(User user) {
        log.info("Creating new chat session for user: {}", user.getId());
        
        ChatSession session = ChatSession.builder()
                .user(user)
                .title("New Chat")
                .build();
        
        return sessionRepository.save(session);
    }
    
    public List<ChatSession> getUserSessions(Long userId) {
        return sessionRepository.findByUserIdOrderByUpdatedAtDesc(userId);
    }
    
    public ChatSession getSession(Long sessionId, Long userId) {
        ChatSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Session not found"));
        
        if (!session.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to session");
        }
        
        return session;
    }
    
    public List<ChatMessage> getSessionMessages(Long sessionId, Long userId) {
        // Verify access
        getSession(sessionId, userId);
        return messageRepository.findBySessionIdOrderByTimestampAsc(sessionId);
    }
    
    @Transactional
    public ChatSession updateSessionTitle(Long sessionId, Long userId, String title) {
        ChatSession session = getSession(sessionId, userId);
        session.setTitle(title);
        return sessionRepository.save(session);
    }
    
    @Transactional
    public void deleteSession(Long sessionId, Long userId) {
        ChatSession session = getSession(sessionId, userId);
        sessionRepository.delete(session);
        log.info("Deleted session: {}", sessionId);
    }
    
    @Transactional
    public Map<String, Object> processQuery(QueryRequest request, User user) {
        log.info("Processing query for user: {}", user.getId());
        
        // Get or create session
        ChatSession session;
        if (request.getSessionId() != null) {
            session = getSession(request.getSessionId(), user.getId());
        } else {
            session = createSession(user);
        }
        
        // Save user message
        ChatMessage userMessage = ChatMessage.builder()
                .session(session)
                .type("user")
                .content(request.getQuery())
                .build();
        messageRepository.save(userMessage);
        
        // Get AI response using RAG
        Map<String, Object> ragResponse = ragService.query(
                request.getQuery(),
                request.getSourceIds(),
                request.getResponseType(),
                request.getTemperature(),
                request.getModel()
        );
        
        // Save assistant message
        try {
            String sourcesJson = objectMapper.writeValueAsString(ragResponse.get("sources"));
            ChatMessage assistantMessage = ChatMessage.builder()
                    .session(session)
                    .type("assistant")
                    .content((String) ragResponse.get("response"))
                    .sources(sourcesJson)
                    .build();
            messageRepository.save(assistantMessage);
        } catch (Exception e) {
            log.error("Error saving assistant message", e);
        }
        
        // Update session title if it's the first message
        if (session.getMessages().size() <= 2 && session.getTitle().equals("New Chat")) {
            String title = request.getQuery().substring(0, Math.min(50, request.getQuery().length()));
            session.setTitle(title);
            sessionRepository.save(session);
        }
        
        // Return response
        Map<String, Object> response = new HashMap<>();
        response.put("response", ragResponse.get("response"));
        response.put("sources", ragResponse.get("sources"));
        response.put("sessionId", session.getId());
        
        return response;
    }
}
