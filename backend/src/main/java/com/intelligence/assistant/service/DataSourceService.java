package com.intelligence.assistant.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.intelligence.assistant.connector.BaseConnector;
import com.intelligence.assistant.connector.BitbucketConnector;
import com.intelligence.assistant.connector.ConfluenceConnector;
import com.intelligence.assistant.connector.JiraConnector;
import com.intelligence.assistant.model.DataSource;
import com.intelligence.assistant.model.User;
import com.intelligence.assistant.repository.DataSourceRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.jasypt.util.text.BasicTextEncryptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class DataSourceService {
    
    private final DataSourceRepository dataSourceRepository;
    private final ConfluenceConnector confluenceConnector;
    private final JiraConnector jiraConnector;
    private final BitbucketConnector bitbucketConnector;
    private final ObjectMapper objectMapper;
    
    @Value("${app.encryption.key}")
    private String encryptionKey;
    
    public List<DataSource> getUserDataSources(Long userId) {
        return dataSourceRepository.findByUserId(userId);
    }
    
    public List<DataSource> getActiveUserDataSources(Long userId) {
        return dataSourceRepository.findByUserIdAndIsActiveTrue(userId);
    }
    
    public DataSource getDataSource(Long id, Long userId) {
        DataSource dataSource = dataSourceRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Data source not found"));
        
        if (!dataSource.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Unauthorized access to data source");
        }
        
        return dataSource;
    }
    
    @Transactional
    public DataSource createDataSource(User user, String name, String displayName, 
                                      String sourceType, Map<String, String> credentials) {
        log.info("Creating data source: {} for user: {}", name, user.getId());
        
        // Encrypt credentials
        String encryptedCredentials = encryptCredentials(credentials);
        
        DataSource dataSource = DataSource.builder()
                .user(user)
                .name(name)
                .displayName(displayName)
                .sourceType(sourceType)
                .credentials(encryptedCredentials)
                .isActive(true)
                .syncStatus("idle")
                .build();
        
        return dataSourceRepository.save(dataSource);
    }
    
    @Transactional
    public DataSource updateDataSource(Long id, Long userId, String displayName, 
                                      Map<String, String> credentials) {
        DataSource dataSource = getDataSource(id, userId);
        
        if (displayName != null) {
            dataSource.setDisplayName(displayName);
        }
        
        if (credentials != null && !credentials.isEmpty()) {
            String encryptedCredentials = encryptCredentials(credentials);
            dataSource.setCredentials(encryptedCredentials);
        }
        
        return dataSourceRepository.save(dataSource);
    }
    
    @Transactional
    public void deleteDataSource(Long id, Long userId) {
        DataSource dataSource = getDataSource(id, userId);
        dataSourceRepository.delete(dataSource);
        log.info("Deleted data source: {}", id);
    }
    
    @Transactional
    public boolean testConnection(Long id, Long userId) {
        DataSource dataSource = getDataSource(id, userId);
        
        try {
            BaseConnector connector = getConnector(dataSource);
            Map<String, String> credentials = decryptCredentials(dataSource.getCredentials());
            connector.setCredentials(credentials);
            
            return connector.testConnection();
        } catch (Exception e) {
            log.error("Error testing connection for data source: {}", id, e);
            return false;
        }
    }
    
    @Transactional
    public Map<String, Object> syncDataSource(Long id, Long userId) {
        DataSource dataSource = getDataSource(id, userId);
        
        log.info("Starting sync for data source: {}", id);
        dataSource.setSyncStatus("syncing");
        dataSourceRepository.save(dataSource);
        
        try {
            BaseConnector connector = getConnector(dataSource);
            Map<String, String> credentials = decryptCredentials(dataSource.getCredentials());
            connector.setCredentials(credentials);
            
            // Fetch documents
            List<Map<String, Object>> documents;
            if (dataSource.getLastSync() != null) {
                // Incremental sync
                documents = connector.fetchDocumentsSince(
                        dataSource.getLastSync(),
                        dataSource.getSyncToken()
                );
            } else {
                // Full sync
                documents = connector.fetchDocuments();
            }
            
            // TODO: Process and index documents in vector store
            
            // Update sync status
            dataSource.setSyncStatus("completed");
            dataSource.setLastSync(LocalDateTime.now());
            dataSourceRepository.save(dataSource);
            
            log.info("Sync completed for data source: {}. Processed {} documents", id, documents.size());
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "completed");
            result.put("documents_processed", documents.size());
            result.put("last_sync", dataSource.getLastSync());
            
            return result;
            
        } catch (Exception e) {
            log.error("Error syncing data source: {}", id, e);
            
            dataSource.setSyncStatus("failed");
            dataSourceRepository.save(dataSource);
            
            Map<String, Object> result = new HashMap<>();
            result.put("status", "failed");
            result.put("error", e.getMessage());
            
            return result;
        }
    }
    
    private BaseConnector getConnector(DataSource dataSource) {
        return switch (dataSource.getSourceType().toLowerCase()) {
            case "confluence" -> confluenceConnector;
            case "jira" -> jiraConnector;
            case "bitbucket" -> bitbucketConnector;
            default -> throw new IllegalArgumentException("Unknown source type: " + dataSource.getSourceType());
        };
    }
    
    private String encryptCredentials(Map<String, String> credentials) {
        try {
            BasicTextEncryptor encryptor = new BasicTextEncryptor();
            encryptor.setPassword(encryptionKey);
            
            String json = objectMapper.writeValueAsString(credentials);
            return encryptor.encrypt(json);
        } catch (Exception e) {
            throw new RuntimeException("Error encrypting credentials", e);
        }
    }
    
    private Map<String, String> decryptCredentials(String encryptedCredentials) {
        try {
            BasicTextEncryptor encryptor = new BasicTextEncryptor();
            encryptor.setPassword(encryptionKey);
            
            String json = encryptor.decrypt(encryptedCredentials);
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            throw new RuntimeException("Error decrypting credentials", e);
        }
    }
}
