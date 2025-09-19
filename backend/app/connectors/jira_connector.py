from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime
from atlassian import Jira
from .base_connector import BaseConnector

class JiraConnector(BaseConnector):
    def __init__(self):
        super().__init__()
        self.display_name = "JIRA"
        self.description = "Atlassian JIRA issues and project documentation"
        self.jira = None
        self.credentials = {}
    
    def set_credentials(self, credentials: Dict[str, str]):
        """Set credentials for this connector"""
        self.credentials = credentials
        self._initialize()
    
    def _initialize(self):
        """Initialize JIRA client with provided credentials"""
        url = self.credentials.get("jira_url")
        username = self.credentials.get("jira_username")
        api_token = self.credentials.get("jira_api_token")
        
        if url and username and api_token:
            self.jira = Jira(
                url=url,
                username=username,
                password=api_token,
                cloud=True
            )
    
    async def is_configured(self) -> bool:
        """Check if JIRA is configured"""
        return self.jira is not None
    
    async def test_connection(self) -> bool:
        """Test connection to JIRA"""
        if not self.jira:
            return False
        
        try:
            self.jira.get_all_projects()
            return True
        except Exception:
            return False
    
    async def fetch_documents(self) -> List[Dict[str, Any]]:
        """Fetch issues and documentation from JIRA"""
        if not self.jira:
            return []
        
        documents = []
        
        try:
            # Get recent issues (last 100)
            jql = "ORDER BY updated DESC"
            issues = self.jira.jql(jql, limit=100, expand='changelog')
            
            for issue in issues['issues']:
                # Combine title, description, and comments
                content_parts = []
                
                # Add summary
                if issue['fields'].get('summary'):
                    content_parts.append(f"Summary: {issue['fields']['summary']}")
                
                # Add description
                if issue['fields'].get('description'):
                    content_parts.append(f"Description: {issue['fields']['description']}")
                
                # Add comments
                if issue['fields'].get('comment', {}).get('comments'):
                    comments = issue['fields']['comment']['comments']
                    for comment in comments[-3:]:  # Last 3 comments
                        if comment.get('body'):
                            content_parts.append(f"Comment: {comment['body']}")
                
                content = "\n\n".join(content_parts)
                
                if content.strip():  # Only add issues with content
                    documents.append({
                        'id': issue['key'],
                        'title': f"{issue['key']}: {issue['fields'].get('summary', 'No Summary')}",
                        'content': content,
                        'url': f"{self.credentials.get('jira_url')}/browse/{issue['key']}",
                        'created_at': issue['fields'].get('created', ''),
                        'updated_at': issue['fields'].get('updated', ''),
                        'issue_type': issue['fields'].get('issuetype', {}).get('name', ''),
                        'status': issue['fields'].get('status', {}).get('name', '')
                    })
        
        except Exception as e:
            print(f"Error fetching JIRA documents: {e}")
        
        return documents
    
    async def fetch_documents_since(self, since_date: Optional[datetime] = None, sync_token: Optional[str] = None) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """Fetch issues modified since a specific date (incremental sync)"""

        
        if not self.jira:
            return [], None
        
        documents = []
        
        try:
            # Build JQL query for issues updated since date
            if since_date:
                date_str = since_date.strftime('%Y-%m-%d %H:%M')
                jql = f"updated >= '{date_str}' ORDER BY updated DESC"
            else:
                jql = "ORDER BY updated DESC"
            
            # Get issues with pagination support
            start_at = int(sync_token) if sync_token else 0
            max_results = 100
            
            issues = self.jira.jql(jql, limit=max_results, start=start_at, expand='changelog')
            
            for issue in issues['issues']:
                # Combine title, description, and comments
                content_parts = []
                
                # Add summary
                if issue['fields'].get('summary'):
                    content_parts.append(f"Summary: {issue['fields']['summary']}")
                
                # Add description
                if issue['fields'].get('description'):
                    content_parts.append(f"Description: {issue['fields']['description']}")
                
                # Add comments
                if issue['fields'].get('comment', {}).get('comments'):
                    comments = issue['fields']['comment']['comments']
                    for comment in comments[-3:]:  # Last 3 comments
                        if comment.get('body'):
                            content_parts.append(f"Comment: {comment['body']}")
                
                content = "\n\n".join(content_parts)
                
                if content.strip():  # Only add issues with content
                    documents.append({
                        'id': issue['key'],
                        'title': f"{issue['key']}: {issue['fields'].get('summary', 'No Summary')}",
                        'content': content,
                        'url': f"{self.credentials.get('jira_url')}/browse/{issue['key']}",
                        'created_at': issue['fields'].get('created', ''),
                        'updated_at': issue['fields'].get('updated', ''),
                        'issue_type': issue['fields'].get('issuetype', {}).get('name', ''),
                        'status': issue['fields'].get('status', {}).get('name', '')
                    })
            
            # Calculate next token for pagination
            next_token = None
            if len(issues['issues']) == max_results:
                next_token = str(start_at + max_results)
            
            return documents, next_token
            
        except Exception as e:
            print(f"Error fetching incremental JIRA documents: {e}")
            return [], None