package com.intelligence.assistant.cli;

import com.fasterxml.jackson.databind.JsonNode;
import picocli.CommandLine.Command;
import picocli.CommandLine.ParentCommand;

@Command(name = "sources", description = "List all data sources")
public class SourcesCommand implements Runnable {
    
    @ParentCommand
    private AssistantCLI parent;
    
    @Override
    public void run() {
        try {
            ApiClient client = new ApiClient(parent.getApiUrl());
            
            if (!client.isAuthenticated()) {
                System.err.println("❌ Not authenticated. Please login first: dia login");
                System.exit(1);
            }
            
            // Get data sources
            JsonNode response = client.get("/data-sources");
            
            if (!response.isArray() || response.size() == 0) {
                System.out.println("No data sources found.");
                System.out.println("Add sources via the web UI at http://localhost:3000");
                return;
            }
            
            System.out.println("📊 Data Sources:\n");
            
            for (JsonNode source : response) {
                long id = source.get("id").asLong();
                String name = source.get("name").asText();
                String displayName = source.has("displayName") ? source.get("displayName").asText() : name;
                String type = source.get("sourceType").asText();
                boolean active = source.get("isActive").asBoolean();
                String syncStatus = source.has("syncStatus") ? source.get("syncStatus").asText() : "unknown";
                
                String statusIcon = active ? "✅" : "❌";
                String syncIcon = switch (syncStatus.toLowerCase()) {
                    case "completed" -> "✅";
                    case "in_progress" -> "⏳";
                    case "failed" -> "❌";
                    default -> "⚪";
                };
                
                System.out.printf("[%d] %s %s\n", id, statusIcon, displayName);
                System.out.printf("    Type: %s | Status: %s %s\n", type, syncIcon, syncStatus);
                System.out.println();
            }
            
        } catch (Exception e) {
            System.err.println("❌ Failed to list sources: " + e.getMessage());
            System.exit(1);
        }
    }
}
