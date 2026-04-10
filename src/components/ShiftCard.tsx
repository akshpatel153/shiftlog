
import type { ShiftWithBreaks } from '../types';
import { formatPay, formatDuration, formatTime, formatDateFull } from '../utils/timeCalc';
import { ChevronRight } from 'lucide-react';
import './Cards.css';

interface ShiftCardProps {
  shift: ShiftWithBreaks;
  hourlyRate: number;
  currencySymbol: string;
  onPress: () => void;
}

export function ShiftCard({ shift, currencySymbol, onPress }: ShiftCardProps) {
  const inTime = formatTime(shift.clock_in);
  const outTime = shift.clock_out ? formatTime(shift.clock_out) : 'Ongoing';
  
  return (
    <div className="glass-panel card shift-card" onClick={onPress} role="button" tabIndex={0}>
      <div className="shift-card-header">
        <h4 className="shift-date">{formatDateFull(shift.clock_in)}</h4>
        <ChevronRight size={20} className="text-muted" />
      </div>
      <div className="shift-time-range text-secondary">
        {inTime} – {outTime}
      </div>
      
      <div className="shift-stats justify-between items-center mt-4">
        <div className="flex-col gap-2">
          <div className="stat-label">Worked</div>
          <div className="stat-value">{formatDuration(shift.total_worked_minutes)}</div>
        </div>
        <div className="flex-col gap-2">
          <div className="stat-label">Breaks</div>
          <div className="stat-value">{shift.breaks.length} ({formatDuration(shift.total_break_minutes)})</div>
        </div>
        <div className="flex-col gap-2 align-right">
          <div className="stat-label">Est. Pay</div>
          <div className="stat-value highlight">{formatPay(shift.estimated_pay, currencySymbol)}</div>
        </div>
      </div>
    </div>
  );
}
