import React, { useState, useEffect } from 'react';
import { X, Eye, EyeOff } from 'lucide-react';

const DataSourceForm = ({ source, token, currentContext, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    source_type: source?.source_type || 'confluence',
    display_name: source?.display_name || '',
    is_active: source?.is_active ?? true,
    credentials: {}
  });
  const [showPasswords, setShowPasswords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sourceTypes = {
    confluence: {
      name: 'Confluence',
      fields: [
        { key: 'confluence_url', label: 'Confluence URL', type: 'url', placeholder: 'https://your-domain.atlassian.net' },
        { key: 'confluence_username', label: 'Username/Email', type: 'email', placeholder: 'your-email@company.com' },
        { key: 'confluence_api_token', label: 'API Token', type: 'password', placeholder: 'Your API token' }
      ]
    },
    bitbucket: {
      name: 'Bitbucket',
      fields: [
        { key: 'bitbucket_workspace', label: 'Workspace', type: 'text', placeholder: 'your-workspace' },
        { key: 'bitbucket_username', label: 'Username', type: 'text', placeholder: 'your-username' },
        { key: 'bitbucket_app_password', label: 'App Password', type: 'password', placeholder: 'Your app password' }
      ]
    },
    jira: {
      name: 'JIRA',
      fields: [
        { key: 'jira_url', label: 'JIRA URL', type: 'url', placeholder: 'https://your-domain.atlassian.net' },
        { key: 'jira_username', label: 'Username/Email', type: 'email', placeholder: 'your-email@company.com' },
        { key: 'jira_api_token', label: 'API Token', type: 'password', placeholder: 'Your API token' }
      ]
    }
  };

  useEffect(() => {
    if (!source) {
      // New source - set default display name
      const sourceType = sourceTypes[formData.source_type];
      setFormData(prev => ({
        ...prev,
        display_name: `My ${sourceType.name}`
      }));
    }
  }, [formData.source_type, source]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      let url, method;
      
      if (source) {
        // Updating existing source
        url = `/data-sources/${source.id}`;
        method = 'PUT';
      } else {
        // Creating new source
        if (currentContext === 'personal') {
          url = '/data-sources';
        } else {
          url = `/teams/${currentContext}/data-sources`;
        }
        method = 'POST';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        onSuccess();
      } else {
        const data = await response.json();
        setError(data.detail || 'An error occurred');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.startsWith('credential_')) {
      const credentialKey = name.replace('credential_', '');
      setFormData(prev => ({
        ...prev,
        credentials: {
          ...prev.credentials,
          [credentialKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const togglePasswordVisibility = (fieldKey) => {
    setShowPasswords(prev => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const currentSourceType = sourceTypes[formData.source_type];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-medium">
            {source ? 'Edit Data Source' : 'Add Data Source'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">
              {error}
            </div>
          )}

          {!source && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Source Type
              </label>
              <select
                name="source_type"
                value={formData.source_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(sourceTypes).map(([key, type]) => (
                  <option key={key} value={key}>{type.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Display Name
            </label>
            <input
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`My ${currentSourceType.name}`}
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_active"
              name="is_active"
              checked={formData.is_active}
              onChange={handleInputChange}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
              Active
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Credentials</h4>
            {currentSourceType.fields.map((field) => (
              <div key={field.key}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <div className="relative">
                  <input
                    type={field.type === 'password' && !showPasswords[field.key] ? 'password' : 'text'}
                    name={`credential_${field.key}`}
                    value={formData.credentials[field.key] || ''}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={field.placeholder}
                  />
                  {field.type === 'password' && (
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility(field.key)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPasswords[field.key] ? (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-400" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : (source ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DataSourceForm;