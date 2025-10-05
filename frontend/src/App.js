import { Building2, ChevronDown, Database, LogOut, MessageSquare, Moon, Plus, Settings, Sun, Trash2, UserIcon, Users } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import './App.css';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import AuthForm from './components/AuthForm';
import ChatInterface from './components/ChatInterface';
import DataSourceManager from './components/DataSourceManager';
import Logo from './components/Logo';
import SettingsPanel from './components/SettingsPanel';
import SourceSelector from './components/SourceSelector';
import UserProfile from './components/UserProfile';

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [activeTab, setActiveTab] = useState('chat');
  const [sources, setSources] = useState([]);
  const [teams, setTeams] = useState([]);
  const [selectedSources, setSelectedSources] = useState([]);
  const [currentContext, setCurrentContext] = useState('personal');
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [darkMode, setDarkMode] = useState(localStorage.getItem('darkMode') === 'true');
  const [settings, setSettings] = useState({
    responseType: 'concise',
    temperature: 0.7
  });
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('llama3.2');
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [newTeamData, setNewTeamData] = useState({ name: '', display_name: '', description: '' });
  const [settingsTab, setSettingsTab] = useState('ai');

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem('darkMode', newMode);
  };

  const handleLogout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    setSources([]);
    setTeams([]);
    setSelectedSources([]);
    setCurrentContext('personal');
  }, []);

  const fetchUserProfile = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        console.warn('Invalid or expired token, logging out');
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      handleLogout();
    }
  }, [token, handleLogout]);

  const fetchSources = useCallback(async () => {
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
        setSelectedSources(data.filter(s => s.is_active).map(s => s.id));
      }
    } catch (error) {
      console.error('Error fetching sources:', error);
    }
  }, [token, currentContext]);

  const fetchTeams = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/teams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  }, [token]);

  const handleLogin = (newToken, userData) => {
    setToken(newToken);
    setUser(userData);
    localStorage.setItem('token', newToken);
  };

  const handleContextChange = (newContext) => {
    setCurrentContext(newContext);
    setSelectedSources([]);
    setShowContextMenu(false);
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
      fetchTeams();
      loadSessions();
      loadAvailableModels();
    }
  }, [token, fetchUserProfile, fetchTeams]);

  const loadSessions = async () => {
    if (!token) return;
    try {
      const response = await fetch('/chat/sessions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
        
        // Auto-select first session or create new one
        if (data.length > 0) {
          setCurrentSessionId(data[0].id);
        } else {
          createNewSession();
        }
      }
    } catch (error) {
      console.error('Error loading sessions:', error);
    }
  };

  const loadAvailableModels = async () => {
    if (!token) return;
    try {
      const response = await fetch('/models', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setAvailableModels(data.models || []);
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const createNewSession = async () => {
    if (!token) return;
    try {
      const response = await fetch('/chat/sessions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const newSession = await response.json();
        setSessions(prev => [newSession, ...prev]);
        setCurrentSessionId(newSession.id);
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const updateSessionTitle = async (sessionId, newTitle) => {
    if (!token) return;
    try {
      const response = await fetch(`/chat/sessions/${sessionId}?title=${encodeURIComponent(newTitle)}`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSessions(prev => prev.map(s => 
          s.id === sessionId ? { ...s, title: newTitle } : s
        ));
      }
    } catch (error) {
      console.error('Error updating session title:', error);
    }
  };

  const deleteSession = async (sessionId) => {
    if (!token) return;

    try {
      const response = await fetch(`/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        setSessions(prev => prev.filter(s => s.id !== sessionId));
        if (currentSessionId === sessionId) {
          const remaining = sessions.filter(s => s.id !== sessionId);
          if (remaining.length > 0) {
            setCurrentSessionId(remaining[0].id);
          } else {
            createNewSession();
          }
        }
      }
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  useEffect(() => {
    if (token && currentContext) {
      fetchSources();
    }
  }, [currentContext, fetchSources, token]);

  if (!token || !user) {
    return <AuthForm onLogin={handleLogin} />;
  }

  const getContextIcon = () => {
    if (currentContext === 'personal') return <UserIcon className="w-4 h-4" />;
    return <Building2 className="w-4 h-4" />;
  };

  const getContextLabel = () => {
    if (currentContext === 'personal') return 'Personal';
    const team = teams.find(t => t.id === currentContext);
    return team?.display_name || 'Team';
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50';
  const headerBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const sidebarBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const mainBg = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50';

  return (
    <div className={`h-screen flex flex-col ${bgClass}`}>
      {/* Modern Header */}
      <header className={`${headerBg} border-b shadow-sm`}>
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Logo darkMode={darkMode} />

            {/* Right Side Controls */}
            <div className="flex items-center gap-4">
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-colors ${
                  darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                }`}
                title={darkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-400" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600" />
                )}
              </button>

              {/* Context Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowContextMenu(!showContextMenu)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                    darkMode 
                      ? 'bg-gray-700 hover:bg-gray-600 border-gray-600' 
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                  }`}
                >
                  {getContextIcon()}
                  <span className={`text-sm font-medium ${textPrimary}`}>{getContextLabel()}</span>
                  <ChevronDown className={`w-4 h-4 ${textSecondary}`} />
                </button>

                {showContextMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-xl border py-2 z-50 ${
                    darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                  }`}>
                    <button
                      onClick={() => handleContextChange('personal')}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                        currentContext === 'personal'
                          ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'
                          : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <UserIcon className="w-4 h-4" />
                      <span className="font-medium">Personal</span>
                    </button>
                    
                    {teams.length > 0 && (
                      <>
                        <div className={`border-t my-2 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}></div>
                        <div className={`px-4 py-1 text-xs font-semibold uppercase tracking-wide ${textSecondary}`}>Teams</div>
                        {teams.map(team => (
                          <button
                            key={team.id}
                            onClick={() => handleContextChange(team.id)}
                            className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors ${
                              currentContext === team.id
                                ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'
                                : darkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-50'
                            }`}
                          >
                            <Building2 className="w-4 h-4" />
                            <span>{team.display_name}</span>
                          </button>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* User Menu */}
              <div className={`flex items-center gap-3 pl-4 border-l ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="text-right">
                  <p className={`text-sm font-medium ${textPrimary}`}>{user.full_name || user.username}</p>
                  <p className={`text-xs ${textSecondary}`}>{user.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className={`p-2 rounded-lg transition-colors group ${
                    darkMode ? 'hover:bg-red-900' : 'hover:bg-red-50'
                  }`}
                  title="Logout"
                >
                  <LogOut className={`w-5 h-5 ${darkMode ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-400 group-hover:text-red-600'}`} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside className={`w-80 ${sidebarBg} border-r flex flex-col`}>
          {/* Tab Navigation - Fixed */}
          <div className={`border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'} flex-shrink-0`}>
            <nav className="flex">
              {[
                { id: 'chat', icon: MessageSquare, label: 'Chat' },
                { id: 'sources', icon: Database, label: 'Sources' },
                { id: 'teams', icon: Users, label: 'Teams' },
                { id: 'settings', icon: Settings, label: 'Settings' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex items-center justify-center gap-2 px-2 py-3 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? darkMode
                        ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-700'
                        : 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                      : darkMode
                        ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content - Scrollable */}
          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === 'chat' && (
              <div className="space-y-4">
                {/* New Chat Button */}
                <button
                  onClick={createNewSession}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Chat</span>
                </button>

                {/* Model Selector */}
                <div className={`rounded-xl p-3 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <label className={`text-xs font-semibold mb-2 block ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>AI Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-medium ${
                      darkMode 
                        ? 'bg-gray-800 border-gray-600 text-gray-200' 
                        : 'bg-gray-50 border-gray-200 text-gray-900'
                    }`}
                  >
                    {availableModels.map(model => (
                      <option key={model.name} value={model.name}>{model.name}</option>
                    ))}
                  </select>
                </div>

                {/* Chat History */}
                <div className={`rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xs font-semibold px-3 pt-3 pb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Chat History</h3>
                  <div className="max-h-64 overflow-y-auto px-2 pb-2">
                    {sessions.map(session => (
                      <button
                        key={session.id}
                        onClick={() => setCurrentSessionId(session.id)}
                        onDoubleClick={() => {
                          const newTitle = prompt('Enter new title:', session.title);
                          if (newTitle && newTitle !== session.title) {
                            updateSessionTitle(session.id, newTitle);
                          }
                        }}
                        className={`w-full flex items-center gap-2 px-2 py-2 rounded-lg mb-1 transition-colors group ${
                          currentSessionId === session.id
                            ? darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-50 text-blue-600'
                            : darkMode ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100'
                        }`}
                        title="Double-click to rename"
                      >
                        <MessageSquare className="w-3 h-3 flex-shrink-0" />
                        <div className="flex-1 text-left min-w-0">
                          <p className="text-xs font-medium truncate">{session.title}</p>
                          <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>{session.message_count} msgs</p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm('Delete this conversation?')) {
                              deleteSession(session.id);
                            }
                          }}
                          className={`opacity-0 group-hover:opacity-100 p-1 rounded transition-opacity ${
                            darkMode ? 'hover:bg-red-900 text-red-400' : 'hover:bg-red-50 text-red-600'
                          }`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Active Context */}
                <div className={`rounded-xl p-3 border ${
                  darkMode 
                    ? 'bg-gradient-to-br from-blue-900 to-indigo-900 border-blue-800' 
                    : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100'
                }`}>
                  <h3 className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Context</h3>
                  <div className={`flex items-center gap-2 ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    {getContextIcon()}
                    <span className="text-sm font-medium">{getContextLabel()}</span>
                  </div>
                </div>

                {/* Selected Sources */}
                <div className={`rounded-xl p-3 border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xs font-semibold mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Sources</h3>
                  {selectedSources.length > 0 ? (
                    <div className="space-y-1">
                      {selectedSources.map(sourceId => {
                        const source = sources.find(s => s.id === sourceId);
                        return source ? (
                          <div key={sourceId} className={`flex items-center gap-2 px-2 py-1 rounded-lg border ${
                            darkMode 
                              ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-800' 
                              : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                          }`}>
                            <Database className={`w-3 h-3 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <span className={`text-xs font-medium ${darkMode ? 'text-blue-300' : 'text-blue-900'}`}>{source.display_name}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  ) : (
                    <p className={`text-xs italic ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>No sources selected</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'sources' && (
              <div className="space-y-6">
                {/* Source Selection */}
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Select Active Sources
                  </h3>
                  <SourceSelector
                    sources={sources}
                    selectedSources={selectedSources}
                    onSourcesChange={setSelectedSources}
                    onRefresh={fetchSources}
                    token={token}
                    currentContext={currentContext}
                    darkMode={darkMode}
                  />
                </div>

                {/* Sync Status */}
                <div>
                  <h3 className={`text-sm font-semibold mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Sync Status
                  </h3>
                  <DataSourceManager
                    token={token}
                    darkMode={darkMode}
                    currentContext={currentContext}
                  />
                </div>
              </div>
            )}

            {activeTab === 'teams' && (
              <div className="space-y-4">
                {/* Create Team Button */}
                <button
                  onClick={() => setShowTeamModal(true)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Team</span>
                </button>

                {/* Teams List */}
                <div className={`rounded-xl border ${darkMode ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}>
                  <h3 className={`text-xs font-semibold px-3 pt-3 pb-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Your Teams</h3>
                  <div className="px-2 pb-2 space-y-1">
                    {teams.length > 0 ? (
                      teams.map(team => (
                        <div
                          key={team.id}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                            darkMode ? 'bg-gray-600' : 'bg-gray-50'
                          }`}
                        >
                          <Building2 className={`w-4 h-4 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-medium truncate ${darkMode ? 'text-gray-200' : 'text-gray-900'}`}>
                              {team.display_name}
                            </p>
                            <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {team.member_count} members
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className={`text-xs text-center py-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        No teams yet
                      </p>
                    )}
                  </div>
                </div>

                {/* Info */}
                <div className={`rounded-xl p-3 border ${
                  darkMode ? 'bg-blue-900 border-blue-800' : 'bg-blue-50 border-blue-200'
                }`}>
                  <p className={`text-xs ${darkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                    💡 Switch to team context from the dropdown in the header to use team resources.
                  </p>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Settings Tabs */}
                <div className={`flex gap-2 border-b ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                  <button
                    onClick={() => setSettingsTab('ai')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      settingsTab === 'ai'
                        ? darkMode
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : darkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-200'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    AI Settings
                  </button>
                  <button
                    onClick={() => setSettingsTab('profile')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      settingsTab === 'profile'
                        ? darkMode
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : darkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-200'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setSettingsTab('analytics')}
                    className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                      settingsTab === 'analytics'
                        ? darkMode
                          ? 'border-blue-400 text-blue-400'
                          : 'border-blue-600 text-blue-600'
                        : darkMode
                          ? 'border-transparent text-gray-400 hover:text-gray-200'
                          : 'border-transparent text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Analytics
                  </button>
                </div>

                {/* Settings Content */}
                {settingsTab === 'ai' && (
                  <SettingsPanel
                    settings={settings}
                    onSettingsChange={setSettings}
                    darkMode={darkMode}
                  />
                )}
                
                {settingsTab === 'profile' && (
                  <UserProfile
                    user={user}
                    token={token}
                    darkMode={darkMode}
                    onUpdate={fetchUserProfile}
                  />
                )}
                
                {settingsTab === 'analytics' && (
                  <AnalyticsDashboard
                    token={token}
                    darkMode={darkMode}
                  />
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className={`flex-1 flex flex-col ${mainBg}`}>
          <ChatInterface
            selectedSources={selectedSources}
            settings={settings}
            token={token}
            darkMode={darkMode}
            sessions={sessions}
            currentSessionId={currentSessionId}
            setCurrentSessionId={setCurrentSessionId}
            onNewSession={createNewSession}
            onDeleteSession={deleteSession}
            selectedModel={selectedModel}
            setSelectedModel={setSelectedModel}
            availableModels={availableModels}
          />
        </main>
      </div>

      {/* Team Creation Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className={`rounded-2xl max-w-md w-full p-6 shadow-2xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-xl font-bold mb-2 ${textPrimary}`}>Create New Team</h3>
            <p className={`text-sm mb-6 ${textSecondary}`}>Create a team to collaborate with your colleagues</p>
            
            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Team Name (ID)</label>
                <input
                  type="text"
                  value={newTeamData.name}
                  onChange={(e) => setNewTeamData({...newTeamData, name: e.target.value.toLowerCase().replace(/\s+/g, '-')})}
                  placeholder="engineering-team"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Display Name</label>
                <input
                  type="text"
                  value={newTeamData.display_name}
                  onChange={(e) => setNewTeamData({...newTeamData, display_name: e.target.value})}
                  placeholder="Engineering Team"
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Description (Optional)</label>
                <textarea
                  value={newTeamData.description}
                  onChange={(e) => setNewTeamData({...newTeamData, description: e.target.value})}
                  placeholder="What is this team for?"
                  rows={3}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    darkMode ? 'bg-gray-700 border-gray-600 text-gray-200' : 'bg-white border-gray-200 text-gray-900'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowTeamModal(false);
                    setNewTeamData({ name: '', display_name: '', description: '' });
                  }}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                    darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                  }`}
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (!newTeamData.name || !newTeamData.display_name) {
                      alert('Please fill in required fields');
                      return;
                    }
                    try {
                      const response = await fetch('/teams', {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify(newTeamData)
                      });
                      if (response.ok) {
                        await fetchTeams();
                        setShowTeamModal(false);
                        setNewTeamData({ name: '', display_name: '', description: '' });
                      } else {
                        const error = await response.json();
                        alert(`Error: ${error.detail}`);
                      }
                    } catch (error) {
                      alert('Error creating team');
                    }
                  }}
                  disabled={!newTeamData.name || !newTeamData.display_name}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 font-medium shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Team
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
