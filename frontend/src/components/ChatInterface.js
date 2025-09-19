import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, ExternalLink } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatInterface = ({ selectedSources, settings, token }) => {
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
      const response = await fetch('/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: inputValue,
          sources: selectedSources.length > 0 ? selectedSources : null,
          response_type: settings.responseType,
          temperature: settings.temperature
        })
      });

      const data = await response.json();

      const assistantMessage = {
        id: Date.now() + 1,
        type: 'assistant',
        content: data.answer,
        sources: data.sources,
        processingTime: data.processing_time,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: 'Sorry, I encountered an error while processing your request.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border h-[calc(100vh-200px)] flex flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 Hello! I'm your Developer Intelligence Assistant</p>
            <p>Ask me anything about your connected data sources.</p>
          </div>
        )}

        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-3xl rounded-lg px-4 py-2 ${
              message.type === 'user' 
                ? 'bg-blue-600 text-white' 
                : message.type === 'error'
                ? 'bg-red-100 text-red-800 border border-red-200'
                : 'bg-gray-100 text-gray-900'
            }`}>
              {message.type === 'user' ? (
                <p>{message.content}</p>
              ) : (
                <div>
                  <ReactMarkdown className="prose prose-sm max-w-none">
                    {message.content}
                  </ReactMarkdown>
                  
                  {message.sources && message.sources.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-gray-200">
                      <p className="text-xs font-medium text-gray-600 mb-2">Sources:</p>
                      <div className="space-y-2">
                        {message.sources.map((source, index) => (
                          <div key={index} className="flex items-start gap-2 text-xs">
                            <div className="flex-1">
                              <a
                                href={source.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                              >
                                {source.title}
                                <ExternalLink size={12} />
                              </a>
                              <p className="text-gray-600 mt-1">{source.snippet}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="px-1.5 py-0.5 bg-gray-200 text-gray-700 rounded text-xs">
                                  {source.source_type}
                                </span>
                                <span className="text-gray-500">
                                  {Math.round(source.confidence * 100)}% match
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      {message.processingTime && (
                        <p className="text-xs text-gray-500 mt-2">
                          Processed in {message.processingTime.toFixed(2)}s
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 flex items-center gap-2">
              <Loader2 className="animate-spin" size={16} />
              <span className="text-gray-600">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything about your codebase..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <Send size={16} />
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;