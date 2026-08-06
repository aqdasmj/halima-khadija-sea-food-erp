import React from 'react';
import { AlertTriangle, AlertCircle, Info, Sparkles } from 'lucide-react';

export default function SmartAlerts({ suggestions }) {
  if (!suggestions || suggestions.length === 0) return null;

  const getStyle = (type) => {
    switch (type) {
      case 'warning':
        return { bg: 'rgba(245, 158, 11, 0.12)', border: 'rgba(245, 158, 11, 0.4)', color: '#fcd34d', icon: AlertTriangle };
      case 'alert':
        return { bg: 'rgba(244, 63, 94, 0.12)', border: 'rgba(244, 63, 94, 0.4)', color: '#fda4af', icon: AlertCircle };
      default:
        return { bg: 'rgba(0, 210, 255, 0.12)', border: 'rgba(0, 210, 255, 0.4)', color: '#7dd3fc', icon: Info };
    }
  };

  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
        <Sparkles size={20} color="#00d2ff" />
        <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
          AUTOMATED BUSINESS INSIGHTS & ALERTS (स्वयंचलित व्यवसाय सूचना)
        </h3>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {suggestions.map((item, idx) => {
          const style = getStyle(item.type);
          const Icon = style.icon;

          return (
            <div
              key={idx}
              style={{
                background: style.bg,
                borderLeft: `4px solid ${style.color}`,
                border: `1px solid ${style.border}`,
                borderLeftWidth: '5px',
                borderRadius: 'var(--radius-sm)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.85rem'
              }}
            >
              <Icon size={22} color={style.color} style={{ marginTop: '2px', flexShrink: 0 }} />
              <div>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: style.color, marginBottom: '0.15rem' }}>
                  {item.title}
                </h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: '1.4' }}>
                  {item.text}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
