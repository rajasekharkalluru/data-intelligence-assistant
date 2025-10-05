package com.intelligence.assistant.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * Local Ollama AI Service Implementation
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "local", matchIfMissing = true)
public class LocalAIService implements AIService {
    
    @Value("${app.ollama.base-url}")
    private String ollamaBaseUrl;
    
    @Value("${app.ollama.model}")
    private String defaultModel;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Override
    public String generate(String prompt, String model, Double temperature) {
        String modelToUse = (model != null && !model.isEmpty()) ? model : defaultModel;
        
        try {
            String url = ollamaBaseUrl + "/api/generate";
            
            Map<String, Object> request = new HashMap<>();
            request.put("model", modelToUse);
            request.put("prompt", prompt);
            request.put("stream", false);
            
            if (temperature != null) {
                Map<String, Object> options = new HashMap<>();
                options.put("temperature", temperature);
                request.put("options", options);
            }
            
            Map<String, Object> response = restTemplate.postForObject(url, request, Map.class);
            
            if (response != null && response.containsKey("response")) {
                return (String) response.get("response");
            }
            
            log.warn("No response from Ollama");
            return "I apologize, but I couldn't generate a response at this time.";
            
        } catch (Exception e) {
            log.error("Error calling Ollama: {}", e.getMessage());
            return "I apologize, but I encountered an error while processing your request.";
        }
    }
    
    @Override
    public List<Map<String, String>> getAvailableModels() {
        try {
            String url = ollamaBaseUrl + "/api/tags";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("models")) {
                List<Map<String, Object>> ollamaModels = (List<Map<String, Object>>) response.get("models");
                
                List<Map<String, String>> models = new ArrayList<>();
                for (Map<String, Object> model : ollamaModels) {
                    Map<String, String> modelInfo = new HashMap<>();
                    String name = (String) model.get("name");
                    if (name != null && name.endsWith(":latest")) {
                        name = name.substring(0, name.length() - 7);
                    }
                    modelInfo.put("name", name);
                    
                    Object sizeObj = model.get("size");
                    Long size = sizeObj instanceof Integer ? ((Integer) sizeObj).longValue() : (Long) sizeObj;
                    modelInfo.put("size", formatSize(size));
                    models.add(modelInfo);
                }
                return models;
            }
        } catch (Exception e) {
            log.warn("Could not fetch models from Ollama: {}", e.getMessage());
        }
        
        return getDefaultModels();
    }
    
    @Override
    public boolean isAvailable() {
        try {
            String url = ollamaBaseUrl + "/api/tags";
            restTemplate.getForObject(url, Map.class);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
    
    @Override
    public String getProviderName() {
        return "local";
    }
    
    private List<Map<String, String>> getDefaultModels() {
        List<Map<String, String>> models = new ArrayList<>();
        
        Map<String, String> llama32 = new HashMap<>();
        llama32.put("name", "llama3.2");
        llama32.put("size", "2.0 GB");
        models.add(llama32);
        
        return models;
    }
    
    private String formatSize(Long bytes) {
        if (bytes == null) return "Unknown";
        
        double gb = bytes / (1024.0 * 1024.0 * 1024.0);
        if (gb >= 1) {
            return String.format("%.1f GB", gb);
        }
        
        double mb = bytes / (1024.0 * 1024.0);
        return String.format("%.1f MB", mb);
    }
}
