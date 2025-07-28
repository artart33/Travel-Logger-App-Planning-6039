import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import * as FiIcons from 'react-icons/fi';
import SafeIcon from '../common/SafeIcon';
import { useTravelContext } from '../context/TravelContext';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const { FiArrowLeft, FiMapPin, FiNavigation, FiInfo, FiEdit2, FiSave, FiX, FiCalendar } = FiIcons;

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
const MapBoundsManager = ({ coordinates, selectedDate, entries }) => {
  const map = useMap();
  
  useEffect(() => {
    if (coordinates && coordinates.length > 0) {
      // Filter out invalid coordinates
      const validCoordinates = coordinates.filter(coord => 
        coord && coord.length === 2 && 
        !isNaN(coord[0]) && !isNaN(coord[1]) &&
        coord[0] !== 0 && coord[1] !== 0
      );

      if (validCoordinates.length > 0) {
        // Create a bounds object
        const bounds = L.latLngBounds(validCoordinates);
        
        // Fit the map to these bounds with some padding
        map.fitBounds(bounds, {
          padding: [50, 50],
          maxZoom: 13, // Limit max zoom to keep context
          animate: true
        });
      }
    }
  }, [coordinates, map, selectedDate, entries]); // Added entries as dependency
  
  return null;
};

const MapView = () => {
  const navigate = useNavigate();
  const { entries, updateEntry } = useTravelContext();
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [editingEntry, setEditingEntry] = useState(null);
  const [newLocation, setNewLocation] = useState('');
  const [mapCenter, setMapCenter] = useState([52.1326, 5.2913]); // Center of Netherlands
  const [mapZoom, setMapZoom] = useState(7); // Good zoom level for Netherlands
  const [markerCoordinates, setMarkerCoordinates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [uniqueDates, setUniqueDates] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [locationCache, setLocationCache] = useState(new Map()); // Cache for geocoded locations
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

  // Extract unique dates from entries
  useEffect(() => {
    if (entries.length > 0) {
      // Get all unique dates
      const dates = [...new Set(entries.map(entry => entry.date))].sort((a, b) => new Date(b) - new Date(a));
      setUniqueDates(dates);
      
      // Set the most recent date as default
      if (dates.length > 0 && !selectedDate) {
        setSelectedDate(dates[0]);
      }
    }
  }, [entries]);
  
  // Filter entries by selected date
  useEffect(() => {
    if (entries.length > 0 && selectedDate) {
      const filtered = entries.filter(entry => entry.date === selectedDate);
      setFilteredEntries(filtered);
    } else {
      setFilteredEntries(entries);
    }
  }, [entries, selectedDate]);

  // Geocode location to coordinates
  const geocodeLocation = async (locationString) => {
    // Check cache first
    if (locationCache.has(locationString)) {
      return locationCache.get(locationString);
    }

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
          const coords = [parseFloat(data[0].lat), parseFloat(data[0].lon)];
          // Cache the result
          setLocationCache(prev => new Map(prev.set(locationString, coords)));
          return coords;
        }
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }

    return null;
  };

  // Process all entries to get their coordinates
  useEffect(() => {
    const processEntries = async () => {
      if (filteredEntries.length > 0) {
        // Get coordinates for all entries
        const coordinates = [];
        
        for (const entry of filteredEntries) {
          const coords = await getLocationCoordinates(entry);
          if (coords) {
            coordinates.push(coords);
          }
        }
        
        setMarkerCoordinates(coordinates);
        
        // Update map center based on valid coordinates if available
        if (coordinates.length > 0) {
          const validCoords = coordinates.filter(coord => 
            coord && coord.length === 2 && 
            !isNaN(coord[0]) && !isNaN(coord[1]) &&
            coord[0] !== 0 && coord[1] !== 0
          );
          
          if (validCoords.length > 0) {
            // Calculate center of all coordinates
            const avgLat = validCoords.reduce((sum, coord) => sum + coord[0], 0) / validCoords.length;
            const avgLng = validCoords.reduce((sum, coord) => sum + coord[1], 0) / validCoords.length;
            setMapCenter([avgLat, avgLng]);
          }
        }
      } else {
        setMarkerCoordinates([]);
      }
    };

    processEntries();
  }, [filteredEntries, locationCache]); // Added locationCache as dependency

  const handleLocationEdit = (entry) => {
    setEditingEntry(entry);
    setNewLocation(entry.location);
  };

  const saveLocationEdit = async () => {
    if (editingEntry && newLocation.trim()) {
      // Clear the cache for the old location
      locationCache.delete(editingEntry.location);
      
      // Update the entry
      updateEntry(editingEntry.id, { location: newLocation.trim() });
      
      // Force re-geocoding by clearing cache for new location too
      locationCache.delete(newLocation.trim());
      setLocationCache(new Map(locationCache));
      
      setEditingEntry(null);
      setNewLocation('');
      
      // Update selectedEntry if it's the same as the one being edited
      if (selectedEntry && selectedEntry.id === editingEntry.id) {
        setSelectedEntry({ ...selectedEntry, location: newLocation.trim() });
      }
    }
  };

  const cancelLocationEdit = () => {
    setEditingEntry(null);
    setNewLocation('');
  };

  // Extract coordinates from location string or geocode the location
  const getLocationCoordinates = async (entry) => {
    // If the entry already has coordinates, use those
    if (entry.coordinates && Array.isArray(entry.coordinates) && entry.coordinates.length === 2) {
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

    // Netherlands cities coordinates
    const dutchCities = {
      'amsterdam': [52.3676, 4.9041],
      'rotterdam': [51.9225, 4.47917],
      'den haag': [52.0705, 4.3007],
      'the hague': [52.0705, 4.3007],
      'utrecht': [52.0907, 5.1214],
      'eindhoven': [51.441642, 5.469722],
      'tilburg': [51.555, 5.0913],
      'groningen': [53.2194, 6.5665],
      'almere': [52.3508, 5.2647],
      'breda': [51.5719, 4.7683],
      'nijmegen': [51.8426, 5.8518],
      'haarlem': [52.3874, 4.6462],
      'arnhem': [51.9851, 5.8987],
      'zaanstad': [52.4391, 4.8275],
      'delft': [52.0116, 4.3571],
      'leiden': [52.1601, 4.4970],
      'maastricht': [50.8514, 5.6910],
      'zwolle': [52.5168, 6.0830],
      'enschede': [52.2215, 6.8937],
      'amersfoort': [52.1561, 5.3878],
      'apeldoorn': [52.2112, 5.9699],
      'gouda': [52.0115, 4.7104],
      'venlo': [51.3704, 6.1720],
      'alkmaar': [52.6324, 4.7534],
      'deventer': [52.2550, 6.1602]
    };

    // Check if location contains any Dutch city names
    const locationLower = entry.location.toLowerCase();
    for (const [city, coords] of Object.entries(dutchCities)) {
      if (locationLower.includes(city)) {
        return coords;
      }
    }

    // Try to geocode the location
    const geocodedCoords = await geocodeLocation(entry.location);
    if (geocodedCoords) {
      return geocodedCoords;
    }

    // If we can't determine coordinates, use Netherlands center as fallback
    return [52.1326, 5.2913]; // Center of Netherlands
  };

  // Group entries by location for the sidebar
  const locationGroups = filteredEntries.reduce((groups, entry) => {
    if (!groups[entry.location]) {
      groups[entry.location] = [];
    }
    groups[entry.location].push(entry);
    return groups;
  }, {});

  // Create a memoized entries array with coordinates for markers
  const [entriesWithCoords, setEntriesWithCoords] = useState([]);

  useEffect(() => {
    const processEntriesWithCoords = async () => {
      const processed = await Promise.all(
        filteredEntries.map(async (entry) => {
          const coords = await getLocationCoordinates(entry);
          return { ...entry, resolvedCoordinates: coords };
        })
      );
      setEntriesWithCoords(processed);
    };

    processEntriesWithCoords();
  }, [filteredEntries, locationCache]); // Re-process when entries or cache changes

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
        {/* Date Filter */}
        {uniqueDates.length > 0 && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6"
          >
            <div className="flex items-center space-x-3 bg-white p-4 rounded-xl shadow-sm border">
              <SafeIcon icon={FiCalendar} className="text-primary-500" />
              <label htmlFor="date-filter" className="text-sm font-medium text-gray-700">
                Filter by date:
              </label>
              <select
                id="date-filter"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
              >
                <option value="">All dates</option>
                {uniqueDates.map(date => (
                  <option key={date} value={date}>
                    {new Date(date).toLocaleDateString('en-US', { 
                      weekday: 'short', 
                      year: 'numeric', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </option>
                ))}
              </select>
            </div>
          </motion.div>
        )}

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
                  key={`map-${Date.now()}`} // Force re-render when data changes
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {entriesWithCoords.map((entry) => {
                    const coordinates = entry.resolvedCoordinates;
                    if (!coordinates || coordinates.length !== 2) return null;
                    
                    const icon = createCustomIcon(entryTypeColors[entry.type]);
                    
                    return (
                      <Marker 
                        key={`${entry.id}-${entry.location}`} // Include location in key to force re-render
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
                    <MapBoundsManager 
                      coordinates={markerCoordinates} 
                      selectedDate={selectedDate}
                      entries={entriesWithCoords} // Pass entries to trigger updates
                    />
                  )}
                </MapContainer>

                {/* Map Title */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 z-10">
                  <div className="flex items-center space-x-2">
                    <SafeIcon icon={FiNavigation} className="text-primary-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {selectedDate 
                        ? `Entries for ${new Date(selectedDate).toLocaleDateString()}` 
                        : 'All Travel Entries'}
                    </span>
                  </div>
                </div>

                {/* Empty state - shown when map is loaded but no entries */}
                {(entries.length === 0 || filteredEntries.length === 0) && (
                  <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10">
                    <div className="text-center p-6 bg-white rounded-lg shadow-sm">
                      <SafeIcon icon={FiNavigation} className="text-6xl text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {entries.length === 0 
                          ? 'No locations yet' 
                          : 'No entries for this date'}
                      </h3>
                      <p className="text-gray-600">
                        {entries.length === 0 
                          ? 'Start adding entries to see them on the map' 
                          : 'Try selecting a different date'}
                      </p>
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
                      ({filteredEntries.filter(e => e.type === type).length})
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
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {selectedDate ? `Locations on ${new Date(selectedDate).toLocaleDateString()}` : 'All Locations'}
              </h3>
              {filteredEntries.length === 0 ? (
                <div className="text-center py-8">
                  <SafeIcon icon={FiInfo} className="text-4xl text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-600">
                    {entries.length === 0 
                      ? 'No locations to display yet' 
                      : 'No entries for this date'}
                  </p>
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