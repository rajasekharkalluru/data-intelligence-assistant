package com.intelligence.assistant.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.*;

/**
 * OCI Generative AI Service Implementation
 * 
 * Note: This is a basic implementation. For production use, you should use the
 * official OCI Java SDK for proper authentication and request signing.
 */
@Service
@Slf4j
@ConditionalOnProperty(name = "app.ai.provider", havingValue = "oci")
public class OCIAIService implements AIService {
    
    @Value("${app.oci.generative-ai.endpoint}")
    private String endpoint;
    
    @Value("${app.oci.generative-ai.compartment-id}")
    private String compartmentId;
    
    @Value("${app.oci.generative-ai.model-id}")
    private String defaultModelId;
    
    @Value("${app.oci.config-file:~/.oci/config}")
    private String configFile;
    
    @Value("${app.oci.profile:DEFAULT}")
    private String profile;
    
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Override
    public String generate(String prompt, String model, Double temperature) {
        String modelToUse = (model != null && !model.isEmpty()) ? model : defaultModelId;
        
        try {
            String url = endpoint + "/20231130/actions/generateText";
            
            // Build request body
            Map<String, Object> servingMode = new HashMap<>();
            servingMode.put("modelId", modelToUse);
            servingMode.put("servingType", "ON_DEMAND");
            
            Map<String, Object> inferenceRequest = new HashMap<>();
            inferenceRequest.put("prompt", prompt);
            inferenceRequest.put("maxTokens", 500);
            inferenceRequest.put("temperature", temperature != null ? temperature : 0.7);
            
            Map<String, Object> request = new HashMap<>();
            request.put("compartmentId", compartmentId);
            request.put("servingMode", servingMode);
            request.put("inferenceRequest", inferenceRequest);
            
            // Note: In production, you need to add OCI request signing
            // This is a simplified version - you should use OCI SDK for proper authentication
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Add OCI authentication headers here
            
            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(request, headers);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                entity,
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                Map<String, Object> inferenceResponse = (Map<String, Object>) body.get("inferenceResponse");
                if (inferenceResponse != null) {
                    List<Map<String, Object>> generatedTexts = (List<Map<String, Object>>) inferenceResponse.get("generatedTexts");
                    if (generatedTexts != null && !generatedTexts.isEmpty()) {
                        return (String) generatedTexts.get(0).get("text");
                    }
                }
            }
            
            log.warn("No response from OCI Generative AI");
            return "I apologize, but I couldn't generate a response at this time.";
            
        } catch (Exception e) {
            log.error("Error calling OCI Generative AI: {}", e.getMessage());
            return "I apologize, but I encountered an error while processing your request. Please ensure OCI credentials are configured.";
        }
    }
    
    @Override
    public List<Map<String, String>> getAvailableModels() {
        // Return list of supported OCI models
        List<Map<String, String>> models = new ArrayList<>();
        
        Map<String, String> cohere = new HashMap<>();
        cohere.put("name", "cohere.command-r-plus");
        cohere.put("size", "Cloud");
        models.add(cohere);
        
        Map<String, String> llama = new HashMap<>();
        llama.put("name", "meta.llama-3-70b-instruct");
        llama.put("size", "Cloud");
        models.add(llama);
        
        Map<String, String> cohereLight = new HashMap<>();
        cohereLight.put("name", "cohere.command-r-16k");
        cohereLight.put("size", "Cloud");
        models.add(cohereLight);
        
        return models;
    }
    
    @Override
    public boolean isAvailable() {
        // Check if OCI credentials are configured
        return compartmentId != null && !compartmentId.isEmpty();
    }
    
    @Override
    public String getProviderName() {
        return "oci";
    }
}
