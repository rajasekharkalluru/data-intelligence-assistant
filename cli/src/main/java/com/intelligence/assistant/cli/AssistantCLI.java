package com.intelligence.assistant.cli;

import picocli.CommandLine;
import picocli.CommandLine.Command;
import picocli.CommandLine.Option;

@Command(
    name = "dia",
    mixinStandardHelpOptions = true,
    version = "1.0.0",
    description = "Developer Intelligence Assistant CLI",
    subcommands = {
        LoginCommand.class,
        RegisterCommand.class,
        AskCommand.class,
        SourcesCommand.class,
        SyncCommand.class,
        InteractiveCommand.class,
        LogoutCommand.class
    }
)
public class AssistantCLI implements Runnable {
    
    @Option(names = {"-u", "--url"}, description = "Backend API URL (default: http://localhost:8000)")
    private String apiUrl = "http://localhost:8000";
    
    public static void main(String[] args) {
        int exitCode = new CommandLine(new AssistantCLI()).execute(args);
        System.exit(exitCode);
    }
    
    @Override
    public void run() {
        System.out.println("Developer Intelligence Assistant CLI");
        System.out.println("Use 'dia --help' for available commands");
    }
    
    public String getApiUrl() {
        return apiUrl;
    }
}
