package com.intelligence.assistant.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@Slf4j
@RequiredArgsConstructor
public class RAGService {
    
    private final AIService aiService;
    
    public Map<String, Object> query(
            String query,
            List<Long> sourceIds,
            String responseType,
            Double temperature,
            String model
    ) {
        log.info("Processing RAG query: {}", query.substring(0, Math.min(50, query.length())));
        
        try {
            // Build context from sources (simplified for now)
            String context = buildContext(sourceIds);
            
            // Build prompt based on response type
            String prompt = buildPrompt(query, context, responseType);
            
            // Get response from AI service (local or OCI)
            String response = aiService.generate(prompt, model, temperature);
            
            // Build response
            Map<String, Object> result = new HashMap<>();
            result.put("response", response);
            result.put("sources", buildSources(sourceIds));
            
            log.info("RAG query processed successfully");
            return result;
            
        } catch (Exception e) {
            log.error("Error processing RAG query", e);
            
            // Return error response
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("response", "I apologize, but I encountered an error processing your request. Please try again.");
            errorResponse.put("sources", new ArrayList<>());
            return errorResponse;
        }
    }
    
    private String buildContext(List<Long> sourceIds) {
        // TODO: Implement actual context retrieval from vector store
        // For now, return empty context
        if (sourceIds == null || sourceIds.isEmpty()) {
            return "";
        }
        
        return "Context from data sources will be retrieved here.";
    }
    
    private String buildPrompt(String query, String context, String responseType) {
        StringBuilder prompt = new StringBuilder();
        
        // Add system instructions based on response type
        switch (responseType != null ? responseType : "concise") {
            case "brief":
                prompt.append("Provide a brief, direct answer in 1-2 sentences.\n\n");
                break;
            case "expansive":
                prompt.append("Provide a comprehensive, detailed answer with examples and explanations.\n\n");
                break;
            default: // concise
                prompt.append("Provide a clear, concise answer with key details.\n\n");
        }
        
        // Add context if available
        if (context != null && !context.isEmpty()) {
            prompt.append("Context:\n").append(context).append("\n\n");
        }
        
        // Add query
        prompt.append("Question: ").append(query);
        
        return prompt.toString();
    }
    
    private List<Map<String, Object>> buildSources(List<Long> sourceIds) {
        // TODO: Implement actual source retrieval
        List<Map<String, Object>> sources = new ArrayList<>();
        
        if (sourceIds != null && !sourceIds.isEmpty()) {
            for (Long sourceId : sourceIds) {
                Map<String, Object> source = new HashMap<>();
                source.put("id", sourceId);
                source.put("title", "Source " + sourceId);
                source.put("url", "#");
                sources.add(source);
            }
        }
        
        return sources;
    }
}
