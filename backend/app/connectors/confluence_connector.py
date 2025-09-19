from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from atlassian import Confluence
from .base_connector import BaseConnector

class ConfluenceConnector(BaseConnector):
    def __init__(self):
        super().__init__()
        self.display_name = "Confluence"
        self.description = "Atlassian Confluence wiki and documentation"
        self.confluence = None
        self.credentials = {}
    
    def set_credentials(self, credentials: Dict[str, str]):
        """Set credentials for this connector"""
        self.credentials = credentials
        self._initialize()
    
    def _initialize(self):
        """Initialize Confluence client with provided credentials"""
        url = self.credentials.get("confluence_url")
        username = self.credentials.get("confluence_username")
        api_token = self.credentials.get("confluence_api_token")
        
        if url and username and api_token:
            self.confluence = Confluence(
                url=url,
                username=username,
                password=api_token,
                cloud=True
            )
    
    async def is_configured(self) -> bool:
        """Check if Confluence is configured"""
        return self.confluence is not None
    
    async def test_connection(self) -> bool:
        """Test connection to Confluence"""
        if not self.confluence:
            return False
        
        try:
            self.confluence.get_all_spaces(limit=1)
            return True
        except Exception:
            return False
    
    async def fetch_documents(self) -> List[Dict[str, Any]]:
        """Fetch pages from Confluence"""
        if not self.confluence:
            return []
        
        documents = []
        
        try:
            # Get all spaces
            spaces = self.confluence.get_all_spaces()
            
            for space in spaces['results']:
                space_key = space['key']
                
                # Get pages in space
                pages = self.confluence.get_all_pages_from_space(
                    space_key, 
                    expand='body.storage,version,history'
                )
                
                for page in pages:
                    content = ""
                    if 'body' in page and 'storage' in page['body']:
                        content = page['body']['storage']['value']
                    
                    # Clean HTML content (basic cleanup)
                    import re
                    content = re.sub(r'<[^>]+>', '', content)
                    content = content.strip()
                    
                    if content:  # Only add pages with content
                        documents.append({
                            'id': page['id'],
                            'title': page['title'],
                            'content': content,
                            'url': f"{self.credentials.get('confluence_url')}/wiki{page['_links']['webui']}",
                            'created_at': page.get('history', {}).get('createdDate', ''),
                            'updated_at': page.get('version', {}).get('when', ''),
                            'space': space_key,
                            'version': page.get('version', {}).get('number', 1)
                        })
        
        except Exception as e:
            print(f"Error fetching Confluence documents: {e}")
        
        return documents
    
    async def fetch_documents_since(self, since_date: Optional[datetime] = None, sync_token: Optional[str] = None) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Fetch documents modified since a specific date (incremental sync)"""
        if not self.confluence:
            return [], None
        
        documents = []
        
        try:
            # Confluence doesn't have a direct "modified since" API, but we can use CQL
            # CQL (Confluence Query Language) allows filtering by lastModified
            if since_date:
                # Format date for CQL
                date_str = since_date.strftime('%Y-%m-%d')
                cql = f"lastModified >= '{date_str}' order by lastModified"
                
                # Search using CQL
                search_results = self.confluence.cql(cql, expand='body.storage,version,history')
                
                for page in search_results.get('results', []):
                    if page['type'] == 'page':
                        content = ""
                        if 'body' in page and 'storage' in page['body']:
                            content = page['body']['storage']['value']
                        
                        # Clean HTML content
                        import re
                        content = re.sub(r'<[^>]+>', '', content)
                        content = content.strip()
                        
                        if content:
                            documents.append({
                                'id': page['id'],
                                'title': page['title'],
                                'content': content,
                                'url': f"{self.credentials.get('confluence_url')}/wiki{page['_links']['webui']}",
                                'created_at': page.get('history', {}).get('createdDate', ''),
                                'updated_at': page.get('version', {}).get('when', ''),
                                'space': page.get('space', {}).get('key', ''),
                                'version': page.get('version', {}).get('number', 1)
                            })
            
            # Return documents and next token (Confluence doesn't use tokens, so return None)
            return documents, None
            
        except Exception as e:
            print(f"Error fetching incremental Confluence documents: {e}")
            return [], None