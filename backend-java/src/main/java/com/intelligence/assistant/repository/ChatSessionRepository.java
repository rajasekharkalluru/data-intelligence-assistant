package com.intelligence.assistant.repository;

import com.intelligence.assistant.model.ChatSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChatSessionRepository extends JpaRepository<ChatSession, Long> {
    
    List<ChatSession> findByUserIdOrderByUpdatedAtDesc(Long userId);
    
    List<ChatSession> findByUserId(Long userId);
}
