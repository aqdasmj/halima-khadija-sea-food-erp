import React, { useState, useContext } from 'react';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MobileBottomNav from './components/MobileBottomNav';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import BoatsPage from './pages/BoatsPage';
import ExpensesPage from './pages/ExpensesPage';
import IncomePage from './pages/IncomePage';
import DieselPage from './pages/DieselPage';
import CrewPage from './pages/CrewPage';
import MaintenancePage from './pages/MaintenancePage';
import ReportsPage from './pages/ReportsPage';
import AdminPanel from './pages/AdminPanel';
import DistributorDashboard from './pages/DistributorDashboard';

function MainApp() {
  const { user, loading } = useContext(AuthContext);
  const [activeModule, setActiveModule] = useState('boat'); // 'boat' | 'distributor'
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a1128', color: '#00d2ff', fontSize: '1.2rem', fontWeight: 'bold' }}>
        Loading Enterprise ERP...
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    if (activeModule === 'distributor') {
      return <DistributorDashboard onSwitchModule={setActiveModule} />;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'boats':
        return <BoatsPage />;
      case 'expenses':
        return <ExpensesPage />;
      case 'income':
        return <IncomePage />;
      case 'diesel':
        return <DieselPage />;
      case 'crew':
        return <CrewPage />;
      case 'maintenance':
        return <MaintenancePage />;
      case 'reports':
        return <ReportsPage />;
      case 'admin':
        return user.role === 'admin' ? <AdminPanel /> : <Dashboard />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-primary)' }}>
      <Navbar onToggleMobileMenu={() => setMobileMenuOpen(!mobileMenuOpen)} />

      <div style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0.4rem 1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
        <button
          onClick={() => { setActiveModule('boat'); setCurrentPage('dashboard'); }}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            border: activeModule === 'boat' ? '1px solid var(--accent-cyan)' : '1px solid transparent',
            background: activeModule === 'boat' ? 'rgba(0,210,255,0.15)' : 'transparent',
            color: activeModule === 'boat' ? 'var(--accent-cyan)' : 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          ⛵ Boat Finance
        </button>
        <button
          onClick={() => setActiveModule('distributor')}
          style={{
            padding: '0.4rem 1rem',
            borderRadius: '20px',
            border: activeModule === 'distributor' ? '1px solid #10b981' : '1px solid transparent',
            background: activeModule === 'distributor' ? 'rgba(16,185,129,0.15)' : 'transparent',
            color: activeModule === 'distributor' ? '#10b981' : 'var(--text-muted)',
            fontSize: '0.85rem',
            fontWeight: 700,
            cursor: 'pointer'
          }}
        >
          📦 Distributor ERP (HK Traders)
        </button>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        {activeModule === 'boat' && (
          <Sidebar
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            mobileOpen={mobileMenuOpen}
            setMobileOpen={setMobileMenuOpen}
          />
        )}
        <main className="main-content" style={{ width: activeModule === 'distributor' ? '100%' : undefined }}>
          {renderContent()}
        </main>
      </div>

      {activeModule === 'boat' && (
        <MobileBottomNav
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          onToggleMore={() => setMobileMenuOpen(true)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
