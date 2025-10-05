package com.intelligence.assistant.service;

import java.util.List;
import java.util.Map;

/**
 * AI Service Interface
 * 
 * Abstraction for different AI providers (Local Ollama, OCI Generative AI, etc.)
 */
public interface AIService {
    
    /**
     * Generate a response from the AI model
     * 
     * @param prompt The input prompt
     * @param model The model to use (optional, uses default if null)
     * @param temperature Temperature for generation (0.0 to 1.0)
     * @return The generated response
     */
    String generate(String prompt, String model, Double temperature);
    
    /**
     * Get list of available models
     * 
     * @return List of model information maps
     */
    List<Map<String, String>> getAvailableModels();
    
    /**
     * Check if the AI service is available
     * 
     * @return true if service is reachable
     */
    boolean isAvailable();
    
    /**
     * Get the provider name
     * 
     * @return Provider name (e.g., "local", "oci")
     */
    String getProviderName();
}
