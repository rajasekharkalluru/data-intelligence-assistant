import hashlib
import time
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from ..models.user import DataSource
from ..models.document import Document, SyncLog
from ..models.sync import SyncStrategy, SyncStatus, SyncResult, DocumentChange
from ..services.encryption_service import EncryptionService
from ..services.chunking_service import ChunkingService
from ..connectors.confluence_connector import ConfluenceConnector
from ..connectors.bitbucket_connector import BitbucketConnector
from ..connectors.jira_connector import JiraConnector

class SyncService:
    def __init__(self):
        self.encryption_service = EncryptionService()
        self.chunking_service = ChunkingService()
        self.connectors = {
            "confluence": ConfluenceConnector,
            "bitbucket": BitbucketConnector,
            "jira": JiraConnector
        }
    
    async def sync_data_source(self, db: Session, data_source: DataSource, strategy: SyncStrategy = None) -> SyncResult:
        """Main sync method that chooses the appropriate strategy"""
        start_time = time.time()
        
        # Determine sync strategy
        if strategy is None:
            strategy = self._determine_sync_strategy(data_source)
        
        # Create sync log entry
        sync_log = SyncLog(
            data_source_id=data_source.id,
            sync_strategy=strategy.value,
            sync_status=SyncStatus.RUNNING.value
        )
        db.add(sync_log)
        db.commit()
        
        try:
            # Update data source status
            data_source.sync_status = SyncStatus.RUNNING.value
            data_source.sync_message = f"Running {strategy.value} sync..."
            db.commit()
            
            # Execute sync based on strategy
            if strategy == SyncStrategy.FULL:
                result = await self._full_sync(db, data_source)
            elif strategy == SyncStrategy.INCREMENTAL:
                result = await self._incremental_sync(db, data_source)
            else:  # EVENT_DRIVEN
                result = await self._event_driven_sync(db, data_source)
            
            # Update sync log
            sync_log.sync_status = result.status.value
            sync_log.documents_processed = result.documents_processed
            sync_log.documents_added = result.documents_added
            sync_log.documents_updated = result.documents_updated
            sync_log.documents_deleted = result.documents_deleted
            sync_log.completed_at = datetime.utcnow()
            sync_log.processing_time = str(result.processing_time)
            sync_log.sync_token = result.last_sync_token
            sync_log.next_sync_at = result.next_sync_at
            
            # Update data source
            data_source.sync_status = result.status.value
            data_source.sync_message = f"Processed {result.documents_processed} documents"
            data_source.last_sync = datetime.utcnow()
            data_source.last_sync_token = result.last_sync_token
            data_source.next_sync_at = result.next_sync_at
            data_source.document_count = self._get_active_document_count(db, data_source.id)
            
            db.commit()
            
            return result
            
        except Exception as e:
            # Handle errors
            error_msg = str(e)
            sync_log.sync_status = SyncStatus.ERROR.value
            sync_log.error_message = error_msg
            sync_log.completed_at = datetime.utcnow()
            
            data_source.sync_status = SyncStatus.ERROR.value
            data_source.sync_message = f"Sync failed: {error_msg}"
            
            db.commit()
            
            return SyncResult(
                strategy=strategy,
                status=SyncStatus.ERROR,
                documents_processed=0,
                documents_added=0,
                documents_updated=0,
                documents_deleted=0,
                processing_time=time.time() - start_time,
                error_message=error_msg
            )
    
    async def _full_sync(self, db: Session, data_source: DataSource) -> SyncResult:
        """Full sync - fetch all documents and compare with existing"""
        start_time = time.time()
        
        # Get connector and credentials
        connector = await self._get_connector(data_source)
        
        # Fetch all documents from external source
        external_docs = await connector.fetch_documents()
        
        # Get existing documents
        existing_docs = db.query(Document).filter(
            Document.data_source_id == data_source.id,
            Document.is_deleted == False
        ).all()
        
        existing_by_external_id = {doc.external_id: doc for doc in existing_docs}
        external_ids_seen = set()
        
        added, updated, deleted = 0, 0, 0
        changes = []
        
        # Process external documents
        for ext_doc in external_docs:
            external_id = self._generate_external_id(ext_doc)
            external_ids_seen.add(external_id)
            content_hash = self._generate_content_hash(ext_doc['content'])
            
            existing_doc = existing_by_external_id.get(external_id)
            
            if existing_doc is None:
                # New document
                doc = Document(
                    data_source_id=data_source.id,
                    external_id=external_id,
                    title=ext_doc['title'],
                    content=ext_doc['content'],
                    url=ext_doc['url'],
                    content_hash=content_hash,
                    last_modified_external=ext_doc.get('updated_at'),
                    doc_metadata=ext_doc.get('metadata', {})
                )
                db.add(doc)
                added += 1
                
                changes.append(DocumentChange(
                    document_id=external_id,
                    action="created",
                    title=ext_doc['title'],
                    url=ext_doc['url'],
                    content=ext_doc['content']
                ))
                
            elif existing_doc.content_hash != content_hash:
                # Updated document
                existing_doc.title = ext_doc['title']
                existing_doc.content = ext_doc['content']
                existing_doc.url = ext_doc['url']
                existing_doc.content_hash = content_hash
                existing_doc.last_modified_external = ext_doc.get('updated_at')
                existing_doc.doc_metadata = ext_doc.get('metadata', {})
                existing_doc.synced_at = datetime.utcnow()
                updated += 1
                
                changes.append(DocumentChange(
                    document_id=external_id,
                    action="updated",
                    title=ext_doc['title'],
                    url=ext_doc['url'],
                    content=ext_doc['content']
                ))
        
        # Mark deleted documents
        for external_id, doc in existing_by_external_id.items():
            if external_id not in external_ids_seen:
                doc.is_deleted = True
                doc.deleted_at = datetime.utcnow()
                deleted += 1
                
                changes.append(DocumentChange(
                    document_id=external_id,
                    action="deleted",
                    title=doc.title,
                    url=doc.url
                ))
        
        db.commit()
        
        # Update vector database
        await self._update_vector_database(db, data_source, changes)
        
        return SyncResult(
            strategy=SyncStrategy.FULL,
            status=SyncStatus.SUCCESS,
            documents_processed=len(external_docs),
            documents_added=added,
            documents_updated=updated,
            documents_deleted=deleted,
            processing_time=time.time() - start_time,
            changes=changes,
            next_sync_at=datetime.utcnow() + timedelta(hours=24)  # Schedule next full sync
        )
    
    async def _incremental_sync(self, db: Session, data_source: DataSource) -> SyncResult:
        """Incremental sync - only fetch documents modified since last sync"""
        start_time = time.time()
        
        # Get connector and credentials
        connector = await self._get_connector(data_source)
        
        # Check if connector supports incremental sync
        if not hasattr(connector, 'fetch_documents_since'):
            # Fall back to full sync
            return await self._full_sync(db, data_source)
        
        # Get last sync time and token
        since_date = data_source.last_sync
        sync_token = data_source.last_sync_token
        
        # Fetch incremental changes
        external_docs, next_token = await connector.fetch_documents_since(since_date, sync_token)
        
        added, updated, deleted = 0, 0, 0
        changes = []
        
        # Process changes
        for ext_doc in external_docs:
            external_id = self._generate_external_id(ext_doc)
            
            # Check if document was deleted
            if ext_doc.get('deleted', False):
                existing_doc = db.query(Document).filter(
                    Document.data_source_id == data_source.id,
                    Document.external_id == external_id
                ).first()
                
                if existing_doc and not existing_doc.is_deleted:
                    existing_doc.is_deleted = True
                    existing_doc.deleted_at = datetime.utcnow()
                    deleted += 1
                    
                    changes.append(DocumentChange(
                        document_id=external_id,
                        action="deleted",
                        title=existing_doc.title,
                        url=existing_doc.url
                    ))
                continue
            
            content_hash = self._generate_content_hash(ext_doc['content'])
            
            existing_doc = db.query(Document).filter(
                Document.data_source_id == data_source.id,
                Document.external_id == external_id
            ).first()
            
            if existing_doc is None:
                # New document
                doc = Document(
                    data_source_id=data_source.id,
                    external_id=external_id,
                    title=ext_doc['title'],
                    content=ext_doc['content'],
                    url=ext_doc['url'],
                    content_hash=content_hash,
                    last_modified_external=ext_doc.get('updated_at'),
                    doc_metadata=ext_doc.get('metadata', {})
                )
                db.add(doc)
                added += 1
                
                changes.append(DocumentChange(
                    document_id=external_id,
                    action="created",
                    title=ext_doc['title'],
                    url=ext_doc['url'],
                    content=ext_doc['content']
                ))
                
            elif existing_doc.content_hash != content_hash:
                # Updated document
                existing_doc.title = ext_doc['title']
                existing_doc.content = ext_doc['content']
                existing_doc.url = ext_doc['url']
                existing_doc.content_hash = content_hash
                existing_doc.last_modified_external = ext_doc.get('updated_at')
                existing_doc.doc_metadata = ext_doc.get('metadata', {})
                existing_doc.synced_at = datetime.utcnow()
                existing_doc.is_deleted = False  # Restore if was deleted
                updated += 1
                
                changes.append(DocumentChange(
                    document_id=external_id,
                    action="updated",
                    title=ext_doc['title'],
                    url=ext_doc['url'],
                    content=ext_doc['content']
                ))
        
        db.commit()
        
        # Update vector database
        await self._update_vector_database(db, data_source, changes)
        
        return SyncResult(
            strategy=SyncStrategy.INCREMENTAL,
            status=SyncStatus.SUCCESS,
            documents_processed=len(external_docs),
            documents_added=added,
            documents_updated=updated,
            documents_deleted=deleted,
            processing_time=time.time() - start_time,
            last_sync_token=next_token,
            changes=changes,
            next_sync_at=datetime.utcnow() + timedelta(hours=1)  # More frequent incremental syncs
        )
    
    async def _event_driven_sync(self, db: Session, data_source: DataSource) -> SyncResult:
        """Event-driven sync - process webhook events"""
        # This would be called by webhook handlers
        # For now, return a placeholder
        return SyncResult(
            strategy=SyncStrategy.EVENT_DRIVEN,
            status=SyncStatus.SUCCESS,
            documents_processed=0,
            documents_added=0,
            documents_updated=0,
            documents_deleted=0,
            processing_time=0.0
        )
    
    def _determine_sync_strategy(self, data_source: DataSource) -> SyncStrategy:
        """Determine the best sync strategy for a data source"""
        # Check if we have a sync token (supports incremental)
        if data_source.last_sync_token and data_source.last_sync:
            return SyncStrategy.INCREMENTAL
        
        # Check if it's the first sync or been too long
        if not data_source.last_sync or \
           (datetime.utcnow() - data_source.last_sync).days > 7:
            return SyncStrategy.FULL
        
        # Default to incremental if we have a last sync time
        return SyncStrategy.INCREMENTAL
    
    async def _get_connector(self, data_source: DataSource):
        """Get and configure connector for data source"""
        connector_class = self.connectors[data_source.source_type]
        connector = connector_class()
        
        # Decrypt and set credentials
        credentials = self.encryption_service.decrypt_credentials(data_source.encrypted_credentials)
        connector.set_credentials(credentials)
        
        return connector
    
    def _generate_external_id(self, doc: Dict[str, Any]) -> str:
        """Generate a unique external ID for a document"""
        # Use URL as the primary identifier, fallback to title + content hash
        if 'url' in doc:
            return hashlib.md5(doc['url'].encode()).hexdigest()
        else:
            content = f"{doc.get('title', '')}{doc.get('content', '')}"
            return hashlib.md5(content.encode()).hexdigest()
    
    def _generate_content_hash(self, content: str) -> str:
        """Generate hash for content change detection"""
        return hashlib.sha256(content.encode()).hexdigest()
    
    def _get_active_document_count(self, db: Session, data_source_id: int) -> int:
        """Get count of active (non-deleted) documents"""
        return db.query(Document).filter(
            Document.data_source_id == data_source_id,
            Document.is_deleted == False
        ).count()
    
    async def _update_vector_database(self, db: Session, data_source: DataSource, changes: List[DocumentChange]):
        """Update vector database with document changes"""
        from .rag_service import RAGService
        rag_service = RAGService()
        
        for change in changes:
            if change.action == "deleted":
                # Remove from vector database
                try:
                    # Generate the same ID format used when storing
                    if data_source.user_id:
                        doc_id = f"user_{data_source.user_id}_{data_source.source_type}_{change.document_id}"
                    else:
                        doc_id = f"team_{data_source.team_id}_{data_source.source_type}_{change.document_id}"
                    
                    rag_service.collection.delete(ids=[doc_id])
                except Exception as e:
                    print(f"Error removing document from vector DB: {e}")
            
            elif change.action in ["created", "updated"] and change.content:
                # Add/update in vector database with chunking
                try:
                    # Create document dict for chunking
                    doc_dict = {
                        'id': change.document_id,
                        'title': change.title,
                        'content': change.content,
                        'url': change.url
                    }
                    
                    # Chunk the document
                    chunks = self.chunking_service.chunk_document(doc_dict, data_source.source_type)
                    
                    # Process each chunk
                    for chunk in chunks:
                        # Generate embedding for chunk
                        embedding = rag_service.embedding_model.encode([chunk.content]).tolist()[0]
                        
                        # Prepare metadata
                        if data_source.user_id:
                            owner_key = 'user_id'
                            owner_value = data_source.user_id
                            doc_id = f"user_{data_source.user_id}_{data_source.source_type}_{change.document_id}_chunk_{chunk.chunk_index}"
                        else:
                            owner_key = 'team_id'
                            owner_value = data_source.team_id
                            doc_id = f"team_{data_source.team_id}_{data_source.source_type}_{change.document_id}_chunk_{chunk.chunk_index}"
                        
                        metadata = {
                            'title': change.title,
                            'url': change.url,
                            'source': data_source.source_type,
                            owner_key: owner_value,
                            'chunk_index': chunk.chunk_index,
                            'total_chunks': chunk.total_chunks,
                            'chunk_type': chunk.metadata.get('chunk_type', 'default'),
                            'created_at': '',
                            'updated_at': ''
                        }
                        
                        # Upsert chunk to vector database
                        rag_service.collection.upsert(
                            documents=[chunk.content],
                            metadatas=[metadata],
                            ids=[doc_id],
                            embeddings=[embedding]
                        )
                except Exception as e:
                    print(f"Error updating vector DB: {e}")