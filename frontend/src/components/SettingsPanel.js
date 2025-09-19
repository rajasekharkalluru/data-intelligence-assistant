import React from 'react';

const SettingsPanel = ({ settings, onSettingsChange }) => {
  const handleSettingChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-medium">Settings</h3>

      {/* Response Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Response Type
        </label>
        <select
          value={settings.responseType}
          onChange={(e) => handleSettingChange('responseType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="brief">Brief - Quick, direct answers</option>
          <option value="concise">Concise - Clear with key details</option>
          <option value="expansive">Expansive - Comprehensive and detailed</option>
        </select>
      </div>

      {/* Temperature */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Creativity Level: {settings.temperature}
        </label>
        <input
          type="range"
          min="0"
          max="1"
          step="0.1"
          value={settings.temperature}
          onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Focused (0.0)</span>
          <span>Balanced (0.5)</span>
          <span>Creative (1.0)</span>
        </div>
        <p className="text-xs text-gray-600 mt-2">
          Lower values give more focused, deterministic responses. Higher values allow more creative, varied responses.
        </p>
      </div>

      {/* Model Info */}
      <div className="pt-4 border-t">
        <h4 className="text-sm font-medium text-gray-700 mb-2">Model Information</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>• Using local Ollama (llama3.2)</p>
          <p>• Vector DB: ChromaDB</p>
          <p>• Embeddings: all-MiniLM-L6-v2</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;