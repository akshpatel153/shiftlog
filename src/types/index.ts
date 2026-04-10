export type ShiftStatus = 'active' | 'on_break' | 'completed';

export interface Shift {
  id?: number;               
  clock_in: string;          // ISO 8601 string e.g. "2024-01-15T09:00:00.000Z"
  clock_out: string | null;  // null while shift is active
  status: ShiftStatus;
  notes: string | null;
}

export interface Break {
  id?: number;
  shift_id: number;
  start_time: string;        // ISO 8601 string
  end_time: string | null;   // null while break is active
}

export interface ShiftWithBreaks extends Shift {
  breaks: Break[];
  total_worked_minutes: number;   // calculated: shift duration minus all break durations
  total_break_minutes: number;    // sum of all completed breaks
  estimated_pay: number;          // total_worked_minutes / 60 * hourly_rate
}

export interface WeeklySummary {
  week_start: string;            // ISO date string of Monday
  week_end: string;              // ISO date string of Sunday
  total_shifts: number;
  total_worked_minutes: number;
  total_break_minutes: number;
  estimated_pay: number;
}

export interface AppSettings {
  hourly_rate: number;           // default 15.00
  currency_symbol: string;       // default "$"
  pay_period: 'weekly' | 'biweekly';
  paid_breaks: boolean;
}
