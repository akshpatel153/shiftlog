import { useState, useEffect } from 'react';
import { differenceInSeconds } from 'date-fns';
import { formatTimer, formatDuration } from '../utils/timeCalc';

interface LiveTimerProps {
  clockInTime: string | null;
  totalBreakSeconds: number;   
  isOnBreak: boolean;
  breakStartTime: string | null;
  status: 'active' | 'on_break' | 'idle';
}

export function LiveTimer({ clockInTime, totalBreakSeconds, isOnBreak, breakStartTime, status }: LiveTimerProps) {
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (status !== 'idle') {
      interval = setInterval(() => forceUpdate(n => n + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  let workedSeconds = 0;
  let currentBreakSeconds = 0;

  if (clockInTime) {
    workedSeconds = differenceInSeconds(new Date(), new Date(clockInTime)) - totalBreakSeconds;
    
    if (isOnBreak && breakStartTime) {
      currentBreakSeconds = differenceInSeconds(new Date(), new Date(breakStartTime));
      // Exclude current ongoing break from workedSeconds
      workedSeconds -= currentBreakSeconds;
    }
  }

  // Ensure no negative
  workedSeconds = Math.max(0, workedSeconds);
  
  const displayTime = status === 'idle' ? "00:00:00" : formatTimer(workedSeconds);
  const workedMinutes = Math.floor(workedSeconds / 60);

  return (
    <div className="live-timer-container">
      <div className={`timer-display ${status === 'idle' ? 'timer-idle' : 'timer-active'}`}>
        {displayTime}
      </div>
      
      {status !== 'idle' && (
        <div className="timer-subtext">
          {formatDuration(workedMinutes)} worked
        </div>
      )}

      {isOnBreak && (
        <div className="timer-break-display">
          Break: {formatTimer(currentBreakSeconds)}
        </div>
      )}
    </div>
  );
}
