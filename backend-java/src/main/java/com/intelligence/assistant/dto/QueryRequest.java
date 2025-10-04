package com.intelligence.assistant.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.List;

@Data
public class QueryRequest {
    
    @NotBlank(message = "Query is required")
    private String query;
    
    private List<Long> sourceIds;
    
    private Long sessionId;
    
    private String responseType = "concise"; // brief, concise, expansive
    
    private Double temperature = 0.7;
    
    private String model = "llama3.2";
}
