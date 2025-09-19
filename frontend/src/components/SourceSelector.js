import React, { useState } from 'react';
import { RefreshCw, CheckCircle, XCircle, Sync, Plus, Edit, Trash2, TestTube } from 'lucide-react';
import DataSourceForm from './DataSourceForm';

const SourceSelector = ({ sources, selectedSources, onSourcesChange, onRefresh, token, currentContext }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  const handleSourceToggle = (sourceId) => {
    if (selectedSources.includes(sourceId)) {
      onSourcesChange(selectedSources.filter(s => s !== sourceId));
    } else {
      onSourcesChange([...selectedSources, sourceId]);
    }
  };

  const handleSyncSource = async (sourceId) => {
    try {
      const response = await fetch(`/data-sources/${sourceId}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      alert(`Sync completed: ${result.message}`);
      onRefresh();
    } catch (error) {
      alert(`Sync failed: ${error.message}`);
    }
  };

  const getContextLabel = () => {
    return currentContext === 'personal' ? 'Personal' : 'Team';
  };

  const handleTestConnection = async (sourceId) => {
    try {
      const response = await fetch(`/data-sources/${sourceId}/test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const result = await response.json();
      alert(result.connected ? 'Connection successful!' : 'Connection failed!');
    } catch (error) {
      alert(`Test failed: ${error.message}`);
    }
  };

  const handleDeleteSource = async (sourceId) => {
    if (!confirm('Are you sure you want to delete this data source?')) return;
    
    try {
      const response = await fetch(`/data-sources/${sourceId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        onRefresh();
      } else {
        alert('Failed to delete data source');
      }
    } catch (error) {
      alert(`Delete failed: ${error.message}`);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Data Sources</h3>
          <p className="text-sm text-gray-600">{getContextLabel()} data sources</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(true)}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded"
            title="Add data source"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={onRefresh}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
            title="Refresh"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {sources.map((source) => (
          <div key={source.id} className="border rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id={`source-${source.id}`}
                  checked={selectedSources.includes(source.id)}
                  onChange={() => handleSourceToggle(source.id)}
                  disabled={!source.is_active}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor={`source-${source.id}`} className="font-medium">
                  {source.display_name}
                </label>
              </div>
              
              <div className="flex items-center gap-1">
                {source.is_active ? (
                  <CheckCircle className="text-green-500" size={16} />
                ) : (
                  <XCircle className="text-red-500" size={16} />
                )}
                
                <button
                  onClick={() => handleTestConnection(source.id)}
                  className="p-1 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded"
                  title="Test connection"
                >
                  <TestTube size={14} />
                </button>
                
                {source.is_active && (
                  <button
                    onClick={() => handleSyncSource(source.id)}
                    className="p-1 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Sync data"
                  >
                    <Sync size={14} />
                  </button>
                )}
                
                <button
                  onClick={() => setEditingSource(source)}
                  className="p-1 text-gray-500 hover:text-yellow-600 hover:bg-yellow-50 rounded"
                  title="Edit"
                >
                  <Edit size={14} />
                </button>
                
                <button
                  onClick={() => handleDeleteSource(source.id)}
                  className="p-1 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                  title="Delete"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-1">
              <p>{source.source_type.charAt(0).toUpperCase() + source.source_type.slice(1)}</p>
              {source.last_sync && (
                <p className="text-xs">
                  Last sync: {new Date(source.last_sync).toLocaleString()}
                  {source.document_count > 0 && ` (${source.document_count} documents)`}
                </p>
              )}
              {source.sync_status === 'error' && (
                <p className="text-xs text-red-600">{source.sync_message}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {sources.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <p>No data sources configured</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-blue-600 hover:text-blue-700 text-sm"
          >
            Add your first data source
          </button>
        </div>
      )}

      {(showForm || editingSource) && (
        <DataSourceForm
          source={editingSource}
          token={token}
          currentContext={currentContext}
          onClose={() => {
            setShowForm(false);
            setEditingSource(null);
          }}
          onSuccess={() => {
            setShowForm(false);
            setEditingSource(null);
            onRefresh();
          }}
        />
      )}
    </div>
  );
};

export default SourceSelector;