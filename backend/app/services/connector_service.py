from typing import List, Dict, Any
import asyncio
from ..connectors.confluence_connector import ConfluenceConnector
from ..connectors.bitbucket_connector import BitbucketConnector
from ..connectors.jira_connector import JiraConnector

class ConnectorService:
    def __init__(self):
        self.connectors = {
            "confluence": ConfluenceConnector(),
            "bitbucket": BitbucketConnector(), 
            "jira": JiraConnector()
        }
    
    async def get_available_sources(self) -> List[Dict[str, Any]]:
        """Get list of configured data sources"""
        sources = []
        for name, connector in self.connectors.items():
            is_configured = await connector.is_configured()
            sources.append({
                "name": name,
                "display_name": connector.display_name,
                "configured": is_configured,
                "description": connector.description
            })
        return sources
    
    async def sync_source(self, source_type: str) -> int:
        """Sync data from a specific source"""
        if source_type not in self.connectors:
            raise ValueError(f"Unknown source type: {source_type}")
        
        connector = self.connectors[source_type]
        if not await connector.is_configured():
            raise ValueError(f"Source {source_type} is not configured")
        
        documents = await connector.fetch_documents()
        
        # Store in vector database
        await self._store_documents(documents, source_type)
        
        return len(documents)
    
    async def _store_documents(self, documents: List[Dict[str, Any]], source_type: str):
        """Store documents in the vector database"""
        from .rag_service import RAGService
        rag_service = RAGService()
        
        texts = []
        metadatas = []
        ids = []
        
        for i, doc in enumerate(documents):
            texts.append(doc['content'])
            metadatas.append({
                'title': doc['title'],
                'url': doc['url'],
                'source': source_type,
                'created_at': doc.get('created_at', ''),
                'updated_at': doc.get('updated_at', '')
            })
            ids.append(f"{source_type}_{i}_{hash(doc['url'])}")
        
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