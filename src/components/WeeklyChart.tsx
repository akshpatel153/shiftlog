import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from 'recharts';
import { eachDayOfInterval, subDays, format, isSameDay, parseISO } from 'date-fns';
import type { ShiftWithBreaks } from '../types';

interface WeeklyChartProps {
  shifts: ShiftWithBreaks[];
}

export function WeeklyChart({ shifts }: WeeklyChartProps) {
  // Compute chart data: last 7 days (including today)
  const chartData = useMemo(() => {
    const today = new Date();
    const last7Days = eachDayOfInterval({
      start: subDays(today, 6),
      end: today,
    });

    return last7Days.map(day => {
      // Find all shifts that happened on this day
      const shiftsOnDay = shifts.filter(s => isSameDay(parseISO(s.clock_in), day));
      
      // Accumulate worked hours across multiple shifts if they worked >1 times a day
      const totalMinutes = shiftsOnDay.reduce((acc, s) => acc + s.total_worked_minutes, 0);
      const hoursWorked = Number((totalMinutes / 60).toFixed(1));

      return {
        name: format(day, 'EEE'), // e.g. "Mon"
        hours: hoursWorked,
        fullDate: format(day, 'MMM d')
      };
    });
  }, [shifts]);

  // Pastel Color Palette
  const gradientId = "pastelGradient";

  return (
    <div className="weekly-chart-container" style={{ width: '100%', height: 260, marginTop: '2rem' }}>
      <div className="chart-header" style={{ marginBottom: '1rem', paddingLeft: '0.5rem' }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--color-primary)', fontWeight: 700, margin: 0 }}>This Week</h3>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Hours worked</p>
      </div>

      <ResponsiveContainer width="100%" height="80%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f472b6" />    {/* Soft Pink */}
              <stop offset="50%" stopColor="#818cf8" />   {/* Soft Indigo */}
              <stop offset="100%" stopColor="#34d399" />  {/* Soft Mint */}
            </linearGradient>
            
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Very faint horizontal grid lines */}
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-outline-variant)" />

          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
            dy={10}
          />

          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: 'var(--color-text-muted)', fontSize: 12 }} 
            tickFormatter={(val) => `${val}h`}
          />

          <Tooltip 
            contentStyle={{ 
              backgroundColor: 'var(--glass-bg)', 
              borderRadius: '8px', 
              border: '1px solid var(--color-outline-variant)',
              boxShadow: 'var(--shadow-ambient)',
              color: 'var(--color-text)'
            }}
            itemStyle={{ color: 'var(--color-primary)', fontWeight: 'bold' }}
            cursor={{ stroke: 'var(--color-outline)', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value: any) => [`${value} hrs`, 'Worked']}
            labelFormatter={(label, payload) => {
              if (payload && payload.length > 0) {
                return payload[0].payload.fullDate;
              }
              return label;
            }}
          />

          <Line 
            type="monotone" 
            dataKey="hours" 
            stroke={`url(#${gradientId})`} 
            strokeWidth={4}
            dot={{ r: 4, strokeWidth: 2, fill: 'var(--color-surface)', stroke: '#34d399' }} 
            activeDot={{ r: 6, fill: '#818cf8', stroke: 'var(--color-surface)', strokeWidth: 2, filter: 'url(#glow)' }}
            animationDuration={1500}
            animationEasing="ease-in-out"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
