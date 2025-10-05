package com.intelligence.assistant.cli;

import picocli.CommandLine.Command;
import picocli.CommandLine.ParentCommand;

@Command(name = "logout", description = "Logout from the assistant")
public class LogoutCommand implements Runnable {
    
    @ParentCommand
    private AssistantCLI parent;
    
    @Override
    public void run() {
        try {
            ApiClient client = new ApiClient(parent.getApiUrl());
            client.clearToken();
            System.out.println("✅ Logged out successfully!");
        } catch (Exception e) {
            System.err.println("❌ Logout failed: " + e.getMessage());
            System.exit(1);
        }
    }
}
