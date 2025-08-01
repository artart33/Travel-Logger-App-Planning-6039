import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';

const { FiPlus, FiMap, FiBookOpen, FiSettings, FiMapPin, FiCompass, FiGlobe, FiFileText } = FiIcons;

const HomeScreen = () => {
  const navigate = useNavigate();
  const { entries, loading, error } = useTravelContext();

  // Display a message if there was an error loading entries
  useEffect(() => {
    if (error) {
      console.error("Error loading entries:", error);
      // You could show a toast notification here
    }
  }, [error]);

  const menuItems = [
    {
      title: 'New Entry',
      description: 'Log a new travel experience',
      icon: FiPlus,
      color: 'bg-primary-500',
      path: '/add'
    },
    {
      title: 'Travel History',
      description: `${entries.length} entries logged`,
      icon: FiBookOpen,
      color: 'bg-accent-500',
      path: '/history'
    },
    {
      title: 'Map View',
      description: 'Visualize your journeys',
      icon: FiMap,
      color: 'bg-purple-500',
      path: '/map'
    },
    {
      title: 'Settings',
      description: 'Customize your experience',
      icon: FiSettings,
      color: 'bg-gray-600',
      path: '/settings'
    }
  ];

  const uniqueDates = [...new Set(entries.map(e => e.date))];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100"
    >
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <motion.div
            initial={{ y: -20 }}
            animate={{ y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <SafeIcon icon={FiCompass} className="text-4xl text-primary-500 mr-3" />
              <h1 className="text-3xl font-bold text-gray-900">Travel Logger</h1>
            </div>
            <p className="text-gray-600">Capture and organize your travel memories</p>
          </motion.div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your travel memories...</p>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto px-6 py-6">
          {/* Error State */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-red-500 text-xl" />
                <div>
                  <p className="font-medium text-red-700">Data Loading Error</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Quick Stats */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-primary-600">{entries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-accent-600">
                {entries.filter(e => e.type === 'food').length}
              </div>
              <div className="text-sm text-gray-600">Food</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-purple-600">
                {entries.filter(e => e.type === 'accommodation').length}
              </div>
              <div className="text-sm text-gray-600">Stays</div>
            </div>
            <div className="bg-white rounded-lg p-4 shadow-sm border">
              <div className="text-2xl font-bold text-orange-600">
                {uniqueDates.length}
              </div>
              <div className="text-sm text-gray-600">Travel Days</div>
            </div>
          </motion.div>

          {/* Export Quick Access */}
          {entries.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8"
            >
              {/* KML Export */}
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-4 shadow-sm border border-purple-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiGlobe} className="text-purple-500 text-xl" />
                    <div>
                      <h3 className="font-medium text-gray-900">Export to Google Earth</h3>
                      <p className="text-sm text-gray-600">
                        {uniqueDates.length} days available for KML export
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm"
                  >
                    Export KML
                  </button>
                </div>
              </div>

              {/* PDF Export */}
              <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-4 shadow-sm border border-red-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <SafeIcon icon={FiFileText} className="text-red-500 text-xl" />
                    <div>
                      <h3 className="font-medium text-gray-900">Export to PDF</h3>
                      <p className="text-sm text-gray-600">
                        Create comprehensive travel reports
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/settings')}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                  >
                    Export PDF
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Menu Grid */}
          <div className="grid md:grid-cols-2 gap-6">
            {menuItems.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(item.path)}
                className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`${item.color} rounded-lg p-3 group-hover:scale-110 transition-transform`}>
                    <SafeIcon icon={item.icon} className="text-xl text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {item.title}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {item.description}
                    </p>
                  </div>
                  <SafeIcon icon={FiIcons.FiChevronRight} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Entries Preview */}
          {entries.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="mt-8 bg-white rounded-xl p-6 shadow-sm border"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h3>
              <div className="space-y-3">
                {entries.slice(-3).reverse().map((entry) => (
                  <div key={entry.id} className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50">
                    <SafeIcon icon={FiMapPin} className="text-primary-500" />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{entry.title}</div>
                      <div className="text-sm text-gray-600">{entry.location}</div>
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default HomeScreen;