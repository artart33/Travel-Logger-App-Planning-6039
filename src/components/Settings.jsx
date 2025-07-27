import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';

const { FiArrowLeft, FiDownload, FiUpload, FiTrash2, FiUser, FiSettings: FiSettingsIcon, FiInfo } = FiIcons;

const Settings = () => {
  const navigate = useNavigate();
  const { entries, deleteEntry } = useTravelContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const exportData = () => {
    const dataStr = JSON.stringify(entries, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'travel-log-export.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          localStorage.setItem('travelEntries', JSON.stringify(importedData));
          window.location.reload();
        } catch (error) {
          alert('Invalid file format');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    localStorage.removeItem('travelEntries');
    window.location.reload();
  };

  const settingsItems = [
    {
      title: 'Export Data',
      description: 'Download your travel data as JSON',
      icon: FiDownload,
      action: exportData,
      color: 'text-blue-600'
    },
    {
      title: 'Import Data',
      description: 'Upload and restore your travel data',
      icon: FiUpload,
      action: () => document.getElementById('import-file').click(),
      color: 'text-green-600'
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="text-xl" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* App Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <div className="flex items-center space-x-4 mb-4">
            <div className="bg-primary-500 rounded-lg p-3">
              <SafeIcon icon={FiIcons.FiCompass} className="text-white text-xl" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Travel Logger</h3>
              <p className="text-gray-600">Version 1.0.0</p>
            </div>
          </div>
          <p className="text-gray-700">
            Capture and organize your travel memories with ease. Log diners, accommodations, 
            routes, and attractions all in one place.
          </p>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>
          <div className="space-y-3">
            {settingsItems.map((item, index) => (
              <button
                key={item.title}
                onClick={item.action}
                className="w-full flex items-center space-x-4 p-4 rounded-lg border hover:bg-gray-50 transition-colors text-left"
              >
                <SafeIcon icon={item.icon} className={`text-xl ${item.color}`} />
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{item.title}</div>
                  <div className="text-sm text-gray-600">{item.description}</div>
                </div>
                <SafeIcon icon={FiIcons.FiChevronRight} className="text-gray-400" />
              </button>
            ))}
          </div>
          
          <input
            id="import-file"
            type="file"
            accept=".json"
            onChange={importData}
            className="hidden"
          />
        </motion.div>

        {/* Statistics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistics</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-primary-600">{entries.length}</div>
              <div className="text-sm text-gray-600">Total Entries</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-accent-600">
                {[...new Set(entries.map(e => e.location))].length}
              </div>
              <div className="text-sm text-gray-600">Locations Visited</div>
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        {entries.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border border-red-200"
          >
            <h3 className="text-lg font-semibold text-red-600 mb-4">Danger Zone</h3>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700 transition-colors"
              >
                <SafeIcon icon={FiTrash2} />
                <span>Clear All Data</span>
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-red-700">
                  Are you sure? This will permanently delete all your travel entries.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={clearAllData}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                  >
                    Yes, Delete All
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Settings;