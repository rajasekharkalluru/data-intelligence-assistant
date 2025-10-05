package com.intelligence.assistant.slackbot;

import com.slack.api.bolt.App;
import com.slack.api.bolt.socket_mode.SocketModeApp;
import com.slack.api.model.event.MessageEvent;
import lombok.extern.slf4j.Slf4j;

@Slf4j
public class SlackBotApp {
    
    public static void main(String[] args) throws Exception {
        // Get configuration from environment
        String botToken = System.getenv("SLACK_BOT_TOKEN");
        String appToken = System.getenv("SLACK_APP_TOKEN");
        String apiUrl = System.getenv("BACKEND_API_URL");
        
        if (apiUrl == null || apiUrl.isEmpty()) {
            apiUrl = "http://localhost:8000";
        }
        
        if (botToken == null || appToken == null) {
            log.error("❌ Missing required environment variables:");
            log.error("   SLACK_BOT_TOKEN - Your Slack bot token (xoxb-...)");
            log.error("   SLACK_APP_TOKEN - Your Slack app token (xapp-...)");
            log.error("\nOptional:");
            log.error("   BACKEND_API_URL - Backend URL (default: http://localhost:8000)");
            System.exit(1);
        }
        
        // Create Slack app
        App app = new App();
        AssistantClient assistantClient = new AssistantClient(apiUrl);
        
        // Handle app mentions
        app.event(MessageEvent.class, (payload, ctx) -> {
            MessageEvent event = payload.getEvent();
            String text = event.getText();
            String userId = event.getUser();
            String channel = event.getChannel();
            
            // Skip bot messages
            if (event.getBotId() != null) {
                return ctx.ack();
            }
            
            // Check if bot is mentioned
            String botUserId = ctx.getBotUserId();
            if (text.contains("<@" + botUserId + ">")) {
                // Remove bot mention from text
                String question = text.replaceAll("<@" + botUserId + ">", "").trim();
                
                if (question.isEmpty()) {
                    ctx.say("👋 Hi! Ask me anything about your knowledge base!");
                    return ctx.ack();
                }
                
                try {
                    // Send "thinking" message
                    ctx.say("🤔 Let me think about that...");
                    
                    // Query the assistant
                    String answer = assistantClient.query(question, userId);
                    
                    // Send response
                    ctx.say("💡 " + answer);
                    
                } catch (Exception e) {
                    log.error("Error querying assistant", e);
                    ctx.say("❌ Sorry, I encountered an error: " + e.getMessage());
                }
            }
            
            return ctx.ack();
        });
        
        // Handle direct messages
        app.message("", (payload, ctx) -> {
            MessageEvent event = payload.getEvent();
            String text = event.getText();
            String userId = event.getUser();
            String channelType = event.getChannelType();
            
            // Skip bot messages
            if (event.getBotId() != null) {
                return ctx.ack();
            }
            
            // Only respond to direct messages
            if ("im".equals(channelType)) {
                if (text.trim().isEmpty()) {
                    return ctx.ack();
                }
                
                try {
                    // Send "thinking" message
                    ctx.say("🤔 Let me think about that...");
                    
                    // Query the assistant
                    String answer = assistantClient.query(text, userId);
                    
                    // Send response
                    ctx.say("💡 " + answer);
                    
                } catch (Exception e) {
                    log.error("Error querying assistant", e);
                    ctx.say("❌ Sorry, I encountered an error: " + e.getMessage());
                }
            }
            
            return ctx.ack();
        });
        
        // Start the bot
        log.info("🤖 Starting Slack bot...");
        log.info("📡 Backend API: {}", apiUrl);
        
        SocketModeApp socketModeApp = new SocketModeApp(appToken, app);
        socketModeApp.start();
        
        log.info("✅ Slack bot is running!");
        log.info("💬 Mention the bot or send a direct message to interact");
    }
}
