import { Brain, Database, Sliders, Sparkles, Zap } from 'lucide-react';

const SettingsPanel = ({ settings, onSettingsChange }) => {
  const handleSettingChange = (key, value) => {
    onSettingsChange({
      ...settings,
      [key]: value
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Sliders className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-bold text-gray-800">AI Settings</h3>
      </div>

      {/* Response Type */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Sparkles className="w-4 h-4 text-blue-600" />
          Response Style
        </label>
        <select
          value={settings.responseType}
          onChange={(e) => handleSettingChange('responseType', e.target.value)}
          className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-900 font-medium"
        >
          <option value="brief">⚡ Brief - Quick, direct answers</option>
          <option value="concise">📝 Concise - Clear with key details</option>
          <option value="expansive">📚 Expansive - Comprehensive and detailed</option>
        </select>
        <p className="text-xs text-gray-600 mt-2">
          Choose how detailed you want the AI responses to be
        </p>
      </div>

      {/* Temperature */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-5 border border-purple-100">
        <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3">
          <Zap className="w-4 h-4 text-purple-600" />
          Creativity Level
        </label>
        <div className="bg-white rounded-lg p-4 border-2 border-purple-200">
          <div className="flex justify-between items-center mb-2">
            <span className="text-2xl font-bold text-purple-600">{settings.temperature.toFixed(1)}</span>
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
              {settings.temperature < 0.3 ? 'Focused' : settings.temperature < 0.7 ? 'Balanced' : 'Creative'}
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={settings.temperature}
            onChange={(e) => handleSettingChange('temperature', parseFloat(e.target.value))}
            className="w-full h-2 bg-gradient-to-r from-blue-200 via-purple-200 to-pink-200 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #93c5fd ${settings.temperature * 100}%, #e9d5ff ${settings.temperature * 100}%)`
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-2">
            <span>🎯 Focused</span>
            <span>⚖️ Balanced</span>
            <span>🎨 Creative</span>
          </div>
        </div>
        <p className="text-xs text-gray-600 mt-3">
          Lower values give more focused responses. Higher values allow more creative variations.
        </p>
      </div>

      {/* Model Info */}
      <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-5 border border-gray-200">
        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-4">
          <Brain className="w-4 h-4 text-gray-600" />
          AI Model Information
        </h4>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Brain className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Language Model</p>
              <p className="text-xs text-gray-600">Ollama (llama3.2) - Local AI</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Database className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Vector Database</p>
              <p className="text-xs text-gray-600">ChromaDB - Semantic Search</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Embeddings</p>
              <p className="text-xs text-gray-600">all-MiniLM-L6-v2 - Fast & Accurate</p>
            </div>
          </div>
        </div>
      </div>

      {/* Privacy Notice */}
      <div className="bg-green-50 rounded-xl p-4 border border-green-200">
        <p className="text-xs text-green-800 flex items-start gap-2">
          <span className="text-lg">🔒</span>
          <span>
            <strong>Privacy First:</strong> All AI processing happens locally on your machine. 
            Your data never leaves your infrastructure.
          </span>
        </p>
      </div>
    </div>
  );
};

export default SettingsPanel;
