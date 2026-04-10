import { useState, useEffect } from 'react';
import { useSettings } from '../context/SettingsContext';
import { fetchAllShiftsWithBreaks } from '../utils/fetchData';
import type { ShiftWithBreaks } from '../types';
import { SummaryCard } from '../components/SummaryCard';
import { formatDuration, formatPay } from '../utils/timeCalc';
import { isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import { Clock, DollarSign, List, Coffee } from 'lucide-react';
import './Dashboard.css';

type Period = 'Today' | 'This Week' | 'This Month';

export function Dashboard() {
  const { settings } = useSettings();
  const [period, setPeriod] = useState<Period>('This Week');
  const [shifts, setShifts] = useState<ShiftWithBreaks[]>([]);

  useEffect(() => {
    fetchAllShiftsWithBreaks(settings.hourly_rate, settings.paid_breaks).then(setShifts);
  }, [settings.hourly_rate, settings.paid_breaks]);

  // Filter based on period
  const filteredShifts = shifts.filter(s => {
    const d = parseISO(s.clock_in);
    if (period === 'Today') return isToday(d);
    if (period === 'This Week') return isThisWeek(d, { weekStartsOn: 1 });
    if (period === 'This Month') return isThisMonth(d);
    return false;
  });

  // Calculate totals
  const totalWorked = filteredShifts.reduce((acc, s) => acc + s.total_worked_minutes, 0);
  const totalBreak = filteredShifts.reduce((acc, s) => acc + s.total_break_minutes, 0);
  const totalPay = filteredShifts.reduce((acc, s) => acc + s.estimated_pay, 0);
  const totalShiftCount = filteredShifts.length;

  return (
    <div className="page-container dashboard-page">
      <h2 className="page-title">Dashboard</h2>
      
      <div className="period-tabs">
        {['Today', 'This Week', 'This Month'].map(p => (
          <button 
            key={p} 
            className={`tab-btn ${period === p ? 'active' : ''}`}
            onClick={() => setPeriod(p as Period)}
          >
            {p}
          </button>
        ))}
      </div>

      <div className="summary-grid">
        <SummaryCard 
          label="Hours Worked" 
          value={formatDuration(totalWorked)} 
          icon={<Clock size={20} />}
          colorClass="text-color-green"
        />
        <SummaryCard 
          label="Estimated Pay" 
          value={formatPay(totalPay, settings.currency_symbol)} 
          icon={<DollarSign size={20} />} 
        />
        <SummaryCard 
          label="Shifts" 
          value={`${totalShiftCount} shifts`} 
          icon={<List size={20} />} 
        />
        <SummaryCard 
          label="Break Time" 
          value={formatDuration(totalBreak)} 
          icon={<Coffee size={20} />}
          colorClass="text-color-amber"
        />
      </div>

      {(period === 'This Week' || period === 'This Month') && totalShiftCount > 0 && (
        <div className="daily-breakdown">
          <h3 className="section-title">Daily Breakdown</h3>
          <div className="breakdown-list">
            {filteredShifts.map(s => {
              const d = new Date(s.clock_in);
              return (
                <div key={s.id} className="breakdown-row glass-panel">
                  <div className="row-date">
                    <strong>{d.toLocaleDateString([], {weekday: 'short'})}</strong>
                    <span className="text-muted ml-2">{d.toLocaleDateString([], {month: 'short', day: 'numeric'})}</span>
                  </div>
                  <div className="row-stats">
                    <span>{formatDuration(s.total_worked_minutes)}</span>
                    <span className="highlight ml-4">{formatPay(s.estimated_pay, settings.currency_symbol)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalShiftCount === 0 && (
        <div className="empty-state">
          <div className="empty-icon"><Clock size={48} /></div>
          <h3>No shifts recorded</h3>
          <p className="text-muted">Tap the Home tab to clock in for your first shift</p>
        </div>
      )}
    </div>
  );
}
