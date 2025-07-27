import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import HomeScreen from './components/HomeScreen';
import TravelHistory from './components/TravelHistory';
import AddEntry from './components/AddEntry';
import Settings from './components/Settings';
import MapView from './components/MapView';
import { TravelProvider } from './context/TravelContext';

function App() {
  return (
    <TravelProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-system">
          <AnimatePresence mode="wait">
            <Routes>
              <Route path="/" element={<HomeScreen />} />
              <Route path="/history" element={<TravelHistory />} />
              <Route path="/add" element={<AddEntry />} />
              <Route path="/map" element={<MapView />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </AnimatePresence>
        </div>
      </Router>
    </TravelProvider>
  );
}

export default App;