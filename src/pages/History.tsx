import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { fetchAllShiftsWithBreaks } from '../utils/fetchData';
import type { ShiftWithBreaks } from '../types';
import { ShiftCard } from '../components/ShiftCard';
import { startOfWeek, endOfWeek, parseISO, addDays } from 'date-fns';
import { deleteShift, addManualShift } from '../db/db';
import { List, Plus } from 'lucide-react';
import './History.css';

export function History() {
  const { settings } = useSettings();
  const [shifts, setShifts] = useState<ShiftWithBreaks[]>([]);
  const [selectedShift, setSelectedShift] = useState<ShiftWithBreaks | null>(null);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDate, setManualDate] = useState('');
  const [manualStart, setManualStart] = useState('');
  const [manualEnd, setManualEnd] = useState('');
  const [manualBreaks, setManualBreaks] = useState('0');
  const [manualRole, setManualRole] = useState('');

  const loadData = () => {
    fetchAllShiftsWithBreaks(settings.hourly_rate, settings.paid_breaks).then(setShifts);
  };

  useEffect(() => {
    loadData();
  }, [settings.hourly_rate, settings.paid_breaks]);

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this shift? This cannot be undone.")) {
      await deleteShift(id);
      setSelectedShift(null);
      loadData();
    }
  };

  const handleManualSave = async () => {
    if (!manualDate || !manualStart || !manualEnd) return;
    
    let clockInDate = new Date(`${manualDate}T${manualStart}`);
    let clockOutDate = new Date(`${manualDate}T${manualEnd}`);
    
    if (clockOutDate <= clockInDate) {
      clockOutDate = addDays(clockOutDate, 1);
    }

    await addManualShift(clockInDate.toISOString(), clockOutDate.toISOString(), parseInt(manualBreaks) || 0, manualRole);
    setShowManualModal(false);
    setManualDate(''); setManualStart(''); setManualEnd(''); setManualBreaks('0'); setManualRole('');
    loadData();
  };

  // Group shifts by week
  const groupedShifts: { [weekLabel: string]: ShiftWithBreaks[] } = {};
  
  shifts.forEach(s => {
    const d = parseISO(s.clock_in);
    const start = startOfWeek(d, { weekStartsOn: 1 });
    const end = endOfWeek(d, { weekStartsOn: 1 });
    const label = `Week of ${start.toLocaleDateString([], {month: 'short', day: 'numeric'})} – ${end.toLocaleDateString([], {month: 'short', day: 'numeric'})}`;
    
    if (!groupedShifts[label]) groupedShifts[label] = [];
    groupedShifts[label].push(s);
  });

  return (
    <div className="page-container history-page">
      <header className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title"><List className="icon" style={{display:'inline-block'}} /> History</h1>
          <p className="text-muted">Review your past shifts</p>
        </div>
        <button className="btn-icon" onClick={() => setShowManualModal(true)} style={{ background: 'var(--color-primary)', color: 'var(--color-on-primary)', borderRadius: '50%', padding: '0.5rem', border: 'none', display: 'flex', cursor: 'pointer' }}>
          <Plus size={24} />
        </button>
      </header>
      
      {shifts.length === 0 && (
        <div className="empty-state mt-4">
          <div className="empty-icon"><List size={48} /></div>
          <h3>Your shift history will appear here</h3>
        </div>
      )}

      <div className="shift-list">
        {Object.keys(groupedShifts).map(weekLabel => (
          <div key={weekLabel} className="week-group">
            <h3 className="week-label text-muted">{weekLabel}</h3>
            {groupedShifts[weekLabel].map(s => (
              <ShiftCard 
                key={s.id} 
                shift={s} 
                hourlyRate={settings.hourly_rate} 
                currencySymbol={settings.currency_symbol}
                onPress={() => setSelectedShift(s)}
              />
            ))}
          </div>
        ))}
      </div>

      {selectedShift && (
        <div className="modal-overlay" onClick={() => setSelectedShift(null)}>
          <div className="glass-panel modal-content bottom-sheet" onClick={e => e.stopPropagation()}>
            <div className="bottom-sheet-drag"></div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2>Shift Details</h2>
              {selectedShift.notes && <span className="role-badge" style={{ marginBottom: '1.5rem' }}>{selectedShift.notes}</span>}
            </div>
            <div className="modal-summary mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
              <div className="flex-col"><span className="text-muted text-xs mb-1" style={{fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em'}}>DATE</span><span className="font-semibold" style={{fontSize: '1.1rem'}}>{new Date(selectedShift.clock_in).toLocaleDateString()}</span></div>
              <div className="flex-col"><span className="text-muted text-xs mb-1" style={{fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em'}}>IN</span><span className="font-semibold" style={{fontSize: '1.1rem'}}>{new Date(selectedShift.clock_in).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span></div>
              <div className="flex-col"><span className="text-muted text-xs mb-1" style={{fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em'}}>OUT</span><span className="font-semibold" style={{fontSize: '1.1rem'}}>{selectedShift.clock_out ? new Date(selectedShift.clock_out).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : 'Ongoing'}</span></div>
            </div>
            
            <h3 className="mt-6 mb-2">Breaks ({selectedShift.breaks.length})</h3>
            {selectedShift.breaks.map((b, i) => (
              <div key={b.id || i} className="break-row">
                 {new Date(b.start_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'})} - {b.end_time ? new Date(b.end_time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second: '2-digit'}) : 'Active'}
              </div>
            ))}
            
            <div className="modal-actions mt-6">
               <button className="btn-cancel text-danger" onClick={() => handleDelete(selectedShift.id!)}>Delete Shift</button>
            </div>
          </div>
        </div>
      )}

      {showManualModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ width: '90%', maxWidth: '400px' }}>
            <h2 className="mb-4">Add Manual Shift</h2>
            
            <div className="input-group">
              <label>Date</label>
              <input type="date" value={manualDate} onChange={e => setManualDate(e.target.value)} />
            </div>
            
            <div className="grid-2-col mt-4" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="input-group">
                <label>Clock In</label>
                <input type="time" value={manualStart} onChange={e => setManualStart(e.target.value)} />
              </div>
              <div className="input-group">
                <label>Clock Out</label>
                <input type="time" value={manualEnd} onChange={e => setManualEnd(e.target.value)} />
              </div>
            </div>

            <div className="input-group mt-4">
              <label>Job Role (Optional)</label>
              <input type="text" value={manualRole} onChange={e => setManualRole(e.target.value)} placeholder="e.g. Barista" maxLength={40} />
            </div>

            <div className="input-group mt-4">
              <label>Break Time (minutes)</label>
              <input type="number" min="0" value={manualBreaks} onChange={e => setManualBreaks(e.target.value)} />
            </div>

            <div className="modal-actions mt-6">
               <button className="btn-cancel" onClick={() => setShowManualModal(false)}>Cancel</button>
               <button className="btn-confirm" disabled={!manualDate || !manualStart || !manualEnd} onClick={handleManualSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
