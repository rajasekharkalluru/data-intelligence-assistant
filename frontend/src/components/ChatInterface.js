import { ExternalLink, Loader2, Send, Sparkles, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import branding from '../config/branding';

const ChatInterface = ({ selectedSources, settings, token, darkMode, sessions, currentSessionId, setCurrentSessionId, onNewSession, onDeleteSession, selectedModel, setSelectedModel, availableModels }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId && token) {
      loadSessionMessages(currentSessionId);
    }
  }, [currentSessionId, token]);

  const loadSessionMessages = async (sessionId) => {
    try {
      const response = await fetch(`/chat/sessions/${sessionId}/messages`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        const formattedMessages = data.map(msg => ({
          id: msg.id,
          type: msg.type,
          content: msg.content,
          sources: msg.sources?.sources || [],
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          query: inputValue,
          sourceIds: selectedSources.length > 0 ? selectedSources : null,
          responseType: settings.responseType,
          temperature: settings.temperature,
          sessionId: currentSessionId,
          model: selectedModel
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log('Chat response:', data); // Debug log

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.response || data.answer || 'No response received',
        sources: data.sources || [],
        processingTime: data.processing_time || data.processingTime,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Sorry, I encountered an error: ${error.message}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-800';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const cardBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';
  const inputBg = darkMode ? 'bg-gray-800 border-gray-700 text-gray-100' : 'bg-white border-gray-200 text-gray-900';
  const sidebarBg = darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200';

  return (
    <div className={`h-full flex flex-col ${bgClass}`}>
        {/* Header with Filters */}
        {messages.length > 0 && (
          <div className={`border-b px-6 py-3 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
            <div className="max-w-4xl mx-auto flex items-center justify-between">
              <div className={`text-sm ${textSecondary}`}>
                {messages.length} messages
              </div>
            </div>
          </div>
        )}
        
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          {messages.length === 0 && (
            <div className="max-w-3xl mx-auto text-center mt-20">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h2 className={`text-3xl font-bold mb-3 ${textPrimary}`}>
                Hello! I'm your AI Assistant
              </h2>
              <p className={`text-lg mb-8 ${textSecondary}`}>
                {branding.appDescription}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                <button
                  onClick={() => setInputValue("How do I deploy the application?")}
                  className={`p-4 rounded-xl border hover:border-blue-300 hover:shadow-md transition-all text-left group ${cardBg}`}
                >
                  <p className={`text-sm font-medium group-hover:text-blue-600 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    How do I deploy the application?
                  </p>
                </button>
                <button
                  onClick={() => setInputValue("What are the main features?")}
                  className={`p-4 rounded-xl border hover:border-blue-300 hover:shadow-md transition-all text-left group ${cardBg}`}
                >
                  <p className={`text-sm font-medium group-hover:text-blue-600 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    What are the main features?
                  </p>
                </button>
                <button
                  onClick={() => setInputValue("Show me the API documentation")}
                  className={`p-4 rounded-xl border hover:border-blue-300 hover:shadow-md transition-all text-left group ${cardBg}`}
                >
                  <p className={`text-sm font-medium group-hover:text-blue-600 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Show me the API documentation
                  </p>
                </button>
                <button
                  onClick={() => setInputValue("How do I configure data sources?")}
                  className={`p-4 rounded-xl border hover:border-blue-300 hover:shadow-md transition-all text-left group ${cardBg}`}
                >
                  <p className={`text-sm font-medium group-hover:text-blue-600 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    How do I configure data sources?
                  </p>
                </button>
              </div>
            </div>
          )}

          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div key={message.id} className={`flex gap-4 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar */}
                {message.type === 'user' ? (
                  <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                    <User className="w-5 h-5 text-white" />
                  </div>
                ) : (
                  <div className="flex-shrink-0 w-10 h-10 shadow-lg">
                    <LogoIcon size="w-5 h-5" className="w-full h-full rounded-full" />
                  </div>
                )}

                {/* Message Content */}
                <div className={`flex-1 ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block max-w-3xl rounded-2xl px-5 py-3 ${
                    message.type === 'user'
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                      : message.type === 'error'
                      ? darkMode ? 'bg-red-900 text-red-200 border-2 border-red-800' : 'bg-red-50 text-red-800 border-2 border-red-200'
                      : darkMode ? 'bg-gray-800 text-gray-100 shadow-md border border-gray-700' : 'bg-white text-gray-900 shadow-md border border-gray-100'
                  }`}>
                    {message.type === 'user' ? (
                      <p className="text-base">{message.content}</p>
                    ) : (
                      <div>
                        {message.content ? (
                          <ReactMarkdown className={`prose prose-sm max-w-none ${
                            darkMode 
                              ? 'prose-invert prose-headings:text-gray-100 prose-p:text-gray-300 prose-a:text-blue-400 prose-strong:text-gray-100 prose-code:text-pink-400 prose-code:bg-pink-900 prose-code:px-1 prose-code:py-0.5 prose-code:rounded'
                              : 'prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600 prose-strong:text-gray-900 prose-code:text-pink-600 prose-code:bg-pink-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded'
                          }`}>
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            No content available
                          </p>
                        )}
                        
                        {message.sources && message.sources.length > 0 && (
                          <div className={`mt-5 pt-4 border-t ${darkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              📚 Sources
                            </p>
                            <div className="space-y-3">
                              {message.sources.map((source, index) => (
                                <div key={index} className={`rounded-lg p-3 border ${
                                  darkMode 
                                    ? 'bg-gradient-to-r from-blue-900 to-indigo-900 border-blue-800' 
                                    : 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-100'
                                }`}>
                                  <a
                                    href={source.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={`text-sm font-semibold flex items-center gap-1.5 mb-1 ${
                                      darkMode ? 'text-blue-300 hover:text-blue-200' : 'text-blue-700 hover:text-blue-900'
                                    }`}
                                  >
                                    {source.title}
                                    <ExternalLink className="w-3 h-3" />
                                  </a>
                                  <p className={`text-xs mb-2 line-clamp-2 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{source.snippet}</p>
                                  <div className="flex items-center gap-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                                      darkMode 
                                        ? 'bg-gray-800 text-blue-300 border-blue-700' 
                                        : 'bg-white text-blue-700 border-blue-200'
                                    }`}>
                                      {source.source_type}
                                    </span>
                                    <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {Math.round(source.confidence * 100)}% match
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                            {message.processingTime && (
                              <p className={`text-xs mt-3 flex items-center gap-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Sparkles className="w-3 h-3" />
                                Processed in {message.processingTime.toFixed(2)}s
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <p className={`text-xs mt-1 px-1 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                    {message.timestamp.toLocaleTimeString()}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-4">
                <div className="flex-shrink-0 w-10 h-10 shadow-lg">
                  <LogoIcon size="w-5 h-5" className="w-full h-full rounded-full" />
                </div>
                <div className={`rounded-2xl px-5 py-3 shadow-md border ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-center gap-2">
                    <Loader2 className="animate-spin w-4 h-4 text-blue-600" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Thinking...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className={`border-t px-6 py-4 ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'}`}>
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything..."
                className={`flex-1 px-5 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${inputBg} ${darkMode ? 'placeholder-gray-500' : 'placeholder-gray-400'}`}
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>
      </div>
  );
};

export default ChatInterface;
