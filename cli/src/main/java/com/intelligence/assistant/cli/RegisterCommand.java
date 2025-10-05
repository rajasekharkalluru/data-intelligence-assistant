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

@Command(name = "register", description = "Register a new account")
public class RegisterCommand implements Runnable {
    
    @ParentCommand
    private AssistantCLI parent;
    
    @Option(names = {"-u", "--username"}, description = "Username")
    private String username;
    
    @Option(names = {"-e", "--email"}, description = "Email")
    private String email;
    
    @Option(names = {"-p", "--password"}, description = "Password", interactive = true)
    private String password;
    
    @Override
    public void run() {
        try {
            ApiClient client = new ApiClient(parent.getApiUrl());
            Scanner scanner = new Scanner(System.in);
            
            // Get username
            if (username == null || username.isEmpty()) {
                System.out.print("Username: ");
                username = scanner.nextLine();
            }
            
            // Get email
            if (email == null || email.isEmpty()) {
                System.out.print("Email: ");
                email = scanner.nextLine();
            }
            
            // Get password
            if (password == null || password.isEmpty()) {
                Console console = System.console();
                if (console != null) {
                    char[] passwordChars = console.readPassword("Password: ");
                    password = new String(passwordChars);
                } else {
                    System.out.print("Password: ");
                    password = scanner.nextLine();
                }
            }
            
            // Create registration request
            Map<String, String> registerData = new HashMap<>();
            registerData.put("username", username);
            registerData.put("email", email);
            registerData.put("password", password);
            
            ObjectMapper mapper = new ObjectMapper();
            String jsonBody = mapper.writeValueAsString(registerData);
            
            // Send registration request
            JsonNode response = client.post("/auth/register", jsonBody);
            
            // Save token
            String token = response.get("token").asText();
            client.saveToken(token);
            
            System.out.println("✅ Registration successful!");
            System.out.println("Welcome, " + username + "!");
            
        } catch (Exception e) {
            System.err.println("❌ Registration failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
