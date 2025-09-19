import React, { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, RefreshCw, Activity, Calendar } from 'lucide-react';

const SyncStatus = ({ sourceId, token }) => {
  const [syncHistory, setSyncHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (sourceId) {
      fetchSyncHistory();
    }
  }, [sourceId]);

  const fetchSyncHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/data-sources/${sourceId}/sync-history`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSyncHistory(data);
      }
    } catch (error) {
      console.error('Error fetching sync history:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'error':
        return <XCircle className="text-red-500" size={16} />;
      case 'running':
        return <RefreshCw className="text-blue-500 animate-spin" size={16} />;
      default:
        return <Clock className="text-gray-500" size={16} />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'success':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  const formatDuration = (seconds) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <RefreshCw className="animate-spin" size={20} />
        <span className="ml-2">Loading sync history...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Activity size={16} />
          Sync History
        </h4>
        <button
          onClick={fetchSyncHistory}
          className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
        >
          <RefreshCw size={14} />
        </button>
      </div>

      {syncHistory.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          <Calendar size={48} className="mx-auto mb-4 text-gray-300" />
          <p>No sync history available</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {syncHistory.map((sync, index) => (
            <div
              key={sync.id || index}
              className={`border rounded-lg p-3 ${getStatusColor(sync.sync_status)}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getStatusIcon(sync.sync_status)}
                  <span className="font-medium capitalize">
                    {sync.sync_strategy} Sync
                  </span>
                </div>
                <span className="text-xs">
                  {formatDate(sync.started_at)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Documents:</span>
                  <div className="font-medium">
                    {sync.documents_processed} processed
                  </div>
                  {sync.documents_added > 0 && (
                    <div className="text-green-600">+{sync.documents_added} added</div>
                  )}
                  {sync.documents_updated > 0 && (
                    <div className="text-blue-600">~{sync.documents_updated} updated</div>
                  )}
                  {sync.documents_deleted > 0 && (
                    <div className="text-red-600">-{sync.documents_deleted} deleted</div>
                  )}
                </div>

                <div>
                  <span className="text-gray-600">Duration:</span>
                  <div className="font-medium">
                    {sync.processing_time ? formatDuration(parseFloat(sync.processing_time)) : 'N/A'}
                  </div>
                  {sync.next_sync_at && (
                    <div className="text-gray-600 text-xs">
                      Next: {formatDate(sync.next_sync_at)}
                    </div>
                  )}
                </div>
              </div>

              {sync.error_message && (
                <div className="mt-2 p-2 bg-red-100 border border-red-200 rounded text-sm text-red-700">
                  <strong>Error:</strong> {sync.error_message}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SyncStatus;