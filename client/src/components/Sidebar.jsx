import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import {
  LayoutDashboard,
  Ship,
  Receipt,
  TrendingUp,
  Fuel,
  Users,
  Wrench,
  FileText,
  ShieldAlert,
  X
} from 'lucide-react';

export const MENU_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', marathi: 'डॅशबोर्ड व विश्लेषण', icon: LayoutDashboard },
  { id: 'boats', label: 'Boats', marathi: 'बोटींची माहिती', icon: Ship },
  { id: 'expenses', label: 'Daily Expenses', marathi: 'दैनंदिन खर्च नोंद', icon: Receipt },
  { id: 'income', label: 'Fish Sale Income', marathi: 'मासे विक्री जमा', icon: TrendingUp },
  { id: 'diesel', label: 'Diesel Tracker', marathi: 'डिझेल नोंद', icon: Fuel },
  { id: 'crew', label: 'Crew & Salaries', marathi: 'खलाशी व पगार नोंद', icon: Users },
  { id: 'maintenance', label: 'Maintenance', marathi: 'बोट दुरुस्ती व सर्व्हिसिंग', icon: Wrench },
  { id: 'reports', label: 'Reports & Analytics', marathi: 'रिपोर्ट्स व डाऊनलोड', icon: FileText },
];

export default function Sidebar({ currentPage, setCurrentPage, mobileOpen, setMobileOpen }) {
  const { user } = useContext(AuthContext);

  const items = [...MENU_ITEMS];
  if (user?.role === 'admin') {
    items.push({
      id: 'admin',
      label: 'Admin Panel',
      marathi: 'अ‍ॅडमिन पॅनेल व बॅकअप',
      icon: ShieldAlert,
      isAdminOnly: true
    });
  }

  const handleSelect = (id) => {
    setCurrentPage(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      <aside className="desktop-sidebar">
        <div style={{ padding: '0.5rem 0.75rem 1rem', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, letterSpacing: '1px', textTransform: 'uppercase' }}>
          MENU (मेनू)
        </div>

        {items.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleSelect(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                width: '100%',
                padding: '0.75rem 1rem',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                background: isActive
                  ? 'var(--bg-surface-elevated)'
                  : 'transparent',
                color: isActive ? 'var(--accent-cyan)' : 'var(--text-main)',
                borderLeft: isActive ? '4px solid var(--accent-cyan)' : '4px solid transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s ease'
              }}
            >
              <Icon size={20} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
              <div>
                <div style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.9rem' }}>
                  {item.label}
                </div>
                <div style={{ fontSize: '0.75rem', color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>
                  {item.marathi}
                </div>
              </div>
            </button>
          );
        })}
      </aside>

      {mobileOpen && (
        <div className="modal-overlay" style={{ alignItems: 'stretch', justifyContent: 'flex-start', padding: 0 }} onClick={() => setMobileOpen(false)}>
          <div
            style={{
              width: '80%',
              maxWidth: '300px',
              height: '100%',
              background: 'var(--bg-surface)',
              borderRight: '1px solid var(--border-color)',
              padding: '1.25rem 1rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              overflowY: 'auto'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--accent-cyan)' }}>SELECT MODULE</span>
              <button className="modal-close" onClick={() => setMobileOpen(false)}><X size={24} /></button>
            </div>

            {items.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.85rem',
                    width: '100%',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-sm)',
                    border: 'none',
                    background: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isActive ? 'var(--accent-cyan)' : 'var(--text-main)',
                    borderLeft: isActive ? '4px solid var(--accent-cyan)' : '4px solid transparent',
                    textAlign: 'left'
                  }}
                >
                  <Icon size={20} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
                  <div>
                    <div style={{ fontWeight: isActive ? 700 : 500, fontSize: '0.95rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.marathi}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
