import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Navbar from './components/Common/Navbar';
import LeaderboardPage from './pages/LeaderboardPage';
import EventsPage from './pages/EventsPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <HashRouter>
      <AppProvider>
        <div className="app-layout">
          {/* Top Navigation */}
          <Navbar />
          
          {/* Page Contents */}
          <main className="main-content">
            <Routes>
              <Route path="/" element={<LeaderboardPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              {/* Fallback route redirects to Leaderboard */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>

          {/* Beach Waves background decoration */}
          <div className="wave-container">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" preserveAspectRatio="none">
              <path 
                className="shape-fill" 
                fillOpacity="1" 
                d="M0,160L48,154.7C96,149,192,139,288,144C384,149,480,171,576,165.3C672,160,768,128,864,122.7C960,117,1056,139,1152,144C1248,149,1344,139,1392,133.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
        </div>
      </AppProvider>
    </HashRouter>
  );
}

export default App;
