import { AlertCircle, CheckCircle, Clock, Database, RefreshCw, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

function DataSourceManager({ token, darkMode, currentContext }) {
  const [sources, setSources] = useState([]);
  const [syncStatus, setSyncStatus] = useState({});
  const [syncing, setSyncing] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSources();
    // Poll sync status every 30 seconds
    const interval = setInterval(loadSources, 30000);
    return () => clearInterval(interval);
  }, [token, currentContext]);

  const loadSources = async () => {
    if (!token) return;
    
    try {
      let url = '/data-sources';
      if (currentContext !== 'personal') {
        url = `/teams/${currentContext}/data-sources`;
      }

      const response = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSources(data);
        
        // Load sync history for each source
        data.forEach(source => loadSyncHistory(source.id));
      }
    } catch (error) {
      console.error('Error loading sources:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSyncHistory = async (sourceId) => {
    try {
      const response = await fetch(`/data-sources/${sourceId}/sync-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const history = await response.json();
        if (history.length > 0) {
          setSyncStatus(prev => ({
            ...prev,
            [sourceId]: history[0]
          }));
        }
      }
    } catch (error) {
      console.error('Error loading sync history:', error);
    }
  };

  const triggerSync = async (sourceId) => {
    setSyncing(prev => ({ ...prev, [sourceId]: true }));
    
    try {
      const response = await fetch(`/data-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        // Reload sync history after a short delay
        setTimeout(() => {
          loadSyncHistory(sourceId);
          setSyncing(prev => ({ ...prev, [sourceId]: false }));
        }, 2000);
      } else {
        setSyncing(prev => ({ ...prev, [sourceId]: false }));
      }
    } catch (error) {
      console.error('Error triggering sync:', error);
      setSyncing(prev => ({ ...prev, [sourceId]: false }));
    }
  };

  const getSyncStatusIcon = (status) => {
    if (!status) return <Clock className="w-4 h-4 text-gray-400" />;
    
    switch (status.status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span className={`ml-2 text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
          Loading data sources...
        </span>
      </div>
    );
  }

  if (sources.length === 0) {
    return (
      <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
        <Database className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p className="text-sm">No data sources configured</p>
        <p className="text-xs mt-1">Add a data source in Settings to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sources.map(source => {
        const status = syncStatus[source.id];
        const isSyncing = syncing[source.id];
        
        return (
          <div
            key={source.id}
            className={`p-4 rounded-lg border ${
              darkMode 
                ? 'bg-gray-700 border-gray-600' 
                : 'bg-white border-gray-200'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {source.name}
                  </h3>
                  {getSyncStatusIcon(status)}
                </div>
                
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {source.source_type}
                </p>
                
                {status && (
                  <div className={`text-xs mt-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    <div className="flex items-center gap-4">
                      <span>Last sync: {formatDate(status.started_at)}</span>
                      {status.documents_processed > 0 && (
                        <span>{status.documents_processed} docs</span>
                      )}
                    </div>
                    {status.error_message && (
                      <p className="text-red-500 mt-1">{status.error_message}</p>
                    )}
                  </div>
                )}
              </div>
              
              <button
                onClick={() => triggerSync(source.id)}
                disabled={isSyncing || status?.status === 'in_progress'}
                className={`ml-4 p-2 rounded-lg transition-colors ${
                  darkMode
                    ? 'hover:bg-gray-600 text-gray-300'
                    : 'hover:bg-gray-100 text-gray-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title="Sync now"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default DataSourceManager;
