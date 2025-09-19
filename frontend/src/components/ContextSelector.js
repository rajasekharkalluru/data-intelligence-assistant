import React from 'react';
import { User, Users } from 'lucide-react';

const ContextSelector = ({ currentContext, teams, onContextChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-3">Context</h3>
      
      <div className="space-y-2">
        {/* Personal Context */}
        <button
          onClick={() => onContextChange('personal')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
            currentContext === 'personal'
              ? 'bg-blue-100 text-blue-900 border border-blue-200'
              : 'hover:bg-gray-50 text-gray-700'
          }`}
        >
          <User size={16} />
          <span className="font-medium">Personal</span>
        </button>

        {/* Team Contexts */}
        {teams.map((team) => (
          <button
            key={team.id}
            onClick={() => onContextChange(team.id)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
              currentContext === team.id
                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <Users size={16} />
            <div className="flex-1 min-w-0">
              <div className="font-medium truncate">{team.display_name}</div>
              <div className="text-xs text-gray-500">
                {team.member_count} members • {team.data_source_count} sources
              </div>
            </div>
          </button>
        ))}
      </div>

      {teams.length === 0 && (
        <div className="text-center text-gray-500 py-4">
          <p className="text-sm">No teams yet</p>
        </div>
      )}
    </div>
  );
};

export default ContextSelector;