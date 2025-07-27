import React, { useState } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';

const { FiMapPin, FiNavigation, FiSave, FiX, FiSearch } = FiIcons;

const LocationEditor = ({ entry, onSave, onCancel }) => {
  const [location, setLocation] = useState(entry.location);
  const [searching, setSearching] = useState(false);
  const [suggestions, setSuggestions] = useState([]);

  const handleLocationSearch = async (query) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearching(true);
    
    // Mock location suggestions - in a real app, you'd use a geocoding service
    const mockSuggestions = [
      `${query}, United States`,
      `${query}, Canada`,
      `${query}, United Kingdom`,
      `${query}, Australia`,
      `${query}, Germany`
    ].filter(suggestion => 
      suggestion.toLowerCase().includes(query.toLowerCase())
    );

    setTimeout(() => {
      setSuggestions(mockSuggestions);
      setSearching(false);
    }, 300);
  };

  const handleSave = () => {
    if (location.trim()) {
      onSave(location.trim());
    }
  };

  const selectSuggestion = (suggestion) => {
    setLocation(suggestion);
    setSuggestions([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Edit Location</h3>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SafeIcon icon={FiX} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Entry
            </label>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{entry.title}</div>
              <div className="text-sm text-gray-600">{entry.location}</div>
            </div>
          </div>

          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Location
            </label>
            <div className="relative">
              <SafeIcon 
                icon={searching ? FiNavigation : FiMapPin} 
                className={`absolute left-3 top-3 text-gray-400 ${searching ? 'animate-spin' : ''}`} 
              />
              <input
                type="text"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  handleLocationSearch(e.target.value);
                }}
                placeholder="Enter new location"
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                autoFocus
              />
            </div>

            {/* Location Suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => selectSuggestion(suggestion)}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg"
                  >
                    <div className="flex items-center space-x-2">
                      <SafeIcon icon={FiSearch} className="text-gray-400 text-sm" />
                      <span className="text-sm text-gray-900">{suggestion}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleSave}
              disabled={!location.trim()}
              className="flex-1 flex items-center justify-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiSave} />
              <span>Save Changes</span>
            </button>
            <button
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default LocationEditor;