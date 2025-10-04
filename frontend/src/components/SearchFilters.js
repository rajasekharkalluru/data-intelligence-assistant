import { Calendar, Database, Filter, X } from 'lucide-react';
import { useState } from 'react';

function SearchFilters({ onFilterChange, sources, darkMode }) {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    sourceTypes: [],
    dateRange: 'all',
    customStartDate: '',
    customEndDate: ''
  });

  const sourceTypes = ['confluence', 'jira', 'bitbucket', 'slack'];
  
  const dateRanges = [
    { value: 'all', label: 'All Time' },
    { value: 'today', label: 'Today' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'custom', label: 'Custom Range' }
  ];

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  const handleSourceTypeToggle = (type) => {
    const newTypes = filters.sourceTypes.includes(type)
      ? filters.sourceTypes.filter(t => t !== type)
      : [...filters.sourceTypes, type];
    handleFilterChange('sourceTypes', newTypes);
  };

  const clearFilters = () => {
    const emptyFilters = {
      sourceTypes: [],
      dateRange: 'all',
      customStartDate: '',
      customEndDate: ''
    };
    setFilters(emptyFilters);
    onFilterChange(emptyFilters);
  };

  const hasActiveFilters = filters.sourceTypes.length > 0 || filters.dateRange !== 'all';

  return (
    <div className="relative">
      {/* Filter Toggle Button */}
      <button
        onClick={() => setShowFilters(!showFilters)}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors ${
          darkMode
            ? 'bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600'
            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
        } ${hasActiveFilters ? 'ring-2 ring-blue-500' : ''}`}
      >
        <Filter className="w-4 h-4" />
        <span className="text-sm font-medium">Filters</span>
        {hasActiveFilters && (
          <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
            {filters.sourceTypes.length + (filters.dateRange !== 'all' ? 1 : 0)}
          </span>
        )}
      </button>

      {/* Filter Panel */}
      {showFilters && (
        <div className={`absolute top-full left-0 mt-2 w-80 rounded-lg border shadow-lg z-50 ${
          darkMode
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}>
          <div className={`flex items-center justify-between p-4 border-b ${
            darkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
              Search Filters
            </h3>
            <button
              onClick={() => setShowFilters(false)}
              className={`p-1 rounded hover:bg-gray-100 ${
                darkMode ? 'hover:bg-gray-700 text-gray-400' : 'text-gray-500'
              }`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {/* Source Types */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Database className="w-4 h-4" />
                Source Types
              </label>
              <div className="space-y-2">
                {sourceTypes.map(type => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                      filters.sourceTypes.includes(type)
                        ? darkMode
                          ? 'bg-blue-900 border-blue-700'
                          : 'bg-blue-50 border-blue-200'
                        : darkMode
                          ? 'bg-gray-700 hover:bg-gray-600'
                          : 'bg-gray-50 hover:bg-gray-100'
                    } border`}
                  >
                    <input
                      type="checkbox"
                      checked={filters.sourceTypes.includes(type)}
                      onChange={() => handleSourceTypeToggle(type)}
                      className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span className={`text-sm capitalize ${
                      darkMode ? 'text-gray-300' : 'text-gray-700'
                    }`}>
                      {type}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className={`flex items-center gap-2 text-sm font-medium mb-2 ${
                darkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                <Calendar className="w-4 h-4" />
                Date Range
              </label>
              <select
                value={filters.dateRange}
                onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? 'bg-gray-700 border-gray-600 text-gray-300'
                    : 'bg-white border-gray-200 text-gray-900'
                }`}
              >
                {dateRanges.map(range => (
                  <option key={range.value} value={range.value}>
                    {range.label}
                  </option>
                ))}
              </select>

              {filters.dateRange === 'custom' && (
                <div className="mt-3 space-y-2">
                  <input
                    type="date"
                    value={filters.customStartDate}
                    onChange={(e) => handleFilterChange('customStartDate', e.target.value)}
                    placeholder="Start date"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                  <input
                    type="date"
                    value={filters.customEndDate}
                    onChange={(e) => handleFilterChange('customEndDate', e.target.value)}
                    placeholder="End date"
                    className={`w-full px-3 py-2 rounded-lg border text-sm ${
                      darkMode
                        ? 'bg-gray-700 border-gray-600 text-gray-300'
                        : 'bg-white border-gray-200 text-gray-900'
                    }`}
                  />
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={clearFilters}
                disabled={!hasActiveFilters}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  darkMode
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50'
                } disabled:cursor-not-allowed`}
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchFilters;
