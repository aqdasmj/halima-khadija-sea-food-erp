import React from 'react';

export default function KPICard({ title, marathiTitle, value, changePct, icon: Icon, color, subtitle }) {
  const isPositive = changePct >= 0;

  return (
    <div className="glass-card" style={{ flex: 1, minWidth: '220px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute',
        top: '-15px',
        right: '-15px',
        width: '70px',
        height: '70px',
        borderRadius: '50%',
        background: color || 'var(--accent-cyan)',
        opacity: 0.12,
        pointerEvents: 'none'
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
        <div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>{title}</span>
          <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', display: 'block', fontWeight: 600 }}>{marathiTitle}</span>
        </div>
        {Icon && (
          <div style={{
            padding: '0.5rem',
            borderRadius: '10px',
            background: 'var(--bg-surface-elevated)',
            color: color || 'var(--accent-cyan)'
          }}>
            <Icon size={22} />
          </div>
        )}
      </div>

      <div style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
        {value}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.8rem' }}>
        {changePct !== undefined && (
          <span style={{
            fontWeight: 700,
            color: isPositive ? 'var(--accent-emerald)' : 'var(--accent-rose)',
            background: isPositive ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
            padding: '0.15rem 0.5rem',
            borderRadius: '12px'
          }}>
            {isPositive ? `+${changePct}%` : `${changePct}%`} vs last month
          </span>
        )}
        {subtitle && (
          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{subtitle}</span>
        )}
      </div>
    </div>
  );
}
