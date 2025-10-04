package com.intelligence.assistant.connector;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Connector for Atlassian Confluence
 */
@Component
public class ConfluenceConnector extends BaseConnector {
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private String baseUrl;
    
    public ConfluenceConnector() {
        this.displayName = "Confluence";
        this.description = "Atlassian Confluence wiki and documentation";
        this.httpClient = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }
    
    @Override
    public boolean isConfigured() {
        return credentials != null &&
                credentials.containsKey("confluence_url") &&
                credentials.containsKey("confluence_username") &&
                credentials.containsKey("confluence_api_token");
    }
    
    @Override
    public boolean testConnection() {
        if (!isConfigured()) {
            return false;
        }
        
        try {
            baseUrl = credentials.get("confluence_url");
            String url = baseUrl + "/rest/api/content?limit=1";
            
            Request request = buildRequest(url);
            Response response = httpClient.newCall(request).execute();
            
            return response.isSuccessful();
        } catch (Exception e) {
            logError("Connection test failed", e);
            return false;
        }
    }
    
    @Override
    public List<Map<String, Object>> fetchDocuments() {
        logActivity("Fetching all documents");
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            baseUrl = credentials.get("confluence_url");
            
            // Fetch spaces first
            List<String> spaceKeys = fetchSpaces();
            
            // Fetch pages from each space
            for (String spaceKey : spaceKeys) {
                documents.addAll(fetchPagesFromSpace(spaceKey));
            }
            
            logActivity("Fetched " + documents.size() + " documents");
        } catch (Exception e) {
            logError("Error fetching documents", e);
        }
        
        return documents;
    }
    
    @Override
    public List<Map<String, Object>> fetchDocumentsSince(LocalDateTime sinceDate, String syncToken) {
        logActivity("Fetching documents since " + sinceDate);
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            baseUrl = credentials.get("confluence_url");
            
            // Build CQL query for incremental sync
            String cql = String.format(
                    "lastModified >= '%s' order by lastModified",
                    sinceDate.format(DateTimeFormatter.ISO_LOCAL_DATE_TIME)
            );
            
            String url = baseUrl + "/rest/api/content/search?cql=" + 
                    java.net.URLEncoder.encode(cql, "UTF-8") + 
                    "&expand=body.storage,version,space&limit=100";
            
            Request request = buildRequest(url);
            Response response = httpClient.newCall(request).execute();
            
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode results = root.get("results");
                
                if (results != null && results.isArray()) {
                    for (JsonNode page : results) {
                        documents.add(parsePage(page));
                    }
                }
            }
            
            logActivity("Fetched " + documents.size() + " updated documents");
        } catch (Exception e) {
            logError("Error fetching incremental documents", e);
        }
        
        return documents;
    }
    
    private List<String> fetchSpaces() throws Exception {
        List<String> spaceKeys = new ArrayList<>();
        String url = baseUrl + "/rest/api/space?limit=100";
        
        Request request = buildRequest(url);
        Response response = httpClient.newCall(request).execute();
        
        if (response.isSuccessful() && response.body() != null) {
            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode results = root.get("results");
            
            if (results != null && results.isArray()) {
                for (JsonNode space : results) {
                    spaceKeys.add(space.get("key").asText());
                }
            }
        }
        
        return spaceKeys;
    }
    
    private List<Map<String, Object>> fetchPagesFromSpace(String spaceKey) throws Exception {
        List<Map<String, Object>> pages = new ArrayList<>();
        String url = baseUrl + "/rest/api/content?spaceKey=" + spaceKey + 
                "&expand=body.storage,version,space&limit=100";
        
        Request request = buildRequest(url);
        Response response = httpClient.newCall(request).execute();
        
        if (response.isSuccessful() && response.body() != null) {
            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode results = root.get("results");
            
            if (results != null && results.isArray()) {
                for (JsonNode page : results) {
                    pages.add(parsePage(page));
                }
            }
        }
        
        return pages;
    }
    
    private Map<String, Object> parsePage(JsonNode page) {
        Map<String, Object> document = new HashMap<>();
        
        document.put("id", page.get("id").asText());
        document.put("title", page.get("title").asText());
        
        // Extract content
        JsonNode body = page.get("body");
        if (body != null && body.has("storage")) {
            String content = body.get("storage").get("value").asText();
            // Remove HTML tags (simple approach)
            content = content.replaceAll("<[^>]*>", " ").replaceAll("\\s+", " ").trim();
            document.put("content", content);
        }
        
        // Extract metadata
        document.put("url", baseUrl + page.get("_links").get("webui").asText());
        document.put("type", "confluence_page");
        
        JsonNode space = page.get("space");
        if (space != null) {
            document.put("space_key", space.get("key").asText());
            document.put("space_name", space.get("name").asText());
        }
        
        JsonNode version = page.get("version");
        if (version != null) {
            document.put("version", version.get("number").asInt());
            document.put("updated_at", version.get("when").asText());
        }
        
        return document;
    }
    
    private Request buildRequest(String url) {
        String username = credentials.get("confluence_username");
        String apiToken = credentials.get("confluence_api_token");
        String credential = Credentials.basic(username, apiToken);
        
        return new Request.Builder()
                .url(url)
                .header("Authorization", credential)
                .header("Accept", "application/json")
                .build();
    }
}
