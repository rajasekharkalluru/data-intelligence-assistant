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
                    
                    # Look for README files
                    readme_files = ['README.md', 'README.rst', 'README.txt', 'README']
                    
                    for readme_file in readme_files:
                        try:
                            file_response = await client.get(
                                f"{self.base_url}/repositories/{workspace}/{repo_name}/src/main/{readme_file}",
                                auth=(username, app_password)
                            )
                            
                            if file_response.status_code == 200:
                                content = file_response.text
                                
                                documents.append({
                                    'id': f"{workspace}_{repo_name}_{readme_file}",
                                    'title': f"{repo_name} - {readme_file}",
                                    'content': content,
                                    'url': repo['links']['html']['href'],
                                    'created_at': repo.get('created_on', ''),
                                    'updated_at': repo.get('updated_on', ''),
                                    'repository': repo_name
                                })
                                break  # Found a README, move to next repo
                        
                        except Exception:
                            continue  # Try next README file
        
        except Exception as e:
            print(f"Error fetching Bitbucket documents: {e}")
        
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
                    repo_name = repo['name']
                    
                    # Check if repository was updated since our last sync
                    if since_date:
                        repo_updated = datetime.fromisoformat(repo.get('updated_on', '').replace('Z', '+00:00'))
                        if repo_updated <= since_date:
                            continue
                    
                    # Look for README files
                    readme_files = ['README.md', 'README.rst', 'README.txt', 'README']
                    
                    for readme_file in readme_files:
                        try:
                            file_response = await client.get(
                                f"{self.base_url}/repositories/{workspace}/{repo_name}/src/main/{readme_file}",
                                auth=(username, app_password)
                            )
                            
                            if file_response.status_code == 200:
                                content = file_response.text
                                
                                documents.append({
                                    'id': f"{workspace}_{repo_name}_{readme_file}",
                                    'title': f"{repo_name} - {readme_file}",
                                    'content': content,
                                    'url': repo['links']['html']['href'],
                                    'created_at': repo.get('created_on', ''),
                                    'updated_at': repo.get('updated_on', ''),
                                    'repository': repo_name
                                })
                                break
                        
                        except Exception:
                            continue
            
            return documents, None
            
        except Exception as e:
            print(f"Error fetching incremental Bitbucket documents: {e}")
            return [], None