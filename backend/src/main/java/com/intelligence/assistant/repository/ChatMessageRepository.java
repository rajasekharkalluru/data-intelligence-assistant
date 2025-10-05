package com.intelligence.assistant.repository;

import com.intelligence.assistant.model.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    
    List<ChatMessage> findBySessionIdOrderByTimestampAsc(Long sessionId);
    
    List<ChatMessage> findBySessionId(Long sessionId);
}
