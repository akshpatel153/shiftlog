import type { ReactNode } from 'react';
import './Cards.css';

interface SummaryCardProps {
  label: string;
  value: string;
  icon?: ReactNode;
  colorClass?: string;
}

export function SummaryCard({ label, value, icon, colorClass = "" }: SummaryCardProps) {
  return (
    <div className={`glass-panel card summary-card ${colorClass}`}>
      <div className="summary-header">
        <div className="summary-label text-secondary">{label}</div>
        {icon && <div className="summary-icon">{icon}</div>}
      </div>
      <div className="summary-value">{value}</div>
    </div>
  );
}
