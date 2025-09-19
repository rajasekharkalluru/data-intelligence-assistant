from sqlalchemy.orm import Session
from fastapi import HTTPException
from typing import List
import time
from datetime import datetime

from ..models.user import DataSource, Team
from ..models.data_source import DataSourceCreate, DataSourceUpdate, SyncResponse
from ..services.encryption_service import EncryptionService
from ..services.team_service import TeamService
from ..services.sync_service import SyncService
from ..connectors.confluence_connector import ConfluenceConnector
from ..connectors.bitbucket_connector import BitbucketConnector
from ..connectors.jira_connector import JiraConnector

class DataSourceService:
    def __init__(self):
        self.encryption_service = EncryptionService()
        self.team_service = TeamService()
        self.sync_service = SyncService()
        self.connectors = {
            "confluence": ConfluenceConnector,
            "bitbucket": BitbucketConnector,
            "jira": JiraConnector
        }
    
    async def get_user_data_sources(self, db: Session, user_id: int) -> List[DataSource]:
        """Get personal data sources for a user"""
        return db.query(DataSource).filter(DataSource.user_id == user_id).all()
    
    async def get_all_accessible_data_sources(self, db: Session, user_id: int) -> List[DataSource]:
        """Get all data sources accessible to user (personal + team sources)"""
        return await self.team_service.get_user_accessible_data_sources(db, user_id)
    
    async def create_data_source(self, db: Session, user_id: int, data_source: DataSourceCreate) -> DataSource:
        """Create a new data source configuration"""
        # Validate source type
        if data_source.source_type not in self.connectors:
            raise HTTPException(status_code=400, detail=f"Unsupported source type: {data_source.source_type}")
        
        # Encrypt credentials
        encrypted_credentials = self.encryption_service.encrypt_credentials(data_source.credentials)
        
        # Create data source
        db_data_source = DataSource(
            user_id=user_id,
            source_type=data_source.source_type,
            display_name=data_source.display_name,
            is_active=data_source.is_active,
            encrypted_credentials=encrypted_credentials,
            config=data_source.config or {}
        )
        
        db.add(db_data_source)
        db.commit()
        db.refresh(db_data_source)
        
        return db_data_source
    
    async def create_team_data_source(self, db: Session, user_id: int, team_id: int, data_source: DataSourceCreate) -> DataSource:
        """Create a new team data source configuration"""
        # Check if user can manage team data sources
        user_role = await self.team_service._get_user_role_in_team(db, team_id, user_id)
        if user_role not in ["owner", "admin"]:
            raise HTTPException(status_code=403, detail="Only team owners and admins can manage data sources")
        
        # Validate source type
        if data_source.source_type not in self.connectors:
            raise HTTPException(status_code=400, detail=f"Unsupported source type: {data_source.source_type}")
        
        # Encrypt credentials
        encrypted_credentials = self.encryption_service.encrypt_credentials(data_source.credentials)
        
        # Create team data source
        db_data_source = DataSource(
            team_id=team_id,  # Team data source
            source_type=data_source.source_type,
            display_name=data_source.display_name,
            is_active=data_source.is_active,
            encrypted_credentials=encrypted_credentials,
            config=data_source.config or {}
        )
        
        db.add(db_data_source)
        db.commit()
        db.refresh(db_data_source)
        
        return db_data_source
    
    async def update_data_source(self, db: Session, user_id: int, source_id: int, data_source: DataSourceUpdate) -> DataSource:
        """Update a data source configuration"""
        db_data_source = await self._get_data_source_with_access_check(db, user_id, source_id)
        
        if not db_data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Update fields
        update_data = data_source.dict(exclude_unset=True)
        
        # Handle credentials update
        if "credentials" in update_data:
            if update_data["credentials"]:
                # Update existing credentials
                encrypted_credentials = self.encryption_service.update_credentials(
                    db_data_source.encrypted_credentials,
                    update_data["credentials"]
                )
                db_data_source.encrypted_credentials = encrypted_credentials
            del update_data["credentials"]
        
        # Update other fields
        for field, value in update_data.items():
            setattr(db_data_source, field, value)
        
        db.commit()
        db.refresh(db_data_source)
        
        return db_data_source
    
    async def delete_data_source(self, db: Session, user_id: int, source_id: int):
        """Delete a data source configuration"""
        db_data_source = await self._get_data_source_with_access_check(db, user_id, source_id)
        
        if not db_data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        db.delete(db_data_source)
        db.commit()
    
    async def get_data_source(self, db: Session, user_id: int, source_id: int) -> DataSource:
        """Get a specific data source"""
        return await self._get_data_source_with_access_check(db, user_id, source_id)
    
    async def test_connection(self, db: Session, user_id: int, source_id: int) -> bool:
        """Test connection to a data source"""
        db_data_source = await self.get_data_source(db, user_id, source_id)
        
        # Decrypt credentials
        credentials = self.encryption_service.decrypt_credentials(db_data_source.encrypted_credentials)
        
        # Create connector instance
        connector_class = self.connectors[db_data_source.source_type]
        connector = connector_class()
        
        # Set credentials
        connector.set_credentials(credentials)
        
        # Test connection
        return await connector.test_connection()
    
    async def sync_data_source(self, db: Session, user_id: int, source_id: int) -> SyncResponse:
        """Sync data from a data source using the new sync service"""
        db_data_source = await self.get_data_source(db, user_id, source_id)
        
        # Use the new sync service
        result = await self.sync_service.sync_data_source(db, db_data_source)
        
        return SyncResponse(
            status=result.status.value,
            message=f"Processed {result.documents_processed} documents",
            documents_processed=result.documents_processed,
            processing_time=result.processing_time
        )
    
    async def _store_documents(self, documents: List[dict], source_type: str, user_id: int):
        """Store documents in the vector database"""
        from .rag_service import RAGService
        rag_service = RAGService()
        
        texts = []
        metadatas = []
        ids = []
        
        for i, doc in enumerate(documents):
            texts.append(doc['content'])
            # Determine owner for metadata
            if db_data_source.user_id:
                owner_key = 'user_id'
                owner_value = db_data_source.user_id
                id_prefix = f"user_{db_data_source.user_id}"
            else:
                owner_key = 'team_id'
                owner_value = db_data_source.team_id
                id_prefix = f"team_{db_data_source.team_id}"
            
            metadatas.append({
                'title': doc['title'],
                'url': doc['url'],
                'source': source_type,
                owner_key: owner_value,
                'created_at': doc.get('created_at', ''),
                'updated_at': doc.get('updated_at', '')
            })
            ids.append(f"{id_prefix}_{source_type}_{i}_{hash(doc['url'])}")
        
        if texts:
            # Generate embeddings
            embeddings = rag_service.embedding_model.encode(texts).tolist()
            
            # Store in ChromaDB
            rag_service.collection.upsert(
                documents=texts,
                metadatas=metadatas,
                ids=ids,
                embeddings=embeddings
            )
    
    async def _get_data_source_with_access_check(self, db: Session, user_id: int, source_id: int) -> DataSource:
        """Get data source with access control check"""
        db_data_source = db.query(DataSource).filter(DataSource.id == source_id).first()
        
        if not db_data_source:
            raise HTTPException(status_code=404, detail="Data source not found")
        
        # Check access - user owns it or is team member
        if db_data_source.user_id == user_id:
            return db_data_source
        elif db_data_source.team_id:
            # Check if user is team member
            if await self.team_service._is_team_member(db, db_data_source.team_id, user_id):
                return db_data_source
        
        raise HTTPException(status_code=403, detail="Access denied")
    
    async def _can_manage_data_source(self, db: Session, user_id: int, source_id: int) -> bool:
        """Check if user can manage (edit/delete) a data source"""
        db_data_source = await self._get_data_source_with_access_check(db, user_id, source_id)
        
        # Personal data source - user can manage
        if db_data_source.user_id == user_id:
            return True
        
        # Team data source - only owner/admin can manage
        if db_data_source.team_id:
            user_role = await self.team_service._get_user_role_in_team(db, db_data_source.team_id, user_id)
            return user_role in ["owner", "admin"]
        
        return False