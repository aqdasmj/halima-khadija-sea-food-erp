import React, { useState } from 'react';
import { getAuthToken } from '../utils/api';
import { Sun, Moon, Palette } from 'lucide-react';

export default function ThemeSelector() {
  const [theme, setTheme] = useState(() => localStorage.getItem('erp_theme') || 'light');

  const applyTheme = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('erp_theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  return (
    <button
      onClick={() => applyTheme(theme === 'light' ? 'dark' : 'light')}
      title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
      style={{
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: 'var(--text-main)',
        padding: '0.45rem 0.75rem',
        borderRadius: '20px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '0.4rem',
        fontSize: '0.8rem',
        fontWeight: 600
      }}
    >
      {theme === 'light' ? <Sun size={15} color="#f59e0b" /> : <Moon size={15} color="#3b82f6" />}
      <span>{theme === 'light' ? '☀️ Light' : '🌙 Dark'}</span>
    </button>
  );
}
