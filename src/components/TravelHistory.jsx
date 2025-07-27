import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';
import LocationEditor from './LocationEditor';

const { FiArrowLeft, FiSearch, FiFilter, FiMapPin, FiStar, FiCalendar, FiTrash2, FiEdit2, FiImage } = FiIcons;

const TravelHistory = () => {
  const navigate = useNavigate();
  const { entries, deleteEntry, updateEntry } = useTravelContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [editingEntry, setEditingEntry] = useState(null);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const entryTypeIcons = {
    diner: FiIcons.FiCoffee,
    accommodation: FiIcons.FiHome,
    route: FiIcons.FiNavigation,
    attraction: FiIcons.FiCamera
  };

  const entryTypeColors = {
    diner: 'bg-orange-100 text-orange-700',
    accommodation: 'bg-blue-100 text-blue-700',
    route: 'bg-green-100 text-green-700',
    attraction: 'bg-purple-100 text-purple-700'
  };

  const filteredEntries = entries
    .filter(entry => {
      const matchesSearch = 
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
        entry.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterType === 'all' || entry.type === filterType;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this entry?')) {
      deleteEntry(id);
    }
  };

  const handleLocationEdit = (entry, e) => {
    e.stopPropagation();
    setEditingEntry(entry);
  };

  const handleLocationSave = (newLocation) => {
    updateEntry(editingEntry.id, { location: newLocation });
    setEditingEntry(null);
  };

  const handleLocationCancel = () => {
    setEditingEntry(null);
  };

  const openPhotoModal = (entry, index = 0) => {
    setSelectedEntry(entry);
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedEntry(null);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (selectedEntry && selectedEntry.photos.length > 0) {
      setCurrentPhotoIndex((currentPhotoIndex + 1) % selectedEntry.photos.length);
    }
  };

  const prevPhoto = () => {
    if (selectedEntry && selectedEntry.photos.length > 0) {
      setCurrentPhotoIndex((currentPhotoIndex - 1 + selectedEntry.photos.length) % selectedEntry.photos.length);
    }
  };

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
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="text-xl" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Travel History</h1>
            <div className="w-16"></div>
          </div>
          
          {/* Search and Filter */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <SafeIcon icon={FiSearch} className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search entries..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
            >
              <option value="all">All Types</option>
              <option value="diner">Diners</option>
              <option value="accommodation">Stays</option>
              <option value="route">Routes</option>
              <option value="attraction">Attractions</option>
            </select>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        {filteredEntries.length === 0 ? (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-center py-12"
          >
            <SafeIcon icon={FiMapPin} className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No entries found</h3>
            <p className="text-gray-600">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filter'
                : 'Start logging your travels to see them here'}
            </p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredEntries.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white rounded-xl p-6 shadow-sm border hover:shadow-md transition-all cursor-pointer group"
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-3 rounded-lg ${entryTypeColors[entry.type]}`}>
                    <SafeIcon icon={entryTypeIcons[entry.type]} className="text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {entry.title}
                        </h3>
                        <div className="flex items-center text-gray-600 mb-2 group">
                          <SafeIcon icon={FiMapPin} className="mr-1" />
                          <span className="text-sm flex-1">{entry.location}</span>
                          <button
                            onClick={(e) => handleLocationEdit(entry, e)}
                            className="ml-2 opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-primary-500 transition-all"
                            title="Edit location"
                          >
                            <SafeIcon icon={FiEdit2} className="text-sm" />
                          </button>
                        </div>
                        {entry.description && (
                          <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                            {entry.description}
                          </p>
                        )}
                        
                        {/* Photos Preview */}
                        {entry.photos && entry.photos.length > 0 && (
                          <div className="mb-3">
                            <div className="flex items-center space-x-2 mb-2">
                              <SafeIcon icon={FiImage} className="text-gray-400" />
                              <span className="text-sm text-gray-600">{entry.photos.length} photos</span>
                            </div>
                            <div className="flex space-x-2 overflow-x-auto pb-2">
                              {entry.photos.map((photo, photoIndex) => (
                                <div 
                                  key={photo.id} 
                                  className="h-16 w-16 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border border-gray-200"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openPhotoModal(entry, photoIndex);
                                  }}
                                >
                                  <img 
                                    src={photo.dataUrl} 
                                    alt={photo.name || "Travel photo"}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <div className="flex items-center">
                            <SafeIcon icon={FiCalendar} className="mr-1" />
                            {new Date(entry.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <SafeIcon icon={FiStar} className="mr-1 text-yellow-400" />
                            {entry.rating}/5
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDelete(entry.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-500 transition-all"
                      >
                        <SafeIcon icon={FiTrash2} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Location Editor Modal */}
      {editingEntry && (
        <LocationEditor
          entry={editingEntry}
          onSave={handleLocationSave}
          onCancel={handleLocationCancel}
        />
      )}

      {/* Photo Viewer Modal */}
      {showPhotoModal && selectedEntry && selectedEntry.photos.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
        >
          <div className="relative w-full max-w-3xl">
            {/* Close button */}
            <button
              onClick={closePhotoModal}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70 transition-all z-10"
            >
              <SafeIcon icon={FiIcons.FiX} className="text-xl" />
            </button>
            
            {/* Photo container */}
            <div className="relative aspect-[4/3] bg-black rounded-lg overflow-hidden">
              <img
                src={selectedEntry.photos[currentPhotoIndex].dataUrl}
                alt={selectedEntry.photos[currentPhotoIndex].name || "Travel photo"}
                className="w-full h-full object-contain"
              />
            </div>
            
            {/* Navigation buttons */}
            {selectedEntry.photos.length > 1 && (
              <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    prevPhoto();
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                >
                  <SafeIcon icon={FiIcons.FiChevronLeft} className="text-xl" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    nextPhoto();
                  }}
                  className="p-2 rounded-full bg-black bg-opacity-50 text-white hover:bg-opacity-70 transition-all"
                >
                  <SafeIcon icon={FiIcons.FiChevronRight} className="text-xl" />
                </button>
              </div>
            )}
            
            {/* Caption */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent text-white">
              <h3 className="text-lg font-medium">{selectedEntry.title}</h3>
              <p className="text-sm opacity-90">
                {selectedEntry.location} · Photo {currentPhotoIndex + 1} of {selectedEntry.photos.length}
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default TravelHistory;