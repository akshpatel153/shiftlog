import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Shift, Break } from '../types';
import { getActiveShift, getActiveBreak, clockIn as dbClockIn, clockOut as dbClockOut, startBreak as dbStartBreak, endBreak as dbEndBreak } from '../db/db';
import { differenceInHours } from 'date-fns';

interface ShiftContextValue {
  activeShift: Shift | null;
  activeBreak: Break | null;
  clockIn: () => Promise<void>;
  clockOut: () => Promise<void>;
  startBreak: () => Promise<void>;
  endBreak: () => Promise<void>;
  refreshActiveShift: () => Promise<void>;
}

const ShiftContext = createContext<ShiftContextValue | undefined>(undefined);

export function ShiftProvider({ children }: { children: ReactNode }) {
  const [activeShift, setActiveShift] = useState<Shift | null>(null);
  const [activeBreak, setActiveBreak] = useState<Break | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Checks and handles the stale shift auto-complete 
  const checkStaleShift = async (shift: Shift) => {
    const shiftStart = new Date(shift.clock_in);
    if (differenceInHours(new Date(), shiftStart) > 16) {
      const { supabase } = await import('../supabase');
      
      const eightHoursLater = new Date(shiftStart.getTime() + 8 * 60 * 60 * 1000);
      
      const ab = await getActiveBreak(shift.id!);
      if (ab && ab.id) {
        await supabase.from('breaks').update({ end_time: eightHoursLater.toISOString() }).eq('id', ab.id);
      }
      await supabase.from('shifts').update({
        clock_out: eightHoursLater.toISOString(),
        status: 'completed'
      }).eq('id', shift.id!);
      alert("We auto-completed your previous shift. Tap History to review.");
      return null;
    }
    return shift;
  };

  const refreshActiveShift = async () => {
    let currentShift = await getActiveShift();
    if (currentShift) {
       currentShift = await checkStaleShift(currentShift);
    }
    
    setActiveShift(currentShift);
    if (currentShift && currentShift.id) {
      const b = await getActiveBreak(currentShift.id);
      setActiveBreak(b);
    } else {
      setActiveBreak(null);
    }
    setIsReady(true);
  };

  useEffect(() => {
    refreshActiveShift();
    // Also periodically refresh
    const interval = setInterval(refreshActiveShift, 60000);
    return () => clearInterval(interval);
  }, []);

  const clockIn = async () => {
    try {
      const data = await dbClockIn();
      setActiveShift(data);
      setActiveBreak(null);
    } catch (e) {
      console.error(e);
      await refreshActiveShift(); // fallback
    }
  };

  const clockOut = async () => {
    if (activeShift && activeShift.id) {
      try {
        await dbClockOut(activeShift.id);
        setActiveShift(null);
        setActiveBreak(null);
      } catch (e) {
        console.error(e);
        await refreshActiveShift();
      }
    }
  };

  const startBreak = async () => {
    if (activeShift && activeShift.id) {
      try {
        const breakData = await dbStartBreak(activeShift.id);
        setActiveShift({ ...activeShift, status: 'on_break' });
        setActiveBreak(breakData);
      } catch (e) {
        console.error(e);
        await refreshActiveShift();
      }
    }
  };

  const endBreak = async () => {
    if (activeShift && activeShift.id && activeBreak && activeBreak.id) {
      try {
        await dbEndBreak(activeBreak.id, activeShift.id);
        setActiveShift({ ...activeShift, status: 'active' });
        setActiveBreak(null);
      } catch (e) {
        console.error(e);
        await refreshActiveShift();
      }
    }
  };

  if(!isReady) return null; // Prevent UI rendering until db init

  return (
    <ShiftContext.Provider value={{ activeShift, activeBreak, clockIn, clockOut, startBreak, endBreak, refreshActiveShift }}>
      {children}
    </ShiftContext.Provider>
  );
}

export function useShift() {
  const ctx = useContext(ShiftContext);
  if (!ctx) throw new Error("useShift must be used within ShiftProvider");
  return ctx;
}
