package com.intelligence.assistant.cli;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.Getter;
import okhttp3.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

public class ApiClient {
    private static final String CONFIG_DIR = System.getProperty("user.home") + "/.dia";
    private static final String TOKEN_FILE = CONFIG_DIR + "/token";
    
    private final OkHttpClient client;
    private final ObjectMapper mapper;
    @Getter
    private final String baseUrl;
    private String token;
    
    public ApiClient(String baseUrl) {
        this.baseUrl = baseUrl;
        this.client = new OkHttpClient.Builder()
                .connectTimeout(30, TimeUnit.SECONDS)
                .readTimeout(30, TimeUnit.SECONDS)
                .build();
        this.mapper = new ObjectMapper();
        loadToken();
    }
    
    private void loadToken() {
        try {
            Path tokenPath = Paths.get(TOKEN_FILE);
            if (Files.exists(tokenPath)) {
                token = Files.readString(tokenPath).trim();
            }
        } catch (IOException e) {
            // Token file doesn't exist or can't be read
        }
    }
    
    public void saveToken(String token) throws IOException {
        this.token = token;
        Path configDir = Paths.get(CONFIG_DIR);
        if (!Files.exists(configDir)) {
            Files.createDirectories(configDir);
        }
        Files.writeString(Paths.get(TOKEN_FILE), token);
    }
    
    public void clearToken() throws IOException {
        this.token = null;
        Path tokenPath = Paths.get(TOKEN_FILE);
        if (Files.exists(tokenPath)) {
            Files.delete(tokenPath);
        }
    }
    
    public boolean isAuthenticated() {
        return token != null && !token.isEmpty();
    }
    
    public JsonNode post(String endpoint, String jsonBody) throws IOException {
        RequestBody body = RequestBody.create(
            jsonBody,
            MediaType.parse("application/json")
        );
        
        Request.Builder requestBuilder = new Request.Builder()
                .url(baseUrl + endpoint)
                .post(body);
        
        if (token != null) {
            requestBuilder.addHeader("Authorization", "Bearer " + token);
        }
        
        try (Response response = client.newCall(requestBuilder.build()).execute()) {
            String responseBody = response.body().string();
            if (!response.isSuccessful()) {
                throw new IOException("Request failed: " + response.code() + " - " + responseBody);
            }
            return mapper.readTree(responseBody);
        }
    }
    
    public JsonNode get(String endpoint) throws IOException {
        Request.Builder requestBuilder = new Request.Builder()
                .url(baseUrl + endpoint)
                .get();
        
        if (token != null) {
            requestBuilder.addHeader("Authorization", "Bearer " + token);
        }
        
        try (Response response = client.newCall(requestBuilder.build()).execute()) {
            String responseBody = response.body().string();
            if (!response.isSuccessful()) {
                throw new IOException("Request failed: " + response.code() + " - " + responseBody);
            }
            return mapper.readTree(responseBody);
        }
    }
    
    public JsonNode delete(String endpoint) throws IOException {
        Request.Builder requestBuilder = new Request.Builder()
                .url(baseUrl + endpoint)
                .delete();
        
        if (token != null) {
            requestBuilder.addHeader("Authorization", "Bearer " + token);
        }
        
        try (Response response = client.newCall(requestBuilder.build()).execute()) {
            String responseBody = response.body().string();
            if (!response.isSuccessful()) {
                throw new IOException("Request failed: " + response.code() + " - " + responseBody);
            }
            return responseBody.isEmpty() ? mapper.createObjectNode() : mapper.readTree(responseBody);
        }
    }
}
