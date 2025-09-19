from abc import ABC, abstractmethod
from typing import List, Dict, Any

class BaseConnector(ABC):
    """Base class for all data source connectors"""
    
    def __init__(self):
        self.display_name = ""
        self.description = ""
        self.credentials = {}
    
    def set_credentials(self, credentials: Dict[str, str]):
        """Set credentials for this connector"""
        self.credentials = credentials
    
    @abstractmethod
    async def is_configured(self) -> bool:
        """Check if the connector is properly configured"""
        pass
    
    @abstractmethod
    async def fetch_documents(self) -> List[Dict[str, Any]]:
        """Fetch documents from the data source"""
        pass
    
    @abstractmethod
    async def test_connection(self) -> bool:
        """Test the connection to the data source"""
        pass