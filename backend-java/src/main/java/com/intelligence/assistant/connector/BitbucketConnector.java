package com.intelligence.assistant.connector;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.*;

/**
 * Connector for Bitbucket repositories
 */
@Component
public class BitbucketConnector extends BaseConnector {
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private static final String BASE_URL = "https://api.bitbucket.org/2.0";
    
    // Files to fetch from repositories
    private static final List<String> IMPORTANT_FILES = Arrays.asList(
            "README.md", "README.rst", "README.txt", "README",
            "CONTRIBUTING.md", "ARCHITECTURE.md", "API.md",
            "docs/README.md", "docs/index.md"
    );
    
    public BitbucketConnector() {
        this.displayName = "Bitbucket";
        this.description = "Bitbucket repositories and documentation";
        this.httpClient = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }
    
    @Override
    public boolean isConfigured() {
        return credentials != null &&
                credentials.containsKey("bitbucket_workspace") &&
                credentials.containsKey("bitbucket_username") &&
                credentials.containsKey("bitbucket_app_password");
    }
    
    @Override
    public boolean testConnection() {
        if (!isConfigured()) {
            return false;
        }
        
        try {
            String workspace = credentials.get("bitbucket_workspace");
            String url = BASE_URL + "/workspaces/" + workspace;
            
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
        logActivity("Fetching all repositories");
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            String workspace = credentials.get("bitbucket_workspace");
            List<JsonNode> repositories = fetchRepositories(workspace);
            
            for (JsonNode repo : repositories) {
                documents.addAll(fetchRepositoryFiles(workspace, repo));
            }
            
            logActivity("Fetched " + documents.size() + " documents");
        } catch (Exception e) {
            logError("Error fetching documents", e);
        }
        
        return documents;
    }
    
    @Override
    public List<Map<String, Object>> fetchDocumentsSince(LocalDateTime sinceDate, String syncToken) {
        logActivity("Fetching repositories since " + sinceDate);
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            String workspace = credentials.get("bitbucket_workspace");
            
            // Fetch repositories updated since date
            String url = BASE_URL + "/repositories/" + workspace + 
                    "?q=updated_on>=" + sinceDate.toString();
            
            Request request = buildRequest(url);
            Response response = httpClient.newCall(request).execute();
            
            if (response.isSuccessful() && response.body() != null) {
                String responseBody = response.body().string();
                JsonNode root = objectMapper.readTree(responseBody);
                JsonNode values = root.get("values");
                
                if (values != null && values.isArray()) {
                    for (JsonNode repo : values) {
                        documents.addAll(fetchRepositoryFiles(workspace, repo));
                    }
                }
            }
            
            logActivity("Fetched " + documents.size() + " updated documents");
        } catch (Exception e) {
            logError("Error fetching incremental documents", e);
        }
        
        return documents;
    }
    
    private List<JsonNode> fetchRepositories(String workspace) throws Exception {
        List<JsonNode> repositories = new ArrayList<>();
        String url = BASE_URL + "/repositories/" + workspace;
        
        Request request = buildRequest(url);
        Response response = httpClient.newCall(request).execute();
        
        if (response.isSuccessful() && response.body() != null) {
            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode values = root.get("values");
            
            if (values != null && values.isArray()) {
                for (JsonNode repo : values) {
                    repositories.add(repo);
                }
            }
        }
        
        return repositories;
    }
    
    private List<Map<String, Object>> fetchRepositoryFiles(String workspace, JsonNode repo) {
        List<Map<String, Object>> documents = new ArrayList<>();
        String repoSlug = repo.get("slug").asText();
        String repoName = repo.get("name").asText();
        
        for (String filePath : IMPORTANT_FILES) {
            try {
                String url = BASE_URL + "/repositories/" + workspace + "/" + repoSlug + 
                        "/src/main/" + filePath;
                
                Request request = buildRequest(url);
                Response response = httpClient.newCall(request).execute();
                
                if (response.isSuccessful() && response.body() != null) {
                    String content = response.body().string();
                    
                    // Only include if content is substantial
                    if (content.trim().length() > 50) {
                        Map<String, Object> document = new HashMap<>();
                        document.put("id", workspace + "_" + repoSlug + "_" + filePath.replace("/", "_"));
                        document.put("title", repoName + " - " + filePath);
                        document.put("content", content);
                        document.put("file_path", filePath);
                        document.put("url", repo.get("links").get("html").get("href").asText() + 
                                "/src/main/" + filePath);
                        document.put("type", "bitbucket_file");
                        document.put("repository", repoName);
                        document.put("language", repo.has("language") ? repo.get("language").asText() : "unknown");
                        document.put("created_at", repo.get("created_on").asText());
                        document.put("updated_at", repo.get("updated_on").asText());
                        
                        documents.add(document);
                    }
                }
            } catch (Exception e) {
                // File doesn't exist or error, continue to next file
                continue;
            }
        }
        
        return documents;
    }
    
    private Request buildRequest(String url) {
        String username = credentials.get("bitbucket_username");
        String appPassword = credentials.get("bitbucket_app_password");
        String credential = Credentials.basic(username, appPassword);
        
        return new Request.Builder()
                .url(url)
                .header("Authorization", credential)
                .header("Accept", "application/json")
                .build();
    }
}
