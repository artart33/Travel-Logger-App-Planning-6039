import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { FiMapPin, FiNavigation, FiX, FiCheck, FiSearch, FiTarget, FiSave, FiInfo, FiClock } = FiIcons;

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icon
const customIcon = new L.Icon({
  iconUrl: 'data:image/svg+xml;base64,' + btoa(`
    <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
      <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="#3b82f6"/>
      <circle cx="12.5" cy="12.5" r="7" fill="white"/>
      <circle cx="12.5" cy="12.5" r="4" fill="#3b82f6"/>
    </svg>
  `),
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Draggable marker component
const DraggableMarker = ({ position, setPosition, onLocationSelect }) => {
  const map = useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  const markerRef = useRef(null);

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker) {
        const newPos = [marker.getLatLng().lat, marker.getLatLng().lng];
        setPosition(newPos);
        onLocationSelect(newPos[0], newPos[1]);
      }
    },
  };

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
      icon={customIcon}
    />
  );
};

const ImprovedLocationPicker = ({ isOpen, onClose, onLocationSelect, initialLocation, entryTitle }) => {
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([52.1326, 5.2913]); // Default to Netherlands center
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [recentSearches, setRecentSearches] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [usingCurrentLocation, setUsingCurrentLocation] = useState(false);

  // Initialize with initial location
  useEffect(() => {
    if (isOpen && initialLocation) {
      setSelectedLocationName(initialLocation);
      
      // Try to parse coordinates from initial location string
      const coordMatch = initialLocation.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
      if (coordMatch) {
        const lat = parseFloat(coordMatch[1]);
        const lng = parseFloat(coordMatch[2]);
        if (!isNaN(lat) && !isNaN(lng)) {
          setPosition([lat, lng]);
          setMapCenter([lat, lng]);
          return;
        }
      }
      
      // If not coordinates, geocode the location
      geocodeLocation(initialLocation);
    }
  }, [isOpen, initialLocation]);

  // Load recent searches from localStorage
  useEffect(() => {
    if (isOpen) {
      const savedSearches = localStorage.getItem('recentLocationSearches');
      if (savedSearches) {
        setRecentSearches(JSON.parse(savedSearches).slice(0, 5));
      }
    }
  }, [isOpen]);

  // Save recent searches to localStorage
  const saveRecentSearch = (query) => {
    const updatedSearches = [query, ...recentSearches.filter(item => item !== query)].slice(0, 5);
    setRecentSearches(updatedSearches);
    localStorage.setItem('recentLocationSearches', JSON.stringify(updatedSearches));
  };

  const geocodeLocation = async (locationString) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationString)}&addressdetails=1&limit=1`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'TravelLoggerApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);
          const newPos = [lat, lng];
          setPosition(newPos);
          setMapCenter(newPos);
          
          // Build a detailed address from the response
          const address = data[0].address;
          // Construct detailed address with street-level precision
          const road = address.road || address.street || '';
          const houseNumber = address.house_number || '';
          const suburb = address.suburb || address.neighbourhood || '';
          const city = address.city || address.town || address.village || '';
          const state = address.state || address.county || '';
          const country = address.country || '';

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

          // If we somehow still don't have a location string, use display_name
          if (!locationString) {
            locationString = data[0].display_name;
          }

          setSelectedLocationName(locationString);
        } else {
          setError('No results found');
        }
      } else {
        setError('Failed to search location');
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setError('An error occurred while searching');
    } finally {
      setIsLoading(false);
    }
  };

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    
    try {
      // Using Nominatim for geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=5`,
        {
          headers: {
            'Accept-Language': 'en',
            'User-Agent': 'TravelLoggerApp/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          // Format search results
          const formattedResults = data.map(item => {
            return {
              display_name: item.display_name,
              lat: parseFloat(item.lat),
              lon: parseFloat(item.lon),
            };
          });
          
          setSearchResults(formattedResults);
          
          // Automatically select first result
          const firstResult = formattedResults[0];
          setPosition([firstResult.lat, firstResult.lon]);
          setMapCenter([firstResult.lat, firstResult.lon]);
          setSelectedLocationName(firstResult.display_name);
          
          // Save to recent searches
          saveRecentSearch(searchQuery);
        } else {
          setError('No results found');
        }
      }
    } catch (error) {
      console.error('Search error:', error);
      setError('An error occurred while searching');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectSearchResult = (result) => {
    setPosition([result.lat, result.lon]);
    setMapCenter([result.lat, result.lon]);
    setSelectedLocationName(result.display_name);
    setSearchResults([]);
    saveRecentSearch(searchQuery);
  };

  const handleRecentSearchClick = (search) => {
    setSearchQuery(search);
    geocodeLocation(search);
  };

  const reverseGeocode = async (lat, lng) => {
    try {
      // Use OpenStreetMap Nominatim for detailed reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&zoom=18`,
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
          locationString = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }

        return locationString;
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
    }

    return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
  };

  const handleLocationSelect = async (lat, lng) => {
    const locationName = await reverseGeocode(lat, lng);
    setSelectedLocationName(locationName);
  };

  const handleConfirm = () => {
    if (position && selectedLocationName) {
      onLocationSelect(selectedLocationName, position);
      onClose();
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser');
      return;
    }
    
    setUsingCurrentLocation(true);
    setError(null);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const newPos = [latitude, longitude];
        setPosition(newPos);
        setMapCenter(newPos);
        
        // Get location name from coordinates
        const locationName = await reverseGeocode(latitude, longitude);
        setSelectedLocationName(locationName);
        setUsingCurrentLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setUsingCurrentLocation(false);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setError('Location access denied by user');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Location information unavailable');
            break;
          case error.TIMEOUT:
            setError('Location request timed out');
            break;
          default:
            setError('An unknown error occurred');
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
        className="bg-white rounded-xl w-full max-w-4xl h-[80vh] shadow-2xl flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Update Location</h3>
            <p className="text-sm text-gray-600 mt-1">
              For: <span className="font-medium">{entryTitle}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <SafeIcon icon={FiX} className="text-xl" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <SafeIcon 
                icon={isSearching ? FiNavigation : FiSearch} 
                className={`absolute left-3 top-3 text-gray-400 ${isSearching ? 'animate-spin' : ''}`} 
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Search for a specific address or location..."
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
                  {searchResults.map((result, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectSearchResult(result)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors first:rounded-t-lg last:rounded-b-lg border-b border-gray-100 last:border-b-0"
                    >
                      <div className="flex items-center space-x-2">
                        <SafeIcon icon={FiMapPin} className="text-primary-500 text-sm flex-shrink-0" />
                        <span className="text-sm text-gray-900 line-clamp-2">{result.display_name}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
            <button
              onClick={getCurrentLocation}
              disabled={usingCurrentLocation}
              className="px-3 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Use current location"
            >
              <SafeIcon 
                icon={FiTarget} 
                className={`text-primary-500 ${usingCurrentLocation ? 'animate-spin' : ''}`} 
              />
            </button>
          </div>

          {/* Recent searches */}
          {recentSearches.length > 0 && (
            <div className="mt-2">
              <div className="flex flex-wrap gap-2">
                {recentSearches.map((search, index) => (
                  <button
                    key={index}
                    onClick={() => handleRecentSearchClick(search)}
                    className="px-2 py-1 bg-gray-100 text-xs rounded-full hover:bg-gray-200 transition-colors flex items-center space-x-1"
                  >
                    <SafeIcon icon={FiClock} className="text-gray-500" />
                    <span className="truncate max-w-[120px]">{search}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected location */}
          {selectedLocationName && (
            <div className="mt-2 p-2 bg-primary-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMapPin} className="text-primary-500" />
                <span className="text-sm text-primary-700">{selectedLocationName}</span>
              </div>
            </div>
          )}

          {/* Error message */}
          {error && (
            <div className="mt-2 p-2 bg-red-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiInfo} className="text-red-500" />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg overflow-hidden border relative">
            <MapContainer 
              center={mapCenter} 
              zoom={15} // Higher zoom level for street detail
              style={{ height: '100%', width: '100%' }} 
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker 
                position={position} 
                setPosition={setPosition} 
                onLocationSelect={handleLocationSelect} 
              />
            </MapContainer>
            
            {/* Map instruction overlay */}
            <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-sm rounded-lg p-3 z-[400] shadow-md">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiInfo} className="text-primary-500" />
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Tip:</span> Click anywhere on the map to select a location or drag the marker to fine-tune
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 italic">
              <SafeIcon icon={FiMapPin} className="inline mr-1 text-primary-500" />
              {position ? 'Location selected' : 'No location selected yet'}
            </div>
            <div className="flex space-x-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                disabled={!position || !selectedLocationName}
                className="flex items-center space-x-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <SafeIcon icon={FiSave} />
                <span>Save Location</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ImprovedLocationPicker;