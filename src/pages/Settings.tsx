import { useState } from 'react';
import { useSettings } from '../context/SettingsContext';
import { exportCSV, exportPDF } from '../utils/export';
import { fetchAllShiftsWithBreaks } from '../utils/fetchData';
import { startOfWeek, endOfWeek } from 'date-fns';
import { Download, FileText, Trash2, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Settings.css';

export function Settings() {
  const { settings, updateSettings, resetData } = useSettings();
  const { signOut, user } = useAuth();
  const [rateInput, setRateInput] = useState(settings.hourly_rate.toString());

  const profile = user?.user_metadata || {};
  const fullName = profile.first_name ? `${profile.first_name} ${profile.last_name || ''}` : (profile.full_name || 'Team Member');
  
  // Date range picker defaults to this week
  const today = new Date();
  const defaultStart = startOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0];
  const defaultEnd = endOfWeek(today, { weekStartsOn: 1 }).toISOString().split('T')[0];
  
  const [startDate, setStartDate] = useState(defaultStart);
  const [endDate, setEndDate] = useState(defaultEnd);

  const handleRateBlur = () => {
    const parsed = parseFloat(rateInput);
    if (!isNaN(parsed) && parsed >= 0) {
      updateSettings({ hourly_rate: parsed });
    } else {
      setRateInput(settings.hourly_rate.toString());
    }
  };

  const handleExportPDF = async () => {
    const shifts = await fetchAllShiftsWithBreaks(settings.hourly_rate, settings.paid_breaks);
    const filtered = shifts.filter(s => {
      const d = s.clock_in.split('T')[0];
      return d >= startDate && d <= endDate;
    });
    if (filtered.length === 0) {
      alert("No shifts found in selected date range.");
      return;
    }
    exportPDF(filtered, startDate, endDate, settings.hourly_rate, settings.currency_symbol);
  };

  const handleExportCSV = async () => {
    const shifts = await fetchAllShiftsWithBreaks(settings.hourly_rate, settings.paid_breaks);
    const filtered = shifts.filter(s => {
      const d = s.clock_in.split('T')[0];
      return d >= startDate && d <= endDate;
    });
    if (filtered.length === 0) {
      alert("No shifts found in selected date range.");
      return;
    }
    exportCSV(filtered, startDate, endDate);
  };

  const handleDeleteAll = async () => {
    if (window.confirm("Are you sure you want to delete all data? This cannot be undone.")) {
      await resetData();
      alert("All data has been cleared.");
      window.location.reload();
    }
  };

  return (
    <div className="page-container settings-page">
      <h2 className="page-title">Settings</h2>

      <div className="settings-section glass-panel" style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', marginBottom: '1.5rem', border: 'none' }}>
        <h3 className="section-title" style={{ color: 'var(--color-on-primary)', opacity: 0.9 }}>Logged In Profile</h3>
        <div className="mt-4" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>{fullName}</div>
          <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>{user?.email}</div>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', opacity: 0.85, fontSize: '0.85rem' }}>
            {profile.employee_code && <span>Code: {profile.employee_code}</span>}
            {profile.dob && <span>DOB: {new Date(profile.dob).toLocaleDateString()}</span>}
          </div>
        </div>
      </div>
      
      <div className="settings-section glass-panel">
        <h3 className="section-title">Pay Settings</h3>
        
        <div className="input-group">
          <label>Hourly Rate</label>
          <div className="input-with-symbol">
            <span className="currency-prefix">{settings.currency_symbol}</span>
            <input 
              type="number" 
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              onBlur={handleRateBlur}
              min="0"
              step="0.01"
            />
          </div>
        </div>

        <div className="input-group">
          <label>Currency Symbol</label>
          <input 
            type="text" 
            value={settings.currency_symbol}
            onChange={e => updateSettings({ currency_symbol: e.target.value })}
            maxLength={3}
          />
        </div>

        <div className="toggle-group mt-4">
          <div className="toggle-label">
            <span className="font-semibold text-primary">Paid Breaks</span>
            <span className="text-muted block text-xs">Break time counts towards estimated pay</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.paid_breaks}
              onChange={e => updateSettings({ paid_breaks: e.target.checked })}
            />
            <span className="slider round"></span>
          </label>
        </div>

        <div className="toggle-group mt-4">
          <div className="toggle-label">
            <span className="font-semibold text-primary">Dark Mode</span>
            <span className="text-muted block text-xs">Switch to midnight theme</span>
          </div>
          <label className="switch">
            <input 
              type="checkbox" 
              checked={settings.theme === 'dark'}
              onChange={e => updateSettings({ theme: e.target.checked ? 'dark' : 'light' })}
            />
            <span className="slider round"></span>
          </label>
        </div>
      </div>

      <div className="settings-section glass-panel mt-6">
        <h3 className="section-title">Export Timesheet</h3>
        
        <div className="date-range-group">
          <div className="input-group">
            <label>From</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
          </div>
          <div className="input-group">
            <label>To</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>
        
        <div className="export-actions mt-4">
          <button className="btn-export" onClick={handleExportPDF}>
            <FileText size={18} /> Export as PDF
          </button>
          <button className="btn-export" onClick={handleExportCSV}>
            <Download size={18} /> Export as CSV
          </button>
        </div>
      </div>
      
      <div className="settings-section mt-6 about-section">
        <h3 className="section-title">About</h3>
        <div className="flex justify-between items-center mb-4 text-secondary">
           <span>App Version</span>
           <span>1.0.0</span>
        </div>
        
        <button className="btn-danger-outline w-full flex justify-center items-center gap-2" onClick={handleDeleteAll}>
           <Trash2 size={18} /> Delete all data
        </button>
        <button className="btn-danger-outline w-full flex justify-center items-center gap-2 mt-4" onClick={signOut}>
           <LogOut size={18} /> Sign Out
        </button>
      </div>

    </div>
  );
}
