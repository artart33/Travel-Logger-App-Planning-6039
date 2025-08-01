import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';
import KMLManager from './KMLManager';
import PDFExportManager from './PDFExportManager';

const { FiArrowLeft, FiDownload, FiUpload, FiTrash2, FiUser, FiSettings: FiSettingsIcon, FiInfo, FiGlobe, FiFileText } = FiIcons;

const Settings = () => {
  const navigate = useNavigate();
  const { entries, clearAllEntries, isStorageAvailable } = useTravelContext();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [importError, setImportError] = useState(null);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [showKMLManager, setShowKMLManager] = useState(false);
  const [showPDFManager, setShowPDFManager] = useState(false);

  const exportData = () => {
    try {
      const dataStr = JSON.stringify(entries, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'travel-log-export.json';
      link.click();
      URL.revokeObjectURL(url);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 3000);
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export data');
    }
  };

  const importData = (event) => {
    const file = event.target.files[0];
    setImportError(null);
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          if (Array.isArray(importedData)) {
            localStorage.setItem('travelEntries', JSON.stringify(importedData));
            window.location.reload();
          } else {
            setImportError('Invalid data format. Expected an array of entries.');
          }
        } catch (error) {
          console.error('Import error:', error);
          setImportError('Failed to import data. The file may be corrupted or in the wrong format.');
        }
      };
      reader.readAsText(file);
    }
  };

  const clearAllData = () => {
    clearAllEntries();
    setShowDeleteConfirm(false);
  };

  const settingsItems = [
    {
      title: 'Export Data (JSON)',
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
    },
    {
      title: 'Export PDF Documents',
      description: 'Generate comprehensive PDF reports with photos and maps',
      icon: FiFileText,
      action: () => setShowPDFManager(true),
      color: 'text-red-600'
    },
    {
      title: 'Export KML Files',
      description: 'Generate KML files for Google Earth',
      icon: FiGlobe,
      action: () => setShowKMLManager(true),
      color: 'text-purple-600'
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
            Capture and organize your travel memories with ease. Log food, accommodations, routes, and attractions all in one place.
          </p>

          {/* Storage Status */}
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2">
              <SafeIcon
                icon={FiIcons.FiDatabase}
                className={isStorageAvailable ? "text-green-500" : "text-red-500"}
              />
              <div>
                <p className="text-sm font-medium">
                  {isStorageAvailable ? "Local storage is working properly" : "Local storage is not available"}
                </p>
                <p className="text-xs text-gray-500">
                  {isStorageAvailable ? "Your travel entries are saved automatically" : "Your data may not be saved between sessions"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Data Management */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 shadow-sm border"
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Management</h3>

          {exportSuccess && (
            <div className="mb-4 p-3 bg-green-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiIcons.FiCheck} className="text-green-500" />
                <p className="text-sm text-green-700">Data exported successfully!</p>
              </div>
            </div>
          )}

          {importError && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiIcons.FiAlertTriangle} className="text-red-500" />
                <p className="text-sm text-red-700">{importError}</p>
              </div>
            </div>
          )}

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

        {/* PDF Export Info */}
        {entries.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-gradient-to-r from-red-50 to-pink-50 rounded-xl p-6 shadow-sm border border-red-200"
          >
            <div className="flex items-start space-x-4">
              <div className="bg-red-500 rounded-lg p-3">
                <SafeIcon icon={FiFileText} className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Export Available</h3>
                <p className="text-gray-700 mb-3">
                  Generate comprehensive PDF documents with photos, maps, statistics, and detailed information about your travels.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Available dates:</span> {[...new Set(entries.map(e => e.date))].length}
                  </div>
                  <div>
                    <span className="font-medium">Total entries:</span> {entries.length}
                  </div>
                  <div>
                    <span className="font-medium">With photos:</span> {entries.filter(e => e.photos && e.photos.length > 0).length}
                  </div>
                  <div>
                    <span className="font-medium">With locations:</span> {entries.filter(e => e.coordinates || e.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)).length}
                  </div>
                </div>
                <button
                  onClick={() => setShowPDFManager(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <SafeIcon icon={FiFileText} />
                  <span>Manage PDF Exports</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* KML Export Info */}
        {entries.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl p-6 shadow-sm border border-purple-200"
          >
            <div className="flex items-start space-x-4">
              <div className="bg-purple-500 rounded-lg p-3">
                <SafeIcon icon={FiGlobe} className="text-white text-xl" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">KML Export Available</h3>
                <p className="text-gray-700 mb-3">
                  Export your travel entries as KML files to view them in Google Earth, Google Maps, or other mapping applications.
                </p>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="font-medium">Available dates:</span> {[...new Set(entries.map(e => e.date))].length}
                  </div>
                  <div>
                    <span className="font-medium">Total entries:</span> {entries.length}
                  </div>
                </div>
                <button
                  onClick={() => setShowKMLManager(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                >
                  <SafeIcon icon={FiGlobe} />
                  <span>Manage KML Exports</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Statistics */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25 }}
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

      {/* KML Manager Modal */}
      <KMLManager isOpen={showKMLManager} onClose={() => setShowKMLManager(false)} />

      {/* PDF Export Manager Modal */}
      <PDFExportManager isOpen={showPDFManager} onClose={() => setShowPDFManager(false)} />
    </motion.div>
  );
};

export default Settings;