import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Anchor, ShieldCheck, UserCheck, Lock, User, MapPin } from 'lucide-react';

export default function Login() {
  const { login } = useContext(AuthContext);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const fillCredentials = (user, pass) => {
    setUsername(user);
    setPassword(pass);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      padding: '1.5rem'
    }}>
      <div className="glass-card" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, var(--accent-cyan), var(--accent-blue))',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(0, 210, 255, 0.4)',
            marginBottom: '1rem'
          }}>
            <Anchor size={32} color="#fff" />
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
            BOAT FINANCE MANAGER
          </h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', fontWeight: 600, display: 'block', marginTop: '0.2rem' }}>
            बोट फायनान्स मॅनेजर (साखरी नाटे)
          </span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.4rem' }}>
            <MapPin size={12} color="var(--accent-cyan)" /> Private Local Server • Sakhri Nate, Ratnagiri
          </span>
        </div>

        {error && (
          <div style={{
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#f43f5e',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem',
            marginBottom: '1.25rem',
            textAlign: 'center',
            fontWeight: 700
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username / युझरनेम</label>
            <div style={{ position: 'relative' }}>
              <User size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label>Password / पासवर्ड</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} color="var(--text-muted)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="password"
                className="form-control"
                style={{ paddingLeft: '2.75rem' }}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem', padding: '0.85rem' }}
          >
            {loading ? 'Authenticating...' : 'Sign In / लॉगिन करा'}
          </button>
        </form>

        <div style={{ marginTop: '2rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, display: 'block', marginBottom: '0.75rem', textAlign: 'center' }}>
            QUICK DEMO LOGINS (जलद प्रवेश):
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
            <button
              type="button"
              onClick={() => fillCredentials('admin', 'admin123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.2rem' }}
            >
              <ShieldCheck size={14} color="#f43f5e" />
              Admin
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('distributor', 'dist123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.2rem' }}
            >
              <UserCheck size={14} color="#f59e0b" />
              Distributor
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('manager', 'manager123')}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.75rem', padding: '0.5rem 0.2rem' }}
            >
              <UserCheck size={14} color="var(--accent-cyan)" />
              Manager
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
