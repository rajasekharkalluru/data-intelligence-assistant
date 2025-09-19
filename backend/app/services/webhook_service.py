import hashlib
import hmac
import json
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException

from ..models.user import DataSource
from ..models.sync import WebhookEvent
from ..services.sync_service import SyncService

class WebhookService:
    def __init__(self):
        self.sync_service = SyncService()
    
    async def handle_confluence_webhook(self, db: Session, payload: Dict[str, Any], signature: str = None) -> Dict[str, str]:
        """Handle Confluence webhook events"""
        try:
            # Extract event information
            event_type = payload.get('eventType', '')
            page_data = payload.get('page', {})
            
            if not page_data:
                return {"status": "ignored", "reason": "No page data"}
            
            # Find data sources that might be affected
            confluence_url = self._extract_base_url(page_data.get('_links', {}).get('base', ''))
            data_sources = db.query(DataSource).filter(
                DataSource.source_type == 'confluence',
                DataSource.sync_strategy == 'event_driven'
            ).all()
            
            affected_sources = []
            for ds in data_sources:
                credentials = self.sync_service.encryption_service.decrypt_credentials(ds.encrypted_credentials)
                if credentials.get('confluence_url', '').rstrip('/') == confluence_url.rstrip('/'):
                    affected_sources.append(ds)
            
            if not affected_sources:
                return {"status": "ignored", "reason": "No matching data sources"}
            
            # Process the event
            webhook_event = WebhookEvent(
                source_type="confluence",
                event_type=event_type,
                document_id=page_data.get('id', ''),
                action=self._map_confluence_event_to_action(event_type),
                timestamp=datetime.utcnow(),
                data=payload
            )
            
            # Update affected data sources
            for data_source in affected_sources:
                await self._process_webhook_event(db, data_source, webhook_event)
            
            return {"status": "processed", "affected_sources": len(affected_sources)}
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def handle_jira_webhook(self, db: Session, payload: Dict[str, Any], signature: str = None) -> Dict[str, str]:
        """Handle JIRA webhook events"""
        try:
            # Extract event information
            event_type = payload.get('webhookEvent', '')
            issue_data = payload.get('issue', {})
            
            if not issue_data:
                return {"status": "ignored", "reason": "No issue data"}
            
            # Find matching data sources
            jira_url = self._extract_jira_url_from_issue(issue_data)
            data_sources = db.query(DataSource).filter(
                DataSource.source_type == 'jira',
                DataSource.sync_strategy == 'event_driven'
            ).all()
            
            affected_sources = []
            for ds in data_sources:
                credentials = self.sync_service.encryption_service.decrypt_credentials(ds.encrypted_credentials)
                if credentials.get('jira_url', '').rstrip('/') == jira_url.rstrip('/'):
                    affected_sources.append(ds)
            
            if not affected_sources:
                return {"status": "ignored", "reason": "No matching data sources"}
            
            # Process the event
            webhook_event = WebhookEvent(
                source_type="jira",
                event_type=event_type,
                document_id=issue_data.get('key', ''),
                action=self._map_jira_event_to_action(event_type),
                timestamp=datetime.utcnow(),
                data=payload
            )
            
            # Update affected data sources
            for data_source in affected_sources:
                await self._process_webhook_event(db, data_source, webhook_event)
            
            return {"status": "processed", "affected_sources": len(affected_sources)}
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def handle_bitbucket_webhook(self, db: Session, payload: Dict[str, Any], signature: str = None) -> Dict[str, str]:
        """Handle Bitbucket webhook events"""
        try:
            # Bitbucket webhooks are mainly for repository changes
            # We're interested in push events that might affect README files
            event_type = payload.get('eventKey', '')
            repository = payload.get('repository', {})
            
            if event_type != 'repo:refs_changed':
                return {"status": "ignored", "reason": "Not a relevant event type"}
            
            # Find matching data sources
            workspace = repository.get('project', {}).get('key', '')
            data_sources = db.query(DataSource).filter(
                DataSource.source_type == 'bitbucket',
                DataSource.sync_strategy == 'event_driven'
            ).all()
            
            affected_sources = []
            for ds in data_sources:
                credentials = self.sync_service.encryption_service.decrypt_credentials(ds.encrypted_credentials)
                if credentials.get('bitbucket_workspace', '') == workspace:
                    affected_sources.append(ds)
            
            if not affected_sources:
                return {"status": "ignored", "reason": "No matching data sources"}
            
            # Process the event
            webhook_event = WebhookEvent(
                source_type="bitbucket",
                event_type=event_type,
                document_id=repository.get('name', ''),
                action="updated",
                timestamp=datetime.utcnow(),
                data=payload
            )
            
            # Update affected data sources
            for data_source in affected_sources:
                await self._process_webhook_event(db, data_source, webhook_event)
            
            return {"status": "processed", "affected_sources": len(affected_sources)}
            
        except Exception as e:
            return {"status": "error", "error": str(e)}
    
    async def _process_webhook_event(self, db: Session, data_source: DataSource, event: WebhookEvent):
        """Process a webhook event for a specific data source"""
        try:
            # For now, trigger an incremental sync
            # In a more sophisticated implementation, we could process the specific document
            await self.sync_service.sync_data_source(db, data_source, strategy="incremental")
            
        except Exception as e:
            print(f"Error processing webhook event for data source {data_source.id}: {e}")
    
    def _map_confluence_event_to_action(self, event_type: str) -> str:
        """Map Confluence event types to our action types"""
        mapping = {
            'page_created': 'created',
            'page_updated': 'updated',
            'page_removed': 'deleted',
            'page_trashed': 'deleted',
            'page_restored': 'updated'
        }
        return mapping.get(event_type, 'updated')
    
    def _map_jira_event_to_action(self, event_type: str) -> str:
        """Map JIRA event types to our action types"""
        mapping = {
            'jira:issue_created': 'created',
            'jira:issue_updated': 'updated',
            'jira:issue_deleted': 'deleted'
        }
        return mapping.get(event_type, 'updated')
    
    def _extract_base_url(self, base_url: str) -> str:
        """Extract base URL from Confluence links"""
        if base_url:
            return base_url.split('/wiki')[0]
        return ""
    
    def _extract_jira_url_from_issue(self, issue_data: Dict[str, Any]) -> str:
        """Extract JIRA base URL from issue data"""
        self_url = issue_data.get('self', '')
        if self_url:
            # Extract base URL from self link
            parts = self_url.split('/rest/api/')
            if len(parts) > 0:
                return parts[0]
        return ""
    
    def verify_webhook_signature(self, payload: bytes, signature: str, secret: str) -> bool:
        """Verify webhook signature for security"""
        if not secret or not signature:
            return False
        
        # Different services use different signature formats
        if signature.startswith('sha256='):
            # GitHub/Bitbucket style
            expected = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            return hmac.compare_digest(f"sha256={expected}", signature)
        
        elif signature.startswith('sha1='):
            # Some services use SHA1
            expected = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha1
            ).hexdigest()
            return hmac.compare_digest(f"sha1={expected}", signature)
        
        return False