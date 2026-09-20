import React from 'react';
export default function StatCard({ title, value, subtitle, icon, trend, className='' }) {
  return <div className={`stat-card ${className}`}>
    <div className="stat-icon"><i className={`bi ${icon}`} /></div>
    <div className="stat-content"><span>{title}</span><strong>{value}</strong><small>{subtitle}</small></div>
    {trend && <div className={`trend ${trend.startsWith('+') ? 'up' : 'down'}`}>{trend}</div>}
  </div>;
}