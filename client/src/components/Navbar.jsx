import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Menu, LogOut, Anchor, UserCheck, Shield } from 'lucide-react';
import ThemeSelector from './ThemeSelector';

export default function Navbar({ onToggleMobileMenu }) {
  const { user, logout } = useContext(AuthContext);

  return (
    <header className="navbar-container" style={{ background: 'var(--bg-surface)', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 100 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <button
          onClick={onToggleMobileMenu}
          style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '0.2rem' }}
          aria-label="Toggle Navigation Menu"
        >
          <Menu size={22} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #00d2ff, #0080ff)', padding: '0.45rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0, 210, 255, 0.4)' }}>
            <Anchor size={20} color="#ffffff" />
          </div>
          <div>
            <h1 style={{ fontSize: 'clamp(0.78rem, 2.5vw, 1.05rem)', fontWeight: 800, tracking: '0.02em', margin: 0, color: 'var(--text-main)', display: 'inline-block', whiteSpace: 'nowrap' }}>
              HALIMA KHADIJA SEA FOOD
            </h1>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', tracking: '0.12em', color: 'var(--accent-cyan)', fontWeight: 700, marginTop: '-2px' }}>
              ENTERPRISE ERP
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <ThemeSelector />

        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', background: 'rgba(255,255,255,0.04)', padding: '0.35rem 0.75rem', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', lineHeight: 1.2 }}>{user.name}</span>
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: user.role === 'admin' ? '#f43f5e' : 'var(--accent-cyan)', fontWeight: 700 }}>
                {user.role === 'admin' ? 'ADMIN' : 'MANAGER'}
              </span>
            </div>
            <button
              onClick={logout}
              title="Logout"
              style={{ background: 'rgba(244, 63, 94, 0.15)', border: 'none', color: '#f43f5e', padding: '0.4rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
