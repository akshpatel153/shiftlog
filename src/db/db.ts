import { supabase } from '../supabase';
import type { Shift, Break } from '../types';

async function getUserId() {
  const { data } = await supabase.auth.getUser();
  if (!data?.user?.id) throw new Error("Not logged in");
  return data.user.id;
}

export async function getActiveShift() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .in('status', ['active', 'on_break'])
    .order('clock_in', { ascending: false })
    .limit(1);
    
  if (error) {
    console.error(error);
    return null;
  }
  return data && data.length > 0 ? (data[0] as Shift) : null;
}

export async function clockIn(notes: string | null = null) {
  const userId = await getUserId();
  const active = await getActiveShift();
  if (active) throw new Error("A shift is already active");

  const { data, error } = await supabase
    .from('shifts')
    .insert({
      user_id: userId,
      clock_in: new Date().toISOString(),
      clock_out: null,
      status: 'active',
      notes: notes
    })
    .select()
    .single();
    
  if (error) throw error;
  return data;
}

export async function clockOut(shiftId: number) {
  const activeBreak = await getActiveBreak(shiftId);
  if (activeBreak && activeBreak.id) {
    await endBreak(activeBreak.id, shiftId);
  }

  const { error } = await supabase
    .from('shifts')
    .update({
      clock_out: new Date().toISOString(),
      status: 'completed'
    })
    .eq('id', shiftId);

  if (error) throw error;
}

export async function startBreak(shiftId: number) {
  const userId = await getUserId();
  
  const { data, error: breakError } = await supabase
    .from('breaks')
    .insert({
      user_id: userId,
      shift_id: shiftId,
      start_time: new Date().toISOString(),
      end_time: null
    })
    .select()
    .single();
    
  if (breakError) throw breakError;

  const { error: shiftError } = await supabase
    .from('shifts')
    .update({ status: 'on_break' })
    .eq('id', shiftId);
    
    
  if (shiftError) throw shiftError;
  return data;
}

export async function endBreak(breakId: number, shiftId: number) {
  const { error: breakError } = await supabase
    .from('breaks')
    .update({
      end_time: new Date().toISOString()
    })
    .eq('id', breakId);
    
  if (breakError) throw breakError;

  const { error: shiftError } = await supabase
    .from('shifts')
    .update({ status: 'active' })
    .eq('id', shiftId);
    
  if (shiftError) throw shiftError;
}

export async function getActiveBreak(shiftId: number) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('breaks')
    .select('*')
    .eq('user_id', userId)
    .eq('shift_id', shiftId)
    .is('end_time', null)
    .limit(1);
    
  if (error) return null;
  return data && data.length > 0 ? (data[0] as Break) : null;
}

export async function getAllShifts() {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('shifts')
    .select('*')
    .eq('user_id', userId)
    .order('clock_in', { ascending: false });
    
  if (error) return [];
  return data as Shift[];
}

export async function getBreaksForShift(shiftId: number) {
  const userId = await getUserId();
  const { data, error } = await supabase
    .from('breaks')
    .select('*')
    .eq('user_id', userId)
    .eq('shift_id', shiftId)
    .order('start_time', { ascending: true });
    
  if (error) return [];
  return data as Break[];
}

export async function deleteShift(shiftId: number) {
  // breaks belong to shift and cascade automatically per SQL schema
  const { error } = await supabase
    .from('shifts')
    .delete()
    .eq('id', shiftId);
    
  if (error) throw error;
}

export async function addManualShift(clockIn: string, clockOut: string, breakMinutes: number, notes?: string) {
  const userId = await getUserId();
  
  const { data, error: shiftError } = await supabase
    .from('shifts')
    .insert({
      user_id: userId,
      clock_in: clockIn,
      clock_out: clockOut,
      status: 'completed',
      notes: notes || 'Manual entry'
    })
    .select()
    .single();

  if (shiftError) throw shiftError;
  const shiftId = data.id;

  if (breakMinutes > 0 && typeof shiftId === 'number') {
    const inTime = new Date(clockIn).getTime();
    const outTime = new Date(clockOut).getTime();
    const shiftMidpoint = inTime + (outTime - inTime) / 2;
    
    const breakMs = breakMinutes * 60 * 1000;
    const breakStart = new Date(shiftMidpoint - (breakMs / 2)).toISOString();
    const breakEnd = new Date(shiftMidpoint + (breakMs / 2)).toISOString();

    await supabase
      .from('breaks')
      .insert({
        user_id: userId,
        shift_id: shiftId,
        start_time: breakStart,
        end_time: breakEnd
      });
  }
}
