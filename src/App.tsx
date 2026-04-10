import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Clock, BarChart2, List, Settings as SettingsIcon } from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { useShift, ShiftProvider } from './context/ShiftContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const { activeShift } = useShift();
  
  return (
    <div className="app-layout">
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      
      <nav className="bottom-nav glass-panel">
        <NavLink to="/home" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon-container">
            <Clock size={24} />
            {activeShift && <div className="nav-badge" />}
          </div>
          <span>Clock</span>
        </NavLink>
        
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon-container">
            <BarChart2 size={24} />
          </div>
          <span>Summary</span>
        </NavLink>
        
        <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon-container">
            <List size={24} />
          </div>
          <span>History</span>
        </NavLink>
        
        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          <div className="nav-icon-container">
            <SettingsIcon size={24} />
          </div>
          <span>Settings</span>
        </NavLink>
      </nav>
    </div>
  );
}

function ProtectedApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent:'center'}}>Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <ShiftProvider>
      <AppContent />
    </ShiftProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <BrowserRouter>
          <ProtectedApp />
        </BrowserRouter>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
