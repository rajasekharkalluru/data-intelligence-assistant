package com.intelligence.assistant.cli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.jline.reader.LineReader;
import org.jline.reader.LineReaderBuilder;
import org.jline.terminal.Terminal;
import org.jline.terminal.TerminalBuilder;
import picocli.CommandLine.Command;
import picocli.CommandLine.ParentCommand;

import java.util.HashMap;
import java.util.Map;

@Command(name = "interactive", description = "Start interactive chat mode")
public class InteractiveCommand implements Runnable {
    
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
            
            Terminal terminal = TerminalBuilder.builder().build();
            LineReader reader = LineReaderBuilder.builder()
                    .terminal(terminal)
                    .build();
            
            System.out.println("🤖 Interactive Chat Mode");
            System.out.println("Type 'exit' or 'quit' to leave, 'help' for commands\n");
            
            ObjectMapper mapper = new ObjectMapper();
            
            while (true) {
                String question = reader.readLine("You: ");
                
                if (question == null || question.trim().isEmpty()) {
                    continue;
                }
                
                String trimmed = question.trim().toLowerCase();
                
                if (trimmed.equals("exit") || trimmed.equals("quit")) {
                    System.out.println("👋 Goodbye!");
                    break;
                }
                
                if (trimmed.equals("help")) {
                    printHelp();
                    continue;
                }
                
                if (trimmed.equals("sources")) {
                    listSources(client);
                    continue;
                }
                
                // Send query
                try {
                    Map<String, String> queryData = new HashMap<>();
                    queryData.put("query", question);
                    queryData.put("responseType", "concise");
                    
                    String jsonBody = mapper.writeValueAsString(queryData);
                    
                    System.out.println("🤔 Thinking...");
                    
                    JsonNode response = client.post("/chat/query", jsonBody);
                    String answer = response.get("response").asText();
                    
                    System.out.println("\n💡 Assistant: " + answer + "\n");
                    
                } catch (Exception e) {
                    System.err.println("❌ Error: " + e.getMessage() + "\n");
                }
            }
            
        } catch (Exception e) {
            System.err.println("❌ Interactive mode failed: " + e.getMessage());
            System.exit(1);
        }
    }
    
    private void printHelp() {
        System.out.println("\n📖 Available commands:");
        System.out.println("  help     - Show this help message");
        System.out.println("  sources  - List data sources");
        System.out.println("  exit     - Exit interactive mode");
        System.out.println("  quit     - Exit interactive mode");
        System.out.println("\nJust type your question to ask the assistant!\n");
    }
    
    private void listSources(ApiClient client) {
        try {
            JsonNode response = client.get("/data-sources");
            
            if (!response.isArray() || response.size() == 0) {
                System.out.println("\n📊 No data sources found.\n");
                return;
            }
            
            System.out.println("\n📊 Data Sources:");
            for (JsonNode source : response) {
                String name = source.has("displayName") ? 
                    source.get("displayName").asText() : 
                    source.get("name").asText();
                String type = source.get("sourceType").asText();
                System.out.printf("  - %s (%s)\n", name, type);
            }
            System.out.println();
            
        } catch (Exception e) {
            System.err.println("❌ Failed to list sources: " + e.getMessage() + "\n");
        }
    }
}
