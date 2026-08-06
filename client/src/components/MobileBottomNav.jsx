import React from 'react';
import { LayoutDashboard, Receipt, TrendingUp, Fuel, Menu } from 'lucide-react';

export default function MobileBottomNav({ currentPage, setCurrentPage, onToggleMore }) {
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'income', label: 'Income', icon: TrendingUp },
    { id: 'diesel', label: 'Diesel', icon: Fuel },
  ];

  return (
    <nav className="mobile-bottom-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPage === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => setCurrentPage(tab.id)}
            className={`mobile-nav-item ${isActive ? 'active' : ''}`}
          >
            <Icon size={20} color={isActive ? 'var(--accent-cyan)' : 'var(--text-muted)'} />
            <span style={{ color: isActive ? 'var(--accent-cyan)' : 'var(--text-muted)' }}>{tab.label}</span>
          </button>
        );
      })}

      <button
        onClick={onToggleMore}
        className="mobile-nav-item"
      >
        <Menu size={20} color="var(--text-muted)" />
        <span style={{ color: 'var(--text-muted)' }}>More</span>
      </button>
    </nav>
  );
}
