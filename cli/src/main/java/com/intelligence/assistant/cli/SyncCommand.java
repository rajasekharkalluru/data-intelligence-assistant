package com.intelligence.assistant.cli;

import com.fasterxml.jackson.databind.JsonNode;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;
import picocli.CommandLine.ParentCommand;

@Command(name = "sync", description = "Sync a data source")
public class SyncCommand implements Runnable {
    
    @ParentCommand
    private AssistantCLI parent;
    
    @Parameters(index = "0", description = "Data source ID")
    private long sourceId;
    
    @Override
    public void run() {
        try {
            ApiClient client = new ApiClient(parent.getApiUrl());
            
            if (!client.isAuthenticated()) {
                System.err.println("❌ Not authenticated. Please login first: dia login");
                System.exit(1);
            }
            
            System.out.println("🔄 Starting sync for data source " + sourceId + "...");
            
            // Trigger sync
            JsonNode response = client.post("/data-sources/" + sourceId + "/sync", "{}");
            
            String status = response.get("status").asText();
            String message = response.has("message") ? response.get("message").asText() : "";
            
            if ("success".equalsIgnoreCase(status)) {
                System.out.println("✅ Sync completed successfully!");
                if (!message.isEmpty()) {
                    System.out.println(message);
                }
            } else {
                System.out.println("⚠️  Sync status: " + status);
                if (!message.isEmpty()) {
                    System.out.println(message);
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ Sync failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
