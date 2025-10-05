package com.intelligence.assistant.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.*;

@RestController
@RequestMapping("/models")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class ModelController {
    
    @Value("${app.ollama.base-url}")
    private String ollamaBaseUrl;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAvailableModels() {
        log.info("Fetching available models from Ollama");
        
        try {
            String url = ollamaBaseUrl + "/api/tags";
            Map<String, Object> response = restTemplate.getForObject(url, Map.class);
            
            if (response != null && response.containsKey("models")) {
                List<Map<String, Object>> ollamaModels = (List<Map<String, Object>>) response.get("models");
                
                List<Map<String, String>> models = new ArrayList<>();
                for (Map<String, Object> model : ollamaModels) {
                    Map<String, String> modelInfo = new HashMap<>();
                    String name = (String) model.get("name");
                    // Remove :latest suffix if present
                    if (name != null && name.endsWith(":latest")) {
                        name = name.substring(0, name.length() - 7);
                    }
                    modelInfo.put("name", name);
                    
                    Object sizeObj = model.get("size");
                    Long size = sizeObj instanceof Integer ? ((Integer) sizeObj).longValue() : (Long) sizeObj;
                    modelInfo.put("size", formatSize(size));
                    models.add(modelInfo);
                }
                
                Map<String, Object> result = new HashMap<>();
                result.put("models", models);
                return ResponseEntity.ok(result);
            }
            
            // Return default model if Ollama is not available
            return ResponseEntity.ok(getDefaultModels());
            
        } catch (Exception e) {
            log.warn("Could not fetch models from Ollama: {}", e.getMessage());
            // Return default models if Ollama is not available
            return ResponseEntity.ok(getDefaultModels());
        }
    }
    
    private Map<String, Object> getDefaultModels() {
        List<Map<String, String>> models = new ArrayList<>();
        
        Map<String, String> llama32 = new HashMap<>();
        llama32.put("name", "llama3.2");
        llama32.put("size", "2.0 GB");
        models.add(llama32);
        
        Map<String, String> llama31 = new HashMap<>();
        llama31.put("name", "llama3.1");
        llama31.put("size", "4.7 GB");
        models.add(llama31);
        
        Map<String, String> mistral = new HashMap<>();
        mistral.put("name", "mistral");
        mistral.put("size", "4.1 GB");
        models.add(mistral);
        
        Map<String, Object> result = new HashMap<>();
        result.put("models", models);
        return result;
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
