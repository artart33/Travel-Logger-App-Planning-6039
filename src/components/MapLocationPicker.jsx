import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { motion } from 'framer-motion';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { FiMapPin, FiNavigation, FiX, FiCheck, FiSearch } = FiIcons;

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

const LocationMarker = ({ position, setPosition, onLocationSelect }) => {
  const map = useMapEvents({
    click(e) {
      const newPos = [e.latlng.lat, e.latlng.lng];
      setPosition(newPos);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  useEffect(() => {
    if (position) {
      map.flyTo(position, map.getZoom());
    }
  }, [position, map]);

  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  );
};

const MapLocationPicker = ({ isOpen, onClose, onLocationSelect, initialLocation, currentLocation }) => {
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocationName, setSelectedLocationName] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (currentLocation) {
        const [lat, lng] = currentLocation;
        setMapCenter([lat, lng]);
        setPosition([lat, lng]);
      } else if (initialLocation) {
        // Try to parse coordinates from initial location string
        const coordMatch = initialLocation.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (coordMatch) {
          const lat = parseFloat(coordMatch[1]);
          const lng = parseFloat(coordMatch[2]);
          setMapCenter([lat, lng]);
          setPosition([lat, lng]);
        }
      }
    }
  }, [isOpen, currentLocation, initialLocation]);

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

  const searchLocation = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      // Using Nominatim for geocoding with more detailed parameters
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&limit=1`,
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
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      searchLocation();
    }
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
          <h3 className="text-lg font-semibold text-gray-900">Pick Location on Map</h3>
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
            </div>
            <button
              onClick={searchLocation}
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Search
            </button>
          </div>
          {selectedLocationName && (
            <div className="mt-2 p-2 bg-primary-50 rounded-lg">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMapPin} className="text-primary-500" />
                <span className="text-sm text-primary-700">{selectedLocationName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Map */}
        <div className="flex-1 p-4">
          <div className="h-full rounded-lg overflow-hidden border">
            <MapContainer
              center={mapCenter}
              zoom={15} // Higher zoom level for street detail
              style={{ height: '100%', width: '100%' }}
              className="rounded-lg"
            >
              <TileLayer
                attribution='&copy;<a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <LocationMarker
                position={position}
                setPosition={setPosition}
                onLocationSelect={handleLocationSelect}
              />
            </MapContainer>
          </div>
        </div>

        {/* Instructions & Actions */}
        <div className="p-6 border-t bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              <SafeIcon icon={FiMapPin} className="inline mr-1" />
              Click anywhere on the map to select a precise location
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
                <SafeIcon icon={FiCheck} />
                <span>Use This Location</span>
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MapLocationPicker;