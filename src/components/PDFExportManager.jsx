import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';
import { downloadPDF, getUniqueDates } from '../utils/pdfGenerator';

const { FiDownload, FiCalendar, FiMapPin, FiFile, FiImage, FiMap, FiCheckCircle, FiAlertCircle, FiSettings, FiFileText } = FiIcons;

const PDFExportManager = ({ isOpen, onClose }) => {
  const { entries } = useTravelContext();
  const [selectedDates, setSelectedDates] = useState(new Set());
  const [exportOptions, setExportOptions] = useState({
    includePhotos: true,
    includeMaps: true,
    includeStats: true
  });
  const [exportStatus, setExportStatus] = useState(null);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [dateStats, setDateStats] = useState({});
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (isOpen && entries.length > 0) {
      const dates = getUniqueDates(entries);
      setUniqueDates(dates);

      // Calculate stats for each date
      const stats = {};
      dates.forEach(date => {
        const dayEntries = entries.filter(entry => entry.date === date);
        stats[date] = {
          total: dayEntries.length,
          withPhotos: dayEntries.filter(e => e.photos && e.photos.length > 0).length,
          withCoordinates: dayEntries.filter(e => 
            e.coordinates || e.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/)
          ).length,
          types: {
            food: dayEntries.filter(e => e.type === 'food').length,
            accommodation: dayEntries.filter(e => e.type === 'accommodation').length,
            route: dayEntries.filter(e => e.type === 'route').length,
            attraction: dayEntries.filter(e => e.type === 'attraction').length,
          }
        };
      });
      setDateStats(stats);
    }
  }, [isOpen, entries]);

  const handleDateToggle = (date) => {
    const newSelected = new Set(selectedDates);
    if (newSelected.has(date)) {
      newSelected.delete(date);
    } else {
      newSelected.add(date);
    }
    setSelectedDates(newSelected);
  };

  const selectAllDates = () => {
    setSelectedDates(new Set(uniqueDates));
  };

  const clearSelection = () => {
    setSelectedDates(new Set());
  };

  const handleOptionChange = (option) => {
    setExportOptions(prev => ({
      ...prev,
      [option]: !prev[option]
    }));
  };

  const exportSingleDate = async (date) => {
    setIsExporting(true);
    try {
      setExportStatus({ type: 'loading', message: 'Generating PDF...' });
      
      await downloadPDF(entries, {
        selectedDate: date,
        ...exportOptions,
        title: `Travel Log - ${new Date(date).toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}`
      });

      setExportStatus({ 
        type: 'success', 
        message: `PDF exported successfully for ${new Date(date).toLocaleDateString()}` 
      });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('PDF export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: 'Failed to export PDF: ' + error.message 
      });
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const exportSelectedDates = async () => {
    if (selectedDates.size === 0) return;

    setIsExporting(true);
    try {
      setExportStatus({ type: 'loading', message: 'Generating PDF files...' });

      for (const date of selectedDates) {
        await downloadPDF(entries, {
          selectedDate: date,
          ...exportOptions,
          title: `Travel Log - ${new Date(date).toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}`
        });
        
        // Small delay between downloads to avoid browser blocking
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setExportStatus({ 
        type: 'success', 
        message: `${selectedDates.size} PDF files exported successfully` 
      });
      setSelectedDates(new Set());
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Batch PDF export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: 'Failed to export some PDF files: ' + error.message 
      });
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const exportAllEntries = async () => {
    setIsExporting(true);
    try {
      setExportStatus({ type: 'loading', message: 'Generating complete PDF...' });
      
      await downloadPDF(entries, {
        ...exportOptions,
        title: 'Complete Travel Log'
      });

      setExportStatus({ 
        type: 'success', 
        message: 'Complete PDF exported successfully' 
      });
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      console.error('Complete PDF export error:', error);
      setExportStatus({ 
        type: 'error', 
        message: 'Failed to export complete PDF: ' + error.message 
      });
      setTimeout(() => setExportStatus(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const getTypeIcon = (type) => {
    const icons = {
      food: FiIcons.FiCoffee,
      accommodation: FiIcons.FiHome,
      route: FiIcons.FiNavigation,
      attraction: FiIcons.FiCamera
    };
    return icons[type] || FiMapPin;
  };

  const getTypeColor = (type) => {
    const colors = {
      food: 'text-orange-500',
      accommodation: 'text-blue-500',
      route: 'text-green-500',
      attraction: 'text-purple-500'
    };
    return colors[type] || 'text-gray-500';
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">PDF Export Manager</h3>
            <p className="text-sm text-gray-600 mt-1">
              Export your travel entries as comprehensive PDF documents
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SafeIcon icon={FiIcons.FiX} className="text-xl" />
          </button>
        </div>

        {/* Status Messages */}
        {exportStatus && (
          <div className={`mx-6 mt-4 p-3 rounded-lg ${
            exportStatus.type === 'success' 
              ? 'bg-green-50 text-green-700' 
              : exportStatus.type === 'error' 
              ? 'bg-red-50 text-red-700' 
              : 'bg-blue-50 text-blue-700'
          }`}>
            <div className="flex items-center space-x-2">
              <SafeIcon 
                icon={
                  exportStatus.type === 'success' 
                    ? FiCheckCircle 
                    : exportStatus.type === 'error' 
                    ? FiAlertCircle 
                    : FiIcons.FiLoader
                } 
                className={exportStatus.type === 'loading' ? 'animate-spin' : ''} 
              />
              <span className="text-sm">{exportStatus.message}</span>
            </div>
          </div>
        )}

        {/* Export Options */}
        <div className="p-6 border-b bg-gray-50">
          <h4 className="text-sm font-medium text-gray-900 mb-3 flex items-center">
            <SafeIcon icon={FiSettings} className="mr-2" />
            Export Options
          </h4>
          <div className="grid grid-cols-3 gap-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.includePhotos}
                onChange={() => handleOptionChange('includePhotos')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiImage} className="text-sm text-gray-600" />
                <span className="text-sm text-gray-700">Include Photos</span>
              </div>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.includeMaps}
                onChange={() => handleOptionChange('includeMaps')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiMap} className="text-sm text-gray-600" />
                <span className="text-sm text-gray-700">Include Maps</span>
              </div>
            </label>
            
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={exportOptions.includeStats}
                onChange={() => handleOptionChange('includeStats')}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <div className="flex items-center space-x-1">
                <SafeIcon icon={FiFileText} className="text-sm text-gray-600" />
                <span className="text-sm text-gray-700">Include Statistics</span>
              </div>
            </label>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="p-6 border-b">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Quick Export</h4>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={exportAllEntries}
              disabled={isExporting}
              className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiFileText} />
              <span>Export All Entries</span>
            </button>
            
            {selectedDates.size > 0 && (
              <button
                onClick={exportSelectedDates}
                disabled={isExporting}
                className="flex items-center space-x-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiDownload} />
                <span>Export Selected ({selectedDates.size})</span>
              </button>
            )}
            
            <button
              onClick={selectAllDates}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Select All
            </button>
            
            {selectedDates.size > 0 && (
              <button
                onClick={clearSelection}
                disabled={isExporting}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Clear Selection
              </button>
            )}
          </div>
        </div>

        {/* Date List */}
        <div className="flex-1 overflow-y-auto">
          {uniqueDates.length === 0 ? (
            <div className="text-center py-12">
              <SafeIcon icon={FiFile} className="text-6xl text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No entries to export</h3>
              <p className="text-gray-600">Add some travel entries to generate PDF files</p>
            </div>
          ) : (
            <div className="p-6">
              <h4 className="text-sm font-medium text-gray-900 mb-4">
                Export by Date ({uniqueDates.length} days available)
              </h4>
              <div className="space-y-3">
                {uniqueDates.map((date) => {
                  const stats = dateStats[date] || { total: 0, withPhotos: 0, withCoordinates: 0, types: {} };
                  const isSelected = selectedDates.has(date);
                  
                  return (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`border rounded-lg p-4 transition-all ${
                        isSelected 
                          ? 'border-primary-300 bg-primary-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleDateToggle(date)}
                            disabled={isExporting}
                            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500 disabled:opacity-50"
                          />
                          <div>
                            <div className="flex items-center space-x-2">
                              <SafeIcon icon={FiCalendar} className="text-primary-500" />
                              <span className="font-medium text-gray-900">
                                {new Date(date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                              <span>{stats.total} entries</span>
                              {stats.withPhotos > 0 && (
                                <div className="flex items-center space-x-1">
                                  <SafeIcon icon={FiImage} className="text-xs" />
                                  <span>{stats.withPhotos} with photos</span>
                                </div>
                              )}
                              {stats.withCoordinates > 0 && (
                                <div className="flex items-center space-x-1">
                                  <SafeIcon icon={FiMap} className="text-xs" />
                                  <span>{stats.withCoordinates} with maps</span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                              {Object.entries(stats.types).map(([type, count]) => {
                                if (count === 0) return null;
                                return (
                                  <div key={type} className="flex items-center space-x-1">
                                    <SafeIcon 
                                      icon={getTypeIcon(type)} 
                                      className={`text-xs ${getTypeColor(type)}`} 
                                    />
                                    <span>{count}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => exportSingleDate(date)}
                          disabled={isExporting}
                          className="flex items-center space-x-2 px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <SafeIcon icon={FiDownload} className="text-xs" />
                          <span>Export</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <SafeIcon icon={FiIcons.FiInfo} className="inline mr-1" />
              PDF files include detailed information, photos, maps, and statistics
            </div>
            <button
              onClick={onClose}
              disabled={isExporting}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Close
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PDFExportManager;