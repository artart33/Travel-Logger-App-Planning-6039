import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';
import MapLocationPicker from './MapLocationPicker';
import { v4 as uuidv4 } from 'uuid';

const { FiArrowLeft, FiSave, FiMapPin, FiStar, FiCamera, FiCalendar, FiNavigation, FiMap, FiX, FiImage, FiPlus } = FiIcons;

const AddEntry = () => {
  const navigate = useNavigate();
  const { addEntry } = useTravelContext();
  const [formData, setFormData] = useState({
    type: 'diner',
    title: '',
    location: '',
    description: '',
    rating: 5,
    date: new Date().toISOString().split('T')[0],
    photos: [],
    notes: ''
  });
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [currentCoordinates, setCurrentCoordinates] = useState(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState([]);
  const fileInputRef = React.useRef(null);

  const entryTypes = [
    { id: 'diner', label: 'Diner', icon: FiIcons.FiCoffee, color: 'bg-orange-500' },
    { id: 'accommodation', label: 'Stay', icon: FiIcons.FiHome, color: 'bg-blue-500' },
    { id: 'route', label: 'Route', icon: FiIcons.FiNavigation, color: 'bg-green-500' },
    { id: 'attraction', label: 'Attraction', icon: FiIcons.FiCamera, color: 'bg-purple-500' }
  ];

  // Get current location on component mount
  useEffect(() => {
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by this browser');
      return;
    }

    setLocationLoading(true);
    setLocationError('');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setCurrentCoordinates([latitude, longitude]);

        try {
          // Use OpenStreetMap Nominatim for detailed reverse geocoding
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1&zoom=18`,
            {
              headers: {
                'Accept-Language': 'en',
                'User-Agent': 'TravelLoggerApp/1.0'
              }
            }
          );

          if (response.ok) {
            const data = await response.json();
            
            // Construct detailed address with street-level precision
            const road = data.address.road || data.address.street || '';
            const houseNumber = data.address.house_number || '';
            const suburb = data.address.suburb || data.address.neighbourhood || '';
            const city = data.address.city || data.address.town || data.address.village || '';
            const state = data.address.state || data.address.county || '';
            const country = data.address.country || '';
            
            // Build the address with as much detail as available
            let locationString = '';
            
            if (road) {
              locationString += road;
              if (houseNumber) locationString += ' ' + houseNumber;
            }
            
            if (suburb && suburb !== road) {
              if (locationString) locationString += ', ';
              locationString += suburb;
            }
            
            if (city && !locationString.includes(city)) {
              if (locationString) locationString += ', ';
              locationString += city;
            }
            
            if (state && !locationString.includes(state)) {
              if (locationString) locationString += ', ';
              locationString += state;
            }
            
            if (country && !locationString.includes(country)) {
              if (locationString) locationString += ', ';
              locationString += country;
            }
            
            // If we somehow still don't have a location string, use coordinates
            if (!locationString) {
              locationString = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
            }
            
            handleInputChange('location', locationString);
          } else {
            // Fallback to coordinates if geocoding fails
            handleInputChange('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          // Fallback to coordinates
          handleInputChange('location', `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
        }

        setLocationLoading(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location access denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out');
            break;
          default:
            setLocationError('An unknown error occurred');
            break;
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutes
      }
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.location.trim()) return;
    addEntry(formData);
    navigate('/');
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMapLocationSelect = (locationName, coordinates) => {
    handleInputChange('location', locationName);
    setCurrentCoordinates(coordinates);
  };

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Process each file
    const newPhotos = [...formData.photos];
    const newPhotoUrls = [...photoPreviewUrls];

    files.forEach(file => {
      // Create a unique ID for the photo
      const photoId = uuidv4();

      // Create object URL for preview
      const photoUrl = URL.createObjectURL(file);

      // Read file as Data URL for storage
      const reader = new FileReader();
      reader.onload = (e) => {
        // Add to photos array with metadata
        newPhotos.push({
          id: photoId,
          dataUrl: e.target.result,
          name: file.name,
          type: file.type,
          size: file.size,
          createdAt: new Date().toISOString()
        });

        // Update state after all files are processed
        if (newPhotos.length === formData.photos.length + files.length) {
          handleInputChange('photos', newPhotos);
          setPhotoPreviewUrls(newPhotoUrls);
        }
      };

      // Add to preview URLs
      newPhotoUrls.push({
        id: photoId,
        url: photoUrl
      });

      // Start reading the file
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (photoId) => {
    // Remove from photos array
    const updatedPhotos = formData.photos.filter(photo => photo.id !== photoId);
    handleInputChange('photos', updatedPhotos);

    // Remove from preview URLs and revoke object URL to free memory
    const photoToRemove = photoPreviewUrls.find(p => p.id === photoId);
    if (photoToRemove) {
      URL.revokeObjectURL(photoToRemove.url);
    }
    const updatedPreviewUrls = photoPreviewUrls.filter(p => p.id !== photoId);
    setPhotoPreviewUrls(updatedPreviewUrls);
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
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="text-xl" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">New Entry</h1>
            <button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || !formData.location.trim()}
              className="flex items-center space-x-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={FiSave} />
              <span>Save</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Entry Type Selection */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Entry Type</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {entryTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleInputChange('type', type.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    formData.type === type.id
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className={`${type.color} rounded-lg p-2 mx-auto mb-2 w-fit`}>
                    <SafeIcon icon={type.icon} className="text-white text-xl" />
                  </div>
                  <div className="text-sm font-medium text-gray-900">{type.label}</div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Basic Information */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Enter a title for this entry"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <div className="relative">
                  <SafeIcon
                    icon={locationLoading ? FiNavigation : FiMapPin}
                    className={`absolute left-3 top-3.5 text-gray-400 ${
                      locationLoading ? 'animate-spin' : ''
                    }`}
                  />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    placeholder={locationLoading ? "Getting your location..." : "Street, City, Country"}
                    className="w-full pl-10 pr-32 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                    required
                  />
                  <div className="absolute right-2 top-2 flex space-x-1">
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={locationLoading}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors disabled:opacity-50"
                      title="Get current location"
                    >
                      <SafeIcon
                        icon={FiNavigation}
                        className={`text-sm ${locationLoading ? 'animate-spin' : ''}`}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowMapPicker(true)}
                      className="p-2 text-gray-400 hover:text-primary-500 transition-colors"
                      title="Pick location on map"
                    >
                      <SafeIcon icon={FiMap} className="text-sm" />
                    </button>
                  </div>
                </div>
                {locationError && (
                  <p className="text-sm text-red-600 mt-1">{locationError}</p>
                )}
                {locationLoading && (
                  <p className="text-sm text-primary-600 mt-1">
                    📍 Detecting your location...
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Use the GPS button for current location or the map button to pick a location manually
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <div className="relative">
                  <SafeIcon icon={FiCalendar} className="absolute left-3 top-3.5 text-gray-400" />
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => handleInputChange('date', e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Photos */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Photos</h3>
              <span className="text-xs text-gray-500">
                {formData.photos.length} / 5 photos
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-4">
              {/* Photo Previews */}
              {formData.photos.map(photo => (
                <div
                  key={photo.id}
                  className="aspect-square rounded-lg border border-gray-200 overflow-hidden relative group"
                >
                  <img
                    src={photo.dataUrl}
                    alt={photo.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    className="absolute top-1 right-1 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <SafeIcon icon={FiX} className="text-sm" />
                  </button>
                </div>
              ))}

              {/* Add Photo Button */}
              {formData.photos.length < 5 && (
                <button
                  type="button"
                  onClick={() => fileInputRef.current.click()}
                  className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center hover:border-primary-400 transition-colors"
                >
                  <SafeIcon icon={FiPlus} className="text-2xl text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500">Add Photo</span>
                </button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple={formData.photos.length < 5}
              onChange={handlePhotoUpload}
              className="hidden"
              max={5}
            />
            <p className="text-xs text-gray-500">
              <SafeIcon icon={FiImage} className="inline mr-1" /> Add up to 5 photos to remember this experience
            </p>
          </motion.div>

          {/* Rating */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Rating</h3>
            <div className="flex items-center space-x-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => handleInputChange('rating', star)}
                  className={`text-2xl transition-colors ${
                    star <= formData.rating ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  <SafeIcon icon={FiStar} />
                </button>
              ))}
              <span className="ml-3 text-gray-600">{formData.rating}/5</span>
            </div>
          </motion.div>

          {/* Description & Notes */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-xl p-6 shadow-sm border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe your experience..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Additional Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Any additional notes or memories..."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none"
                />
              </div>
            </div>
          </motion.div>
        </form>
      </div>

      {/* Map Location Picker Modal */}
      <MapLocationPicker
        isOpen={showMapPicker}
        onClose={() => setShowMapPicker(false)}
        onLocationSelect={handleMapLocationSelect}
        initialLocation={formData.location}
        currentLocation={currentCoordinates}
      />
    </motion.div>
  );
};

export default AddEntry;