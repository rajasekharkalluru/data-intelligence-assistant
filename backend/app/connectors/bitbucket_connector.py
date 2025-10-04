import httpx
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from .base_connector import BaseConnector

class BitbucketConnector(BaseConnector):
    def __init__(self):
        super().__init__()
        self.display_name = "Bitbucket"
        self.description = "Bitbucket repositories and documentation"
        self.base_url = "https://api.bitbucket.org/2.0"
        self.credentials = {}
    
    def set_credentials(self, credentials: Dict[str, str]):
        """Set credentials for this connector"""
        self.credentials = credentials
    
    async def is_configured(self) -> bool:
        """Check if Bitbucket is configured"""
        return all([
            self.credentials.get("bitbucket_workspace"),
            self.credentials.get("bitbucket_username"),
            self.credentials.get("bitbucket_app_password")
        ])
    
    async def test_connection(self) -> bool:
        """Test connection to Bitbucket"""
        if not await self.is_configured():
            return False
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.base_url}/workspaces/{self.credentials.get('bitbucket_workspace')}",
                    auth=(self.credentials.get("bitbucket_username"), self.credentials.get("bitbucket_app_password"))
                )
                return response.status_code == 200
        except Exception:
            return False
    
    async def fetch_documents(self) -> List[Dict[str, Any]]:
        """Fetch README files and documentation from Bitbucket repositories"""
        if not await self.is_configured():
            return []
        
        documents = []
        
        try:
            async with httpx.AsyncClient() as client:
                # Get repositories
                workspace = self.credentials.get("bitbucket_workspace")
                username = self.credentials.get("bitbucket_username")
                app_password = self.credentials.get("bitbucket_app_password")
                
                repos_response = await client.get(
                    f"{self.base_url}/repositories/{workspace}",
                    auth=(username, app_password)
                )
                
                if repos_response.status_code != 200:
                    return documents
                
                repos = repos_response.json()
                
                for repo in repos.get('values', []):
                    repo_name = repo['name']
                    repo_slug = repo['slug']
                    
                    # Fetch repository files
                    repo_docs = await self._fetch_repo_files(
                        client, workspace, repo_slug, username, app_password, repo
                    )
                    documents.extend(repo_docs)
        
        except Exception as e:
            print(f"Error fetching Bitbucket documents: {e}")
        
        return documents
    
    async def _fetch_repo_files(self, client, workspace: str, repo_slug: str, username: str, app_password: str, repo: Dict) -> List[Dict[str, Any]]:
        """Fetch important files from a repository"""
        documents = []
        
        # Files to fetch (documentation and key code files)
        important_files = [
            'README.md', 'README.rst', 'README.txt', 'README',
            'CONTRIBUTING.md', 'ARCHITECTURE.md', 'API.md',
            'docs/README.md', 'docs/index.md'
        ]
        
        for file_path in important_files:
            try:
                file_response = await client.get(
                    f"{self.base_url}/repositories/{workspace}/{repo_slug}/src/main/{file_path}",
                    auth=(username, app_password),
                    timeout=10.0
                )
                
                if file_response.status_code == 200:
                    content = file_response.text
                    
                    # Only include if content is substantial
                    if len(content.strip()) > 50:
                        documents.append({
                            'id': f"{workspace}_{repo_slug}_{file_path.replace('/', '_')}",
                            'title': f"{repo['name']} - {file_path}",
                            'content': content,
                            'file_path': file_path,
                            'url': f"{repo['links']['html']['href']}/src/main/{file_path}",
                            'created_at': repo.get('created_on', ''),
                            'updated_at': repo.get('updated_on', ''),
                            'repository': repo['name'],
                            'language': repo.get('language', 'unknown')
                        })
            
            except Exception:
                continue  # File doesn't exist or error, try next
        
        return documents
    
    async def fetch_documents_since(self, since_date: Optional[datetime] = None, sync_token: Optional[str] = None) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Fetch documents modified since a specific date (incremental sync)"""

        
        if not await self.is_configured():
            return [], None
        
        documents = []
        
        try:
            async with httpx.AsyncClient() as client:
                workspace = self.credentials.get("bitbucket_workspace")
                username = self.credentials.get("bitbucket_username")
                app_password = self.credentials.get("bitbucket_app_password")
                
                # Get repositories updated since date
                url = f"{self.base_url}/repositories/{workspace}"
                if since_date:
                    # Bitbucket API supports filtering by updated_on
                    date_str = since_date.isoformat()
                    url += f"?q=updated_on>={date_str}"
                
                repos_response = await client.get(url, auth=(username, app_password))
                
                if repos_response.status_code != 200:
                    return documents, None
                
                repos = repos_response.json()
                
                for repo in repos.get('values', []):
                    repo_slug = repo['slug']
                    
                    # Check if repository was updated since our last sync
                    if since_date:
                        repo_updated = datetime.fromisoformat(repo.get('updated_on', '').replace('Z', '+00:00'))
                        if repo_updated <= since_date:
                            continue
                    
                    # Fetch repository files
                    repo_docs = await self._fetch_repo_files(
                        client, workspace, repo_slug, username, app_password, repo
                    )
                    documents.extend(repo_docs)
            
            return documents, None
            
        except Exception as e:
            print(f"Error fetching incremental Bitbucket documents: {e}")
            return [], None