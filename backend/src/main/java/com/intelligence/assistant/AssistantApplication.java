package com.intelligence.assistant;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main application class for Data Intelligence Assistant
 * 
 * AI-powered knowledge base system that integrates with development tools
 * (Confluence, JIRA, Bitbucket) to provide intelligent answers using RAG.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class AssistantApplication {

    public static void main(String[] args) {
        SpringApplication.run(AssistantApplication.class, args);
    }
}
