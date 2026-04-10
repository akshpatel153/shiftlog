import type { ShiftWithBreaks } from '../types';
import { formatPay, formatDuration } from './timeCalc';

export function exportCSV(shifts: ShiftWithBreaks[], startDate: string, endDate: string) {
  const headers = ['Date', 'Clock In', 'Clock Out', 'Worked (minutes)', 'Break (minutes)', 'Estimated Pay'];
  
  const rows = shifts.map(s => {
    const dateStr = s.clock_in.split('T')[0];
    const clockInStr = new Date(s.clock_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
    const clockOutStr = s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }) : '';
    
    return [
      dateStr,
      clockInStr,
      clockOutStr,
      s.total_worked_minutes.toString(),
      s.total_break_minutes.toString(),
      s.estimated_pay.toFixed(2)
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ShiftLog_Timesheet_${startDate}_to_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function exportPDF(shifts: ShiftWithBreaks[], startDate: string, endDate: string, hourlyRate: number, currencySymbol: string) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert("Please allow popups to print/export to PDF.");
    return;
  }
  
  const todayStr = new Date().toLocaleDateString();
  
  let rowsHtml = '';
  let totalWorked = 0;
  let totalBreak = 0;
  let totalPay = 0;
  
  shifts.forEach(s => {
    totalWorked += s.total_worked_minutes;
    totalBreak += s.total_break_minutes;
    totalPay += s.estimated_pay;
    
    const d = new Date(s.clock_in);
    const dateStr = d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
    const inTime = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' });
    const outTime = s.clock_out ? new Date(s.clock_out).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }) : 'Ongoing';
    
    rowsHtml += `
      <tr>
        <td>${dateStr}</td>
        <td>${inTime}</td>
        <td>${outTime}</td>
        <td>${formatDuration(s.total_worked_minutes)}</td>
        <td>${formatDuration(s.total_break_minutes)}</td>
        <td>${formatPay(s.estimated_pay, currencySymbol)}</td>
      </tr>
    `;
  });

  const htmlContent = `
    <html>
      <head>
        <title>ShiftLog Timesheet</title>
        <style>
          body { font-family: sans-serif; padding: 20px; color: #333; }
          h1 { margin-bottom: 5px; }
          h3 { color: #666; font-weight: normal; margin-top: 0; }
          .meta { margin-bottom: 20px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { text-align: left; padding: 10px; border-bottom: 1px solid #ccc; }
          th { font-weight: bold; background-color: #f9f9f9; }
          .totals { font-weight: bold; }
        </style>
      </head>
      <body>
        <h1>SHIFTLOG TIMESHEET</h1>
        <h3>Employee Timesheet — ${startDate} to ${endDate}</h3>
        <div class="meta">
          <div><strong>Exported:</strong> ${todayStr}</div>
          <div><strong>Hourly Rate:</strong> ${formatPay(hourlyRate, currencySymbol)}</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>DATE</th>
              <th>IN</th>
              <th>OUT</th>
              <th>WORKED</th>
              <th>BREAKS</th>
              <th>PAY</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
            <tr class="totals">
              <td colspan="3">TOTAL</td>
              <td>${formatDuration(totalWorked)}</td>
              <td>${formatDuration(totalBreak)}</td>
              <td>${formatPay(totalPay, currencySymbol)}</td>
            </tr>
          </tbody>
        </table>
        <script>
          window.onload = function() { window.print(); window.close(); }
        </script>
      </body>
    </html>
  `;
  
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
