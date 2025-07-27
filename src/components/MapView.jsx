import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { FiArrowLeft, FiMapPin, FiNavigation, FiInfo, FiEdit2, FiSave, FiX } = FiIcons;

// Fix for default markers in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons for different entry types
const createCustomIcon = (color) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="25" height="41" viewBox="0 0 25 41" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.5 0C5.6 0 0 5.6 0 12.5c0 12.5 12.5 28.5 12.5 28.5s12.5-16 12.5-28.5C25 5.6 19.4 0 12.5 0z" fill="${color}"/>
        <circle cx="12.5" cy="12.5" r="7" fill="white"/>
        <circle cx="12.5" cy="12.5" r="4" fill="${color}"/>
      </svg>
    `)}`,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });
};

// Custom component to fit map bounds to all markers
const MapBoundsManager = ({ coordinates }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      // Create a bounds object
      const bounds = L.latLngBounds(coordinates);
      
      // Fit the map to these bounds with some padding
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16, // Limit max zoom to keep context
        animate: true
      });
    }
  }, [coordinates, map]);
  
  return null;
};

const MapView = () => {
  const navigate = useNavigate();
  const { entries, updateEntry } = useTravelContext();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [mapCenter, setMapCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [mapZoom, setMapZoom] = useState(2); // Start zoomed out to see global view
  const [markerCoordinates, setMarkerCoordinates] = useState([]);
  const mapRef = useRef(null);

  const entryTypeColors = {
    diner: '#f97316', // orange-500
    accommodation: '#3b82f6', // blue-500
    route: '#22c55e', // green-500
    attraction: '#a855f7', // purple-500
  };

  const entryTypeIcons = {
    diner: FiIcons.FiCoffee,
    accommodation: FiIcons.FiHome,
    route: FiIcons.FiNavigation,
    attraction: FiIcons.FiCamera,
  };

  const entryTypeColorClasses = {
    diner: 'bg-orange-500',
    accommodation: 'bg-blue-500',
    route: 'bg-green-500',
    attraction: 'bg-purple-500',
  };

  // Process all entries to get their coordinates
  useEffect(() => {
    if (entries.length > 0) {
      const coordinates = entries.map(entry => getLocationCoordinates(entry));
      setMarkerCoordinates(coordinates);
    }
  }, [entries]);

  // Get user's current location for map centering if no entries
  useEffect(() => {
    if (entries.length === 0 && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setMapZoom(10); // Zoom in when we get the user's location
        },
        (error) => {
          console.log('Could not get location:', error);
        }
      );
    }
  }, [entries]);

  const handleLocationEdit = (entry) => {
    setEditingEntry(entry);
    setNewLocation(entry.location);
  };

  const saveLocationEdit = () => {
    if (editingEntry && newLocation.trim()) {
      updateEntry(editingEntry.id, { location: newLocation.trim() });
      setEditingEntry(null);
      setNewLocation('');
    }
  };

  const cancelLocationEdit = () => {
    setEditingEntry(null);
    setNewLocation('');
  };

  // Extract coordinates from location string or generate mock coordinates
  const getLocationCoordinates = (entry) => {
    // If the entry already has coordinates, use those
    if (entry.coordinates) {
      return entry.coordinates;
    }

    // Try to parse coordinates from location string (format: "lat,lng")
    const coordMatch = entry.location.match(/(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }

    // Generate mock coordinates based on entry id for demo purposes
    // In a real app, you would use a geocoding service
    const hash = entry.id.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return [
      mapCenter[0] + (hash % 100) / 500 * (hash % 2 === 0 ? 1 : -1),
      mapCenter[1] + ((hash * 2) % 100) / 500 * (hash % 3 === 0 ? 1 : -1)
    ];
  };

  // Group entries by location for the sidebar
  const locationGroups = entries.reduce((groups, entry) => {
    if (!groups[entry.location]) {
      groups[entry.location] = [];
    }
    groups[entry.location].push(entry);
    return groups;
  }, {});

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50"
    >
      {/* Header */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <SafeIcon icon={FiArrowLeft} className="text-xl" />
              <span>Back</span>
            </button>
            <h1 className="text-xl font-semibold text-gray-900">Map View</h1>
            <div className="w-16"></div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-6">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Map Area */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="bg-white rounded-xl shadow-sm border overflow-hidden"
            >
              <div className="h-96 lg:h-[500px] relative">
                <MapContainer
                  center={mapCenter}
                  zoom={mapZoom}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                  ref={mapRef}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {entries.map((entry) => {
                    const coordinates = getLocationCoordinates(entry);
                    const icon = createCustomIcon(entryTypeColors[entry.type]);
                    
                    return (
                      <Marker 
                        key={entry.id}
                        position={coordinates}
                        icon={icon}
                        eventHandlers={{
                          click: () => {
                            setSelectedEntry(entry);
                          }
                        }}
                      >
                        <Popup>
                          <div className="p-1">
                            <h3 className="font-medium">{entry.title}</h3>
                            <p className="text-sm text-gray-600">{entry.location}</p>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  
                  {/* Add the bounds manager component */}
                  {markerCoordinates.length > 0 && (
                    <MapBoundsManager coordinates={markerCoordinates} />
                  )}
                </MapContainer>

                {/* Map Title */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiNavigation} className="text-primary-500" />
                    <span className="text-sm font-medium text-gray-900">Your Travel Map</span>
                  </div>
                </div>

                {/* Empty state - shown when map is loaded but no entries */}
                {entries.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                      <SafeIcon icon={FiNavigation} className="text-6xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No locations yet</h3>
                      <p className="text-gray-600">Start adding entries to see them on the map</p>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Legend */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Legend</h3>
              <div className="space-y-3">
                {Object.entries(entryTypeColorClasses).map(([type, colorClass]) => (
                  <div key={type} className="flex items-center space-x-3">
                    <div className={`w-4 h-4 ${colorClass} rounded-full flex items-center justify-center`}>
                      <SafeIcon icon={entryTypeIcons[type]} className="text-white text-xs" />
                    </div>
                    <span className="text-sm text-gray-700 capitalize">
                      {type === 'diner' ? 'Diners' : type === 'accommodation' ? 'Stays' : type === 'route' ? 'Routes' : 'Attractions'}
                    </span>
                    <span className="text-xs text-gray-500">
                      ({entries.filter(e => e.type === type).length})
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Selected Entry Details */}
            {selectedEntry && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="bg-white rounded-xl p-6 shadow-sm border"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Entry Details</h3>
                  <button
                    onClick={() => setSelectedEntry(null)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <SafeIcon icon={FiX} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900">{selectedEntry.title}</h4>
                    <div className="flex items-center space-x-2 mt-1">
                      <SafeIcon icon={FiMapPin} className="text-gray-400 text-sm" />
                      {editingEntry?.id === selectedEntry.id ? (
                        <div className="flex-1 flex items-center space-x-2">
                          <input
                            type="text"
                            value={newLocation}
                            onChange={(e) => setNewLocation(e.target.value)}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            placeholder="Enter new location"
                          />
                          <button
                            onClick={saveLocationEdit}
                            className="text-green-600 hover:text-green-700 transition-colors"
                          >
                            <SafeIcon icon={FiSave} className="text-sm" />
                          </button>
                          <button
                            onClick={cancelLocationEdit}
                            className="text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <SafeIcon icon={FiX} className="text-sm" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-sm text-gray-600">{selectedEntry.location}</span>
                          <button
                            onClick={() => handleLocationEdit(selectedEntry)}
                            className="text-gray-400 hover:text-primary-500 transition-colors"
                          >
                            <SafeIcon icon={FiEdit2} className="text-sm" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {selectedEntry.description && (
                    <div>
                      <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                      <p className="text-sm text-gray-600">{selectedEntry.description}</p>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiIcons.FiCalendar} />
                      <span>{new Date(selectedEntry.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <SafeIcon icon={FiIcons.FiStar} className="text-yellow-400" />
                      <span>{selectedEntry.rating}/5</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Location Summary */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-xl p-6 shadow-sm border"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Locations Visited</h3>
              {entries.length === 0 ? (
                <div className="text-center py-8">
                  <SafeIcon icon={FiInfo} className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">No locations to display yet</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {Object.entries(locationGroups).map(([location, locationEntries]) => (
                    <div
                      key={location}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <SafeIcon icon={FiMapPin} className="text-primary-500" />
                        <div>
                          <div className="font-medium text-gray-900">{location}</div>
                          <div className="text-sm text-gray-600">
                            {locationEntries.length} {locationEntries.length === 1 ? 'entry' : 'entries'}
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-1">
                        {locationEntries.map((entry) => (
                          <div
                            key={entry.id}
                            className={`w-2 h-2 rounded-full ${entryTypeColorClasses[entry.type]} cursor-pointer`}
                            onClick={() => setSelectedEntry(entry)}
                            title={entry.title}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MapView;