package com.intelligence.assistant.cli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import picocli.CommandLine.Command;
import picocli.CommandLine.Parameters;
import picocli.CommandLine.ParentCommand;
import picocli.CommandLine.Option;

import java.util.HashMap;
import java.util.Map;

@Command(name = "ask", description = "Ask a question")
public class AskCommand implements Runnable {
    
    @ParentCommand
    private AssistantCLI parent;
    
    @Parameters(index = "0", description = "The question to ask")
    private String question;
    
    @Option(names = {"-t", "--type"}, description = "Response type: brief, concise, expansive (default: concise)")
    private String responseType = "concise";
    
    @Override
    public void run() {
        try {
            ApiClient client = new ApiClient(parent.getApiUrl());
            
            if (!client.isAuthenticated()) {
                System.err.println("❌ Not authenticated. Please login first: dia login");
                System.exit(1);
            }
            
            // Create query request
            Map<String, String> queryData = new HashMap<>();
            queryData.put("query", question);
            queryData.put("responseType", responseType);
            
            ObjectMapper mapper = new ObjectMapper();
            String jsonBody = mapper.writeValueAsString(queryData);
            
            System.out.println("🤔 Thinking...\n");
            
            // Send query request
            JsonNode response = client.post("/chat/query", jsonBody);
            
            // Display response
            String answer = response.get("response").asText();
            System.out.println("💡 Answer:");
            System.out.println(answer);
            
            // Display sources if available
            if (response.has("sources") && response.get("sources").isArray()) {
                JsonNode sources = response.get("sources");
                if (sources.size() > 0) {
                    System.out.println("\n📚 Sources:");
                    for (JsonNode source : sources) {
                        System.out.println("  - " + source.asText());
                    }
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ Query failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
