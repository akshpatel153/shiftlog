import { differenceInSeconds, parseISO, format } from 'date-fns';
import type { Shift, Break } from '../types';

export function calculateBreakMinutes(breaks: Break[]): number {
  return Math.floor(calculateBreakSeconds(breaks) / 60);
}

export function calculateBreakSeconds(breaks: Break[]): number {
  return breaks.reduce((total, b) => {
    const start = parseISO(b.start_time);
    const end = b.end_time ? parseISO(b.end_time) : new Date();
    return total + differenceInSeconds(end, start);
  }, 0);
}

export function calculateWorkedMinutes(shift: Shift, breaks: Break[]): number {
  return Math.floor(calculateWorkedSeconds(shift, breaks) / 60);
}

export function calculateWorkedSeconds(shift: Shift, breaks: Break[]): number {
  const start = parseISO(shift.clock_in);
  const end = shift.clock_out ? parseISO(shift.clock_out) : new Date();
  const totalSeconds = differenceInSeconds(end, start);
  const breakSeconds = calculateBreakSeconds(breaks);
  return Math.max(0, totalSeconds - breakSeconds);
}

export function calculateEstimatedPay(workedMinutes: number, hourlyRate: number): number {
  return (workedMinutes / 60) * hourlyRate;
}

export function formatDuration(minutes: number): string {
  if (minutes < 1) return "0m";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatTime(isoString: string): string {
  return format(parseISO(isoString), 'h:mm:ss a');
}

export function formatDate(isoString: string): string {
  return format(parseISO(isoString), 'EEE, MMM d');
}

export function formatDateFull(isoString: string): string {
  return format(parseISO(isoString), 'EEEE, MMMM d, yyyy');
}

export function formatPay(amount: number, symbol: string): string {
  return `${symbol}${amount.toFixed(2)}`;
}

export function formatTimer(totalSeconds: number): string {
  const h = Math.floor(Math.abs(totalSeconds) / 3600);
  const m = Math.floor((Math.abs(totalSeconds) % 3600) / 60);
  const s = Math.abs(totalSeconds) % 60;
  
  const hStr = h.toString().padStart(2, '0');
  const mStr = m.toString().padStart(2, '0');
  const sStr = s.toString().padStart(2, '0');
  
  return `${hStr}:${mStr}:${sStr}`;
}
