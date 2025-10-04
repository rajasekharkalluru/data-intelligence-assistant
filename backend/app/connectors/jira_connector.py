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
            # Get all projects first
            projects = self.jira.get_all_projects()
            project_keys = [p['key'] for p in projects[:5]]  # Limit to first 5 projects
            
            for project_key in project_keys:
                # Get issues from project
                jql = f"project = {project_key} ORDER BY updated DESC"
                issues = self.jira.jql(jql, limit=100, fields='*all')
                
                for issue in issues.get('issues', []):
                    doc = self._parse_issue(issue)
                    if doc:
                        documents.append(doc)
        
        except Exception as e:
            print(f"Error fetching JIRA documents: {e}")
        
        return documents
    
    def _parse_issue(self, issue: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Parse a JIRA issue into a document"""
        try:
            fields = issue.get('fields', {})
            
            # Build comprehensive content
            content_parts = []
            
            # Summary
            summary = fields.get('summary', '')
            if summary:
                content_parts.append(f"Summary: {summary}")
            
            # Description
            description = fields.get('description', '')
            if description:
                content_parts.append(f"Description: {description}")
            
            # Priority
            priority = fields.get('priority', {})
            if priority:
                content_parts.append(f"Priority: {priority.get('name', 'None')}")
            
            # Assignee
            assignee = fields.get('assignee', {})
            if assignee:
                content_parts.append(f"Assignee: {assignee.get('displayName', 'Unassigned')}")
            
            # Labels
            labels = fields.get('labels', [])
            if labels:
                content_parts.append(f"Labels: {', '.join(labels)}")
            
            # Comments
            comments = fields.get('comment', {}).get('comments', [])
            comment_list = []
            for comment in comments:
                author = comment.get('author', {}).get('displayName', 'Unknown')
                body = comment.get('body', '')
                if body:
                    comment_list.append({
                        'author': author,
                        'body': body,
                        'created': comment.get('created', '')
                    })
            
            content = "\n\n".join(content_parts)
            
            if not content.strip():
                return None
            
            return {
                'id': issue['key'],
                'title': f"{issue['key']}: {summary}",
                'content': content,
                'description': description,
                'comments': comment_list,
                'url': f"{self.credentials.get('jira_url')}/browse/{issue['key']}",
                'created_at': fields.get('created', ''),
                'updated_at': fields.get('updated', ''),
                'issue_type': fields.get('issuetype', {}).get('name', ''),
                'status': fields.get('status', {}).get('name', ''),
                'priority': priority.get('name', 'None') if priority else 'None',
                'assignee': assignee.get('displayName', 'Unassigned') if assignee else 'Unassigned',
                'labels': labels
            }
        except Exception as e:
            print(f"Error parsing JIRA issue: {e}")
            return None
    
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
            
            issues = self.jira.jql(jql, limit=max_results, start=start_at, fields='*all')
            
            for issue in issues.get('issues', []):
                doc = self._parse_issue(issue)
                if doc:
                    documents.append(doc)
            
            # Calculate next token for pagination
            next_token = None
            if len(issues['issues']) == max_results:
                next_token = str(start_at + max_results)
            
            return documents, next_token
            
        except Exception as e:
            print(f"Error fetching incremental JIRA documents: {e}")
            return [], None