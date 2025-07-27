import React, { createContext, useContext, useState, useEffect } from 'react';

const TravelContext = createContext();

export const useTravelContext = () => {
  const context = useContext(TravelContext);
  if (!context) {
    throw new Error('useTravelContext must be used within a TravelProvider');
  }
  return context;
};

export const TravelProvider = ({ children }) => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load entries from localStorage
    const savedEntries = localStorage.getItem('travelEntries');
    if (savedEntries) {
      setEntries(JSON.parse(savedEntries));
    }
  }, []);

  const saveEntries = (newEntries) => {
    setEntries(newEntries);
    localStorage.setItem('travelEntries', JSON.stringify(newEntries));
  };

  const addEntry = (entry) => {
    const newEntry = {
      ...entry,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
    };
    const newEntries = [...entries, newEntry];
    saveEntries(newEntries);
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

  const value = {
    entries,
    loading,
    addEntry,
    updateEntry,
    deleteEntry,
  };

  return (
    <TravelContext.Provider value={value}>
      {children}
    </TravelContext.Provider>
  );
};