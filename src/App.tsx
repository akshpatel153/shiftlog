import { BrowserRouter, Routes, Route, NavLink, Navigate } from 'react-router-dom';
import { Clock, BarChart2, List, Settings as SettingsIcon, User } from 'lucide-react';
import { SettingsProvider } from './context/SettingsContext';
import { Home } from './pages/Home';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { Auth } from './pages/Auth';
import { Onboarding } from './pages/Onboarding';
import { useShift, ShiftProvider } from './context/ShiftContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import './App.css';

function AppContent() {
  const { activeShift } = useShift();
  
  return (
    <div className="app-layout">
      {/* Dynamic Background Blobs */}
      <div className="blob-1"></div>
      <div className="blob-2"></div>
      
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/history" element={<History />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </main>
      
      <nav className="bottom-nav">
        <NavLink to="/dashboard" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <div className="nav-icon-container">
              <BarChart2 size={24} strokeWidth={isActive ? 2.5 : 1.5} />
            </div>
          )}
        </NavLink>
        
        <NavLink to="/history" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <div className="nav-icon-container">
              <List size={24} strokeWidth={isActive ? 2.5 : 1.5} />
            </div>
          )}
        </NavLink>

        <NavLink to="/home" className={({isActive}) => `nav-item nav-item-center ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <div className={`nav-icon-container ${isActive ? 'rainbow-ring-active' : 'rainbow-ring-idle'}`}>
              <Clock size={28} strokeWidth={2} color={isActive ? "var(--color-text)" : "inherit"} />
              {activeShift && <div className="nav-badge" />}
            </div>
          )}
        </NavLink>
        
        <NavLink to="/settings" className={({isActive}) => `nav-item ${isActive ? 'active' : ''}`}>
          {({ isActive }) => (
            <div className="nav-icon-container">
              <SettingsIcon size={24} strokeWidth={isActive ? 2.5 : 1.5} />
            </div>
          )}
        </NavLink>

        <button className="nav-item cursor-not-allowed opacity-50" aria-label="Profile (Coming Soon)">
          <div className="nav-icon-container">
            <User size={24} strokeWidth={1.5} />
          </div>
        </button>
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

  // Check if they need onboarding (e.g. they signed up with Google and lack employee code metadata)
  const needsOnboarding = !user.user_metadata?.employee_code;

  if (needsOnboarding) {
    return <Onboarding />;
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
