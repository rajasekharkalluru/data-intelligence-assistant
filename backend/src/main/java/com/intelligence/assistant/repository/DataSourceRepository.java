package com.intelligence.assistant.repository;

import com.intelligence.assistant.model.DataSource;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DataSourceRepository extends JpaRepository<DataSource, Long> {
    
    List<DataSource> findByUserId(Long userId);
    
    List<DataSource> findByTeamId(Long teamId);
    
    List<DataSource> findByUserIdAndIsActiveTrue(Long userId);
    
    List<DataSource> findByTeamIdAndIsActiveTrue(Long teamId);
}
