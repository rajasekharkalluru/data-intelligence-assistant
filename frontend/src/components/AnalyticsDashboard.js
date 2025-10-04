import { BarChart3, Clock, Database, MessageSquare, TrendingUp } from 'lucide-react';
import { useEffect, useState } from 'react';

function AnalyticsDashboard({ token, darkMode }) {
  const [stats, setStats] = useState({
    totalMessages: 0,
    totalSessions: 0,
    activeSources: 0,
    avgResponseTime: 0,
    recentQueries: [],
    sourceUsage: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, [token]);

  const loadAnalytics = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/analytics/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }) => (
    <div className={`p-6 rounded-xl border ${
      darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
    }`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <TrendingUp className={`w-5 h-5 ${darkMode ? 'text-green-400' : 'text-green-600'}`} />
      </div>
      <p className={`text-3xl font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
        {value}
      </p>
      <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
        {label}
      </p>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Analytics Dashboard
        </h2>
        <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
          Track your usage and insights
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={MessageSquare}
          label="Total Messages"
          value={stats.totalMessages}
          color="bg-blue-500"
        />
        <StatCard
          icon={BarChart3}
          label="Chat Sessions"
          value={stats.totalSessions}
          color="bg-purple-500"
        />
        <StatCard
          icon={Database}
          label="Active Sources"
          value={stats.activeSources}
          color="bg-green-500"
        />
        <StatCard
          icon={Clock}
          label="Avg Response Time"
          value={`${stats.avgResponseTime}s`}
          color="bg-orange-500"
        />
      </div>

      {/* Recent Queries */}
      <div className={`p-6 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Recent Queries
        </h3>
        {stats.recentQueries.length > 0 ? (
          <div className="space-y-3">
            {stats.recentQueries.map((query, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg ${
                  darkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}
              >
                <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  {query.text}
                </p>
                <p className={`text-xs mt-1 ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {new Date(query.timestamp).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No recent queries
          </p>
        )}
      </div>

      {/* Source Usage */}
      <div className={`p-6 rounded-xl border ${
        darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Source Usage
        </h3>
        {stats.sourceUsage.length > 0 ? (
          <div className="space-y-3">
            {stats.sourceUsage.map((source, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    {source.name}
                  </span>
                  <span className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {source.count} queries
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div
                    className="h-full bg-blue-500 rounded-full transition-all"
                    style={{ width: `${(source.count / stats.totalMessages) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
            No source usage data
          </p>
        )}
      </div>
    </div>
  );
}

export default AnalyticsDashboard;
