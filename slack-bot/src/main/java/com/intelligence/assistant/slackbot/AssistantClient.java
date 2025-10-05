package com.intelligence.assistant.slackbot;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import okhttp3.*;

import java.io.IOException;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

@Slf4j
public class AssistantClient {
    private final OkHttpClient client;
    private final ObjectMapper mapper;
    private final String baseUrl;
    private final Map<String, String> userTokens;
    
    public AssistantClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(60, TimeUnit.SECONDS)
                .build();
        this.mapper = new ObjectMapper();
        this.userTokens = new ConcurrentHashMap<>();
    }
    
    public String query(String question, String userId) throws IOException {
        // Get or create user token
        String token = getUserToken(userId);
        
        // Create query request
        Map<String, String> queryData = new HashMap<>();
        queryData.put("query", question);
        queryData.put("responseType", "concise");
        
        String jsonBody = mapper.writeValueAsString(queryData);
        
        RequestBody body = RequestBody.create(
            jsonBody,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(baseUrl + "/chat/query")
                .post(body)
                .addHeader("Authorization", "Bearer " + token)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (!response.isSuccessful()) {
                log.error("Query failed: {} - {}", response.code(), responseBody);
                throw new IOException("Query failed: " + response.code());
            }
            
            JsonNode jsonResponse = mapper.readTree(responseBody);
            return jsonResponse.get("response").asText();
        }
    }
    
    private String getUserToken(String userId) throws IOException {
        // Check if we already have a token for this user
        if (userTokens.containsKey(userId)) {
            return userTokens.get(userId);
        }
        
        // Create a bot user account for this Slack user
        String username = "slack_" + userId;
        String password = "slack_bot_" + userId + "_" + System.currentTimeMillis();
        
        // Try to register
        try {
            String token = register(username, password);
            userTokens.put(userId, token);
            return token;
        } catch (IOException e) {
            // If registration fails, try to login (user might already exist)
            log.info("Registration failed, trying login for user: {}", username);
            String token = login(username, password);
            userTokens.put(userId, token);
            return token;
        }
    }
    
    private String register(String username, String password) throws IOException {
        Map<String, String> registerData = new HashMap<>();
        registerData.put("username", username);
        registerData.put("email", username + "@slackbot.local");
        registerData.put("password", password);
        
        String jsonBody = mapper.writeValueAsString(registerData);
        
        RequestBody body = RequestBody.create(
            jsonBody,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(baseUrl + "/auth/register")
                .post(body)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (!response.isSuccessful()) {
                throw new IOException("Registration failed: " + response.code());
            }
            
            JsonNode jsonResponse = mapper.readTree(responseBody);
            return jsonResponse.get("token").asText();
        }
    }
    
    private String login(String username, String password) throws IOException {
        Map<String, String> loginData = new HashMap<>();
        loginData.put("username", username);
        loginData.put("password", password);
        
        String jsonBody = mapper.writeValueAsString(loginData);
        
        RequestBody body = RequestBody.create(
            jsonBody,
            MediaType.parse("application/json")
        );
        
        Request request = new Request.Builder()
                .url(baseUrl + "/auth/login")
                .post(body)
                .build();
        
        try (Response response = client.newCall(request).execute()) {
            String responseBody = response.body().string();
            
            if (!response.isSuccessful()) {
                throw new IOException("Login failed: " + response.code());
            }
            
            JsonNode jsonResponse = mapper.readTree(responseBody);
            return jsonResponse.get("token").asText();
        }
    }
}
