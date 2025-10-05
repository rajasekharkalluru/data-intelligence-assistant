package com.intelligence.assistant.cli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;
import picocli.CommandLine.ParentCommand;

import java.io.Console;
import java.util.HashMap;
import java.util.Map;
import java.util.Scanner;

@Command(name = "login", description = "Login to the assistant")
public class LoginCommand implements Runnable {
    
    @ParentCommand
    private AssistantCLI parent;
    
    @Option(names = {"-u", "--username"}, description = "Username")
    private String username;
    
    @Option(names = {"-p", "--password"}, description = "Password", interactive = true)
    private String password;
    
    @Override
    public void run() {
        try {
            ApiClient client = new ApiClient(parent.getApiUrl());
            
            // Get username if not provided
            if (username == null || username.isEmpty()) {
                Scanner scanner = new Scanner(System.in);
                System.out.print("Username: ");
                username = scanner.nextLine();
            }
            
            // Get password if not provided
            if (password == null || password.isEmpty()) {
                Console console = System.console();
                if (console != null) {
                    char[] passwordChars = console.readPassword("Password: ");
                    password = new String(passwordChars);
                } else {
                    Scanner scanner = new Scanner(System.in);
                    System.out.print("Password: ");
                    password = scanner.nextLine();
                }
            }
            
            // Create login request
            Map<String, String> loginData = new HashMap<>();
            loginData.put("username", username);
            loginData.put("password", password);
            
            ObjectMapper mapper = new ObjectMapper();
            String jsonBody = mapper.writeValueAsString(loginData);
            
            // Send login request
            JsonNode response = client.post("/auth/login", jsonBody);
            
            // Save token
            String token = response.get("token").asText();
            client.saveToken(token);
            
            System.out.println("✅ Login successful!");
            System.out.println("Welcome, " + username + "!");
            
        } catch (Exception e) {
            System.err.println("❌ Login failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
