package com.intelligence.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class DataSourceRequest {
    
    @NotBlank(message = "Name is required")
    private String name;
    
    @NotBlank(message = "Display name is required")
    private String displayName;
    
    @NotBlank(message = "Source type is required")
    private String sourceType; // confluence, jira, bitbucket
    
    private Map<String, String> credentials;
}
