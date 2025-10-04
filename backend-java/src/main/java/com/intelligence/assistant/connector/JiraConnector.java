package com.intelligence.assistant.connector;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

/**
 * Connector for Atlassian JIRA
 */
@Component
public class JiraConnector extends BaseConnector {
    
    private final OkHttpClient httpClient;
    private final ObjectMapper objectMapper;
    private String baseUrl;
    
    public JiraConnector() {
        this.displayName = "JIRA";
        this.description = "Atlassian JIRA issues and project documentation";
        this.httpClient = new OkHttpClient();
        this.objectMapper = new ObjectMapper();
    }
    
    @Override
    public boolean isConfigured() {
        return credentials != null &&
                credentials.containsKey("jira_url") &&
                credentials.containsKey("jira_username") &&
                credentials.containsKey("jira_api_token");
    }
    
    @Override
    public boolean testConnection() {
        if (!isConfigured()) {
            return false;
        }
        
        try {
            baseUrl = credentials.get("jira_url");
            String url = baseUrl + "/rest/api/3/myself";
            
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
        logActivity("Fetching all issues");
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            baseUrl = credentials.get("jira_url");
            
            // Fetch all issues with JQL
            String jql = "project is not EMPTY ORDER BY updated DESC";
            documents.addAll(fetchIssuesWithJQL(jql, 100));
            
            logActivity("Fetched " + documents.size() + " issues");
        } catch (Exception e) {
            logError("Error fetching documents", e);
        }
        
        return documents;
    }
    
    @Override
    public List<Map<String, Object>> fetchDocumentsSince(LocalDateTime sinceDate, String syncToken) {
        logActivity("Fetching issues since " + sinceDate);
        List<Map<String, Object>> documents = new ArrayList<>();
        
        try {
            baseUrl = credentials.get("jira_url");
            
            // Build JQL for incremental sync
            String dateStr = sinceDate.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            String jql = String.format("updated >= '%s' ORDER BY updated DESC", dateStr);
            
            documents.addAll(fetchIssuesWithJQL(jql, 100));
            
            logActivity("Fetched " + documents.size() + " updated issues");
        } catch (Exception e) {
            logError("Error fetching incremental documents", e);
        }
        
        return documents;
    }
    
    private List<Map<String, Object>> fetchIssuesWithJQL(String jql, int maxResults) throws Exception {
        List<Map<String, Object>> issues = new ArrayList<>();
        
        String url = baseUrl + "/rest/api/3/search?jql=" + 
                java.net.URLEncoder.encode(jql, "UTF-8") + 
                "&maxResults=" + maxResults +
                "&fields=*all";
        
        Request request = buildRequest(url);
        Response response = httpClient.newCall(request).execute();
        
        if (response.isSuccessful() && response.body() != null) {
            String responseBody = response.body().string();
            JsonNode root = objectMapper.readTree(responseBody);
            JsonNode issuesNode = root.get("issues");
            
            if (issuesNode != null && issuesNode.isArray()) {
                for (JsonNode issue : issuesNode) {
                    issues.add(parseIssue(issue));
                }
            }
        }
        
        return issues;
    }
    
    private Map<String, Object> parseIssue(JsonNode issue) {
        Map<String, Object> document = new HashMap<>();
        
        String key = issue.get("key").asText();
        JsonNode fields = issue.get("fields");
        
        document.put("id", key);
        document.put("title", key + ": " + fields.get("summary").asText());
        
        // Build content
        StringBuilder content = new StringBuilder();
        content.append("Summary: ").append(fields.get("summary").asText()).append("\n\n");
        
        if (fields.has("description") && !fields.get("description").isNull()) {
            content.append("Description: ").append(fields.get("description").asText()).append("\n\n");
        }
        
        // Add priority
        if (fields.has("priority") && !fields.get("priority").isNull()) {
            content.append("Priority: ").append(fields.get("priority").get("name").asText()).append("\n");
        }
        
        // Add assignee
        if (fields.has("assignee") && !fields.get("assignee").isNull()) {
            content.append("Assignee: ").append(fields.get("assignee").get("displayName").asText()).append("\n");
        }
        
        // Add labels
        if (fields.has("labels") && fields.get("labels").isArray()) {
            List<String> labels = new ArrayList<>();
            for (JsonNode label : fields.get("labels")) {
                labels.add(label.asText());
            }
            if (!labels.isEmpty()) {
                content.append("Labels: ").append(String.join(", ", labels)).append("\n");
            }
        }
        
        document.put("content", content.toString());
        
        // Extract comments
        List<Map<String, String>> comments = new ArrayList<>();
        if (fields.has("comment") && fields.get("comment").has("comments")) {
            JsonNode commentsNode = fields.get("comment").get("comments");
            for (JsonNode comment : commentsNode) {
                Map<String, String> commentMap = new HashMap<>();
                commentMap.put("author", comment.get("author").get("displayName").asText());
                commentMap.put("body", comment.get("body").asText());
                commentMap.put("created", comment.get("created").asText());
                comments.add(commentMap);
            }
        }
        document.put("comments", comments);
        
        // Metadata
        document.put("url", baseUrl + "/browse/" + key);
        document.put("type", "jira_issue");
        document.put("issue_type", fields.get("issuetype").get("name").asText());
        document.put("status", fields.get("status").get("name").asText());
        document.put("project", fields.get("project").get("key").asText());
        document.put("project_name", fields.get("project").get("name").asText());
        document.put("created_at", fields.get("created").asText());
        document.put("updated_at", fields.get("updated").asText());
        
        return document;
    }
    
    private Request buildRequest(String url) {
        String username = credentials.get("jira_username");
        String apiToken = credentials.get("jira_api_token");
        String credential = Credentials.basic(username, apiToken);
        
        return new Request.Builder()
                .url(url)
                .header("Authorization", credential)
                .header("Accept", "application/json")
                .build();
    }
}
