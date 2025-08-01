import React, { createContext, useContext, useState, useEffect } from 'react';

const TravelContext = createContext();

// Local storage key
const STORAGE_KEY = 'travelEntries';

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
};

export const TravelProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Load entries from localStorage on component mount
  useEffect(() => {
    try {
      setLoading(true);
      // Load entries from localStorage
      const savedEntries = localStorage.getItem(STORAGE_KEY);
      
      if (savedEntries) {
        const parsedEntries = JSON.parse(savedEntries);
        setEntries(Array.isArray(parsedEntries) ? parsedEntries : []);
      }
    } catch (err) {
      console.error('Error loading travel entries:', err);
      setError('Failed to load your travel data');
      // If there's an error, initialize with empty array
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Save entries to localStorage
  const saveEntries = (newEntries) => {
    try {
      setEntries(newEntries);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newEntries));
    } catch (err) {
      console.error('Error saving travel entries:', err);
      setError('Failed to save your travel data');
    }
  };

  const addEntry = (entry) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newEntries = [...entries, newEntry];
    saveEntries(newEntries);
    return newEntry; // Return the new entry for potential further operations
  };

  const updateEntry = (id, updatedEntry) => {
    const newEntries = entries.map(entry => 
      entry.id === id ? { ...entry, ...updatedEntry } : entry
    );
    saveEntries(newEntries);
  };

  const deleteEntry = (id) => {
    const newEntries = entries.filter(entry => entry.id !== id);
    saveEntries(newEntries);
  };

  const clearAllEntries = () => {
    saveEntries([]);
  };

  // Check storage availability
  const isStorageAvailable = () => {
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  const value = {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    clearAllEntries,
    isStorageAvailable: isStorageAvailable()
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};