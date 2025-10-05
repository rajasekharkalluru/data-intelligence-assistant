package com.intelligence.assistant.controller;

import com.intelligence.assistant.dto.DataSourceRequest;
import com.intelligence.assistant.model.DataSource;
import com.intelligence.assistant.model.User;
import com.intelligence.assistant.service.DataSourceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/data-sources")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin
public class DataSourceController {
    
    private final DataSourceService dataSourceService;
    
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> getDataSources(@AuthenticationPrincipal User user) {
        log.info("Get data sources for user: {}", user.getId());
        
        List<DataSource> dataSources = dataSourceService.getUserDataSources(user.getId());
        
        List<Map<String, Object>> response = dataSources.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping
    public ResponseEntity<Map<String, Object>> createDataSource(
            @Valid @RequestBody DataSourceRequest request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Create data source: {} for user: {}", request.getName(), user.getId());
        
        DataSource dataSource = dataSourceService.createDataSource(
                user,
                request.getName(),
                request.getDisplayName(),
                request.getSourceType(),
                request.getCredentials()
        );
        
        return ResponseEntity.ok(mapToResponse(dataSource));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getDataSource(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        log.info("Get data source: {}", id);
        
        DataSource dataSource = dataSourceService.getDataSource(id, user.getId());
        return ResponseEntity.ok(mapToResponse(dataSource));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Map<String, Object>> updateDataSource(
            @PathVariable Long id,
            @RequestBody Map<String, Object> request,
            @AuthenticationPrincipal User user
    ) {
        log.info("Update data source: {}", id);
        
        String displayName = (String) request.get("displayName");
        Map<String, String> credentials = (Map<String, String>) request.get("credentials");
        
        DataSource dataSource = dataSourceService.updateDataSource(id, user.getId(), displayName, credentials);
        return ResponseEntity.ok(mapToResponse(dataSource));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteDataSource(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        log.info("Delete data source: {}", id);
        
        dataSourceService.deleteDataSource(id, user.getId());
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Data source deleted successfully");
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/test")
    public ResponseEntity<Map<String, Object>> testConnection(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        log.info("Test connection for data source: {}", id);
        
        boolean connected = dataSourceService.testConnection(id, user.getId());
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", connected ? "success" : "failed");
        response.put("connected", connected);
        
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, Object>> syncDataSource(
            @PathVariable Long id,
            @AuthenticationPrincipal User user
    ) {
        log.info("Sync data source: {}", id);
        
        Map<String, Object> result = dataSourceService.syncDataSource(id, user.getId());
        return ResponseEntity.ok(result);
    }
    
    private Map<String, Object> mapToResponse(DataSource dataSource) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", dataSource.getId());
        response.put("name", dataSource.getName());
        response.put("display_name", dataSource.getDisplayName());
        response.put("source_type", dataSource.getSourceType());
        response.put("is_active", dataSource.getIsActive());
        response.put("sync_status", dataSource.getSyncStatus());
        response.put("last_sync", dataSource.getLastSync());
        response.put("created_at", dataSource.getCreatedAt());
        response.put("updated_at", dataSource.getUpdatedAt());
        // Don't include credentials in response
        return response;
    }
}
