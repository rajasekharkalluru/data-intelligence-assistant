package com.intelligence.assistant.connector;

import lombok.extern.slf4j.Slf4j;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Base class for all data source connectors
 */
@Slf4j
public abstract class BaseConnector {
    
    protected String displayName;
    protected String description;
    protected Map<String, String> credentials;
    
    /**
     * Set credentials for this connector
     */
    public void setCredentials(Map<String, String> credentials) {
        this.credentials = credentials;
    }
    
    /**
     * Check if connector is properly configured
     */
    public abstract boolean isConfigured();
    
    /**
     * Test connection to the data source
     */
    public abstract boolean testConnection();
    
    /**
     * Fetch all documents from the data source
     */
    public abstract List<Map<String, Object>> fetchDocuments();
    
    /**
     * Fetch documents modified since a specific date (incremental sync)
     */
    public abstract List<Map<String, Object>> fetchDocumentsSince(LocalDateTime sinceDate, String syncToken);
    
    /**
     * Get the display name of this connector
     */
    public String getDisplayName() {
        return displayName;
    }
    
    /**
     * Get the description of this connector
     */
    public String getDescription() {
        return description;
    }
    
    /**
     * Extract text content from a document
     */
    protected String extractContent(Map<String, Object> document) {
        StringBuilder content = new StringBuilder();
        
        if (document.containsKey("title")) {
            content.append(document.get("title")).append("\n\n");
        }
        
        if (document.containsKey("content")) {
            content.append(document.get("content"));
        }
        
        if (document.containsKey("description")) {
            content.append("\n\n").append(document.get("description"));
        }
        
        return content.toString();
    }
    
    /**
     * Log connector activity
     */
    protected void logActivity(String message) {
        log.info("[{}] {}", displayName, message);
    }
    
    /**
     * Log connector error
     */
    protected void logError(String message, Exception e) {
        log.error("[{}] {}", displayName, message, e);
    }
}
