import { useState, useEffect } from 'react';
import { useShift } from '../context/ShiftContext';
import { LiveTimer } from '../components/LiveTimer';
import { ClockButton } from '../components/ClockButton';
import { calculateBreakMinutes, calculateWorkedMinutes, calculateBreakSeconds, formatDuration, formatPay } from '../utils/timeCalc';
import { useSettings } from '../context/SettingsContext';
import { getBreaksForShift } from '../db/db';
import { fetchAllShiftsWithBreaks } from '../utils/fetchData';
import { WeeklyChart } from '../components/WeeklyChart';
import type { Break, ShiftWithBreaks } from '../types';
import './Home.css';

export function Home() {
  const { activeShift, activeBreak, clockIn, clockOut, startBreak, endBreak } = useShift();
  const { settings } = useSettings();
  
  const [showConfirm, setShowConfirm] = useState(false);
  const [breaksCache, setBreaksCache] = useState<Break[]>([]);
  const [allShifts, setAllShifts] = useState<ShiftWithBreaks[]>([]);
  const [jobRole, setJobRole] = useState('');

  // We need to fetch all completed breaks if we want accurate total break time 
  // Let's use an effect or just compute it based on shift context's active_break and db fetch
  useEffect(() => {
    if (activeShift && activeShift.id) {
       getBreaksForShift(activeShift.id).then(setBreaksCache);
    } else {
       setBreaksCache([]);
    }
  }, [activeShift, activeBreak]);

  // Fetch all historic shifts mapping exactly like Dashboard to feed the Weekly Line Graph
  useEffect(() => {
    fetchAllShiftsWithBreaks(settings.hourly_rate, settings.paid_breaks).then(setAllShifts);
  }, [settings.hourly_rate, settings.paid_breaks, activeShift]);

  const totalBreakMinutes = calculateBreakMinutes(breaksCache);
  const totalBreakSeconds = calculateBreakSeconds(breaksCache);
  const workedMinutes = activeShift ? calculateWorkedMinutes(activeShift, breaksCache) : 0;
  const breakCount = breaksCache.length;

  const status = activeBreak ? 'on_break' : (activeShift ? 'active' : 'idle');

  const handleClockOutAsk = () => {
    setShowConfirm(true);
  };

  const confirmClockOut = async () => {
    await clockOut();
    setShowConfirm(false);
  };

  // Status text mapping
  const statusConfig = {
    idle: { dot: 'bg-gray-500', text: 'Not clocked in' },
    active: { dot: 'bg-green-500 pulse', text: 'Shift in progress' },
    on_break: { dot: 'bg-amber-500', text: 'On break' }
  };

  const dateNow = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  return (
    <div className="page-container page-home">
      <header className="home-header">
        <h1 className="logo-text">ShiftLog</h1>
        <span className="header-date">{dateNow}</span>
      </header>

      <div className="status-indicator">
        <div className={`status-dot ${statusConfig[status].dot}`}></div>
        <span className="status-text">{statusConfig[status].text}</span>
      </div>

      <LiveTimer 
        clockInTime={activeShift ? activeShift.clock_in : null}
        totalBreakSeconds={totalBreakSeconds}
        isOnBreak={!!activeBreak}
        breakStartTime={activeBreak ? activeBreak.start_time : null}
        status={status}
        hourlyRate={settings.hourly_rate}
        currencySymbol={settings.currency_symbol}
      />

      {status !== 'idle' && (
        <div className="break-info-row text-muted">
          Breaks today: {breakCount} break{breakCount !== 1 ? 's' : ''} · {formatDuration(totalBreakMinutes)} total
        </div>
      )}

      {status === 'idle' && (
        <WeeklyChart shifts={allShifts} />
      )}

      <div className="action-buttons-container">
        {status === 'idle' && (
          <div className="clock-in-wrapper">
            <input 
              type="text" 
              className="role-input" 
              placeholder="What are you working on? (Optional Job Role)"
              value={jobRole}
              onChange={e => setJobRole(e.target.value)}
              maxLength={40}
            />
            <ClockButton label="Clock In" variant="clockIn" onPress={() => clockIn(jobRole || null)} />
          </div>
        )}
        
        {status !== 'idle' && (
          <>
            <ClockButton 
              label="Clock Out" 
              variant="clockOut" 
              onPress={async () => handleClockOutAsk()} 
              disabled={status === 'on_break'} 
            />
            
            <div className="mt-4">
              {status === 'active' ? (
                <ClockButton label="Start Break" variant="startBreak" onPress={startBreak} />
              ) : (
                <ClockButton label="End Break" variant="endBreak" onPress={endBreak} />
              )}
            </div>
          </>
        )}
      </div>

      {showConfirm && activeShift && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <h2>End shift?</h2>
            <div className="modal-summary">
              <div>Started: {new Date(activeShift.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})}</div>
              <div>Duration: {formatDuration(workedMinutes)} worked</div>
              <div>Breaks: {breakCount} break{breakCount!==1?'s':''} · {formatDuration(totalBreakMinutes)}</div>
              <div className="modal-pay highlight mt-4">Estimated pay: {formatPay(((settings.paid_breaks ? workedMinutes + totalBreakMinutes : workedMinutes)/60)*settings.hourly_rate, settings.currency_symbol)}</div>
            </div>
            
            <div className="modal-actions mt-6">
              <button className="btn-cancel" onClick={() => setShowConfirm(false)}>Cancel</button>
              <button className="btn-confirm" onClick={confirmClockOut}>Clock Out</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
