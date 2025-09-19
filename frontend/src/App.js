import React, { useState, useEffect } from 'react';
import ChatInterface from './components/ChatInterface';
import SourceSelector from './components/SourceSelector';
import SettingsPanel from './components/SettingsPanel';
import AuthForm from './components/AuthForm';
import Header from './components/Header';
import ContextSelector from './components/ContextSelector';
import TeamManager from './components/TeamManager';
import { Settings, MessageSquare, Database, Users } from 'lucide-react';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('chat');
  const [sources, setSources] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [currentContext, setCurrentContext] = useState('personal'); // 'personal' or team_id
  const [settings, setSettings] = useState({
    responseType: 'concise',
    temperature: 0.7
  });

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchSources();
      fetchTeams();
    }
  }, [token]);

  const fetchUserProfile = async () => {
    try {
      const response = await fetch('/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        // Token is invalid
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleLogout();
    }
  };

  const fetchSources = async () => {
    try {
      let url = '/data-sources';
      if (currentContext !== 'personal') {
        url = `/teams/${currentContext}/data-sources`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setSources(data);
        // Select all active sources by default
        setSelectedSources(data.filter(s => s.is_active).map(s => s.id));
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch('/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setSources([]);
    setTeams([]);
    setSelectedSources([]);
    setCurrentContext('personal');
  };

  const handleContextChange = (newContext) => {
    setCurrentContext(newContext);
    setSelectedSources([]);
  };

  useEffect(() => {
    if (token && currentContext) {
      fetchSources();
    }
  }, [currentContext]);

  if (!token || !user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header user={user} onLogout={handleLogout} />
      
      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-80 space-y-4">
            {/* Tab Navigation */}
            <div className="bg-white rounded-lg shadow-sm border">
              <div className="flex border-b">
                <button
                  onClick={() => setActiveTab('chat')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                    activeTab === 'chat' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <MessageSquare size={16} />
                  Chat
                </button>
                <button
                  onClick={() => setActiveTab('sources')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                    activeTab === 'sources' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Database size={16} />
                  Sources
                </button>
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                    activeTab === 'teams' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users size={16} />
                  Teams
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium ${
                    activeTab === 'settings' 
                      ? 'text-blue-600 border-b-2 border-blue-600' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Settings size={16} />
                  Settings
                </button>
              </div>
            </div>

            {/* Context Selector */}
            <ContextSelector
              currentContext={currentContext}
              teams={teams}
              onContextChange={handleContextChange}
            />

            {/* Tab Content */}
            <div className="bg-white rounded-lg shadow-sm border p-4">
              {activeTab === 'sources' && (
                <SourceSelector
                  sources={sources}
                  selectedSources={selectedSources}
                  onSourcesChange={setSelectedSources}
                  onRefresh={fetchSources}
                  token={token}
                  currentContext={currentContext}
                />
              )}
              {activeTab === 'teams' && (
                <TeamManager
                  token={token}
                  onRefresh={() => {
                    fetchTeams();
                    fetchSources();
                  }}
                />
              )}
              {activeTab === 'settings' && (
                <SettingsPanel
                  settings={settings}
                  onSettingsChange={setSettings}
                />
              )}
              {activeTab === 'chat' && (
                <div className="text-sm text-gray-600">
                  <div className="mb-3">
                    <p className="font-medium mb-1">
                      Context: {currentContext === 'personal' ? 'Personal' : teams.find(t => t.id === currentContext)?.display_name}
                    </p>
                  </div>
                  <p className="mb-2">Selected Sources:</p>
                  <div className="space-y-1">
                    {selectedSources.length > 0 ? (
                      selectedSources.map(sourceId => {
                        const source = sources.find(s => s.id === sourceId);
                        return source ? (
                          <div key={sourceId} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                            {source.display_name}
                          </div>
                        ) : null;
                      })
                    ) : (
                      <p className="text-gray-400">No sources selected</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className="flex-1">
            <ChatInterface
              selectedSources={selectedSources}
              settings={settings}
              token={token}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;