package com.intelligence.assistant.controller;

import com.intelligence.assistant.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/models")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class ModelController {
    
    private final AIService aiService;
    
    @Value("${app.ai.provider}")
    private String aiProvider;
    
    @GetMapping
    public ResponseEntity<Map<String, Object>> getAvailableModels() {
        log.info("Fetching available models from {} provider", aiProvider);
        
        List<Map<String, String>> models = aiService.getAvailableModels();
        
        Map<String, Object> result = new HashMap<>();
        result.put("models", models);
        result.put("provider", aiService.getProviderName());
        result.put("available", aiService.isAvailable());
        
        return ResponseEntity.ok(result);
    }
}
