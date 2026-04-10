import { getAllShifts, getBreaksForShift } from '../db/db';
import type { ShiftWithBreaks } from '../types';
import { calculateWorkedMinutes, calculateBreakMinutes, calculateEstimatedPay } from './timeCalc';

export async function fetchAllShiftsWithBreaks(hourlyRate: number, paidBreaks: boolean): Promise<ShiftWithBreaks[]> {
  const shifts = await getAllShifts();
  const enhancedShifts: ShiftWithBreaks[] = [];

  for (const shift of shifts) {
    const breaks = await getBreaksForShift(shift.id!);
    const workedMins = calculateWorkedMinutes(shift, breaks);
    const breakMins = calculateBreakMinutes(breaks);
    const payMins = paidBreaks ? (workedMins + breakMins) : workedMins;
    const pay = calculateEstimatedPay(payMins, hourlyRate);
    
    enhancedShifts.push({
      ...shift,
      breaks,
      total_worked_minutes: workedMins,
      total_break_minutes: breakMins,
      estimated_pay: pay
    });
  }
  
  return enhancedShifts;
}
