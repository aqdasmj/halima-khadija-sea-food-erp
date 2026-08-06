import React, { useState, useEffect } from 'react';
import { apiFetch, getAuthToken } from '../utils/api';
import { ShieldCheck, Lock, Unlock, Download, Upload, UserPlus, Trash2, Edit2, Key, CheckCircle, RefreshCw, X, FileSpreadsheet, AlertTriangle } from 'lucide-react';

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [locks, setLocks] = useState([]);
  const [loading, setLoading] = useState(true);

  const [targetMonth, setTargetMonth] = useState('2026-07');

  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('finance_manager');
  const [formError, setFormError] = useState('');

  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [passMsg, setPassMsg] = useState('');

  const [restoreFile, setRestoreFile] = useState(null);
  const [restoreMsg, setRestoreMsg] = useState('');

  const [resetTarget, setResetTarget] = useState('all');
  const [beforeDate, setBeforeDate] = useState('2026-07-01');
  const [showResetModal, setShowResetModal] = useState(false);
  const [adminConfirmPassword, setAdminConfirmPassword] = useState('');
  const [resetMsg, setResetMsg] = useState('');
  const [resetError, setResetError] = useState('');

  const fetchAdminData = async () => {
    try {
      const u = await apiFetch('/users');
      const l = await apiFetch('/admin/locks');
      setUsers(u);
      setLocks(l);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleLock = async (monthStr, currentStatus) => {
    const nextStatus = currentStatus === 'locked' ? 'unlocked' : 'locked';
    try {
      await apiFetch('/admin/toggle-lock', {
        method: 'POST',
        body: JSON.stringify({ year_month: monthStr, status: nextStatus })
      });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openAddUserModal = () => {
    setEditingUser(null);
    setUsername('');
    setPassword('');
    setName('');
    setRole('finance_manager');
    setFormError('');
    setShowUserModal(true);
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      if (editingUser) {
        await apiFetch(`/users/${editingUser.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name, role, password: password || undefined })
        });
      } else {
        await apiFetch('/users', {
          method: 'POST',
          body: JSON.stringify({ username, password, name, role })
        });
      }

      setShowUserModal(false);
      fetchAdminData();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Delete this user account?')) return;
    try {
      await apiFetch(`/users/${id}`, { method: 'DELETE' });
      fetchAdminData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadExcelBackup = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/export-excel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        window.open(`/api/admin/export-excel?token=${token}`, '_blank');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Halima_Khadija_Sea_Food_Master_Backup_${new Date().toISOString().substring(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Excel Backup Error: ' + err.message);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const token = getAuthToken();
      const res = await fetch('/api/admin/backup', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        window.open(`/api/admin/backup?token=${token}`, '_blank');
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `boat_finance_backup_${new Date().toISOString().substring(0, 10)}.db`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Backup Error: ' + err.message);
    }
  };

  const handleRestoreDatabase = async (e) => {
    e.preventDefault();
    if (!restoreFile) {
      alert('Please select a database backup file first');
      return;
    }

    if (!window.confirm('WARNING: Restoring database will overwrite all existing local data. Continue?')) {
      return;
    }

    setRestoreMsg('Restoring database...');
    try {
      const formData = new FormData();
      formData.append('dbfile', restoreFile);
      const token = getAuthToken();

      const res = await fetch('/api/admin/restore', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Restore failed');
      setRestoreMsg(data.message);
      fetchAdminData();
    } catch (err) {
      setRestoreMsg('Error: ' + err.message);
    }
  };

  const handleExecuteResetData = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetMsg('');

    try {
      const data = await apiFetch('/admin/reset-data', {
        method: 'POST',
        body: JSON.stringify({
          adminPassword: adminConfirmPassword,
          resetTarget,
          beforeDate
        })
      });

      setResetMsg(data.message);
      setShowResetModal(false);
      setAdminConfirmPassword('');
      fetchAdminData();
    } catch (err) {
      setResetError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ShieldCheck color="#f43f5e" size={26} /> ADMIN SECURITY & DATABASE PANEL
        </h2>
        <span style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
          अ‍ॅडमिन सुरक्षा, महिना लॉक, बॅकअप व पासवर्ड सुरक्षा डेटा रीसेट
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lock size={20} color="#f59e0b" /> Monthly Record Locking
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1rem' }}>
            महिना लॉक केल्यास फायनान्स मॅनेजर जुन्या नोंदी बदलू शकत नाहीत.
          </span>

          <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
            <input
              type="month"
              className="form-control"
              value={targetMonth}
              onChange={(e) => setTargetMonth(e.target.value)}
            />
            <button
              className="btn btn-warning"
              onClick={() => handleToggleLock(targetMonth, locks.find(l => l.year_month === targetMonth)?.status)}
            >
              Toggle Lock
            </button>
          </div>

          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Status</th>
                  <th>Locked By</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {locks.length === 0 ? (
                  <tr><td colSpan="4" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No months locked yet.</td></tr>
                ) : (
                  locks.map(l => (
                    <tr key={l.id}>
                      <td style={{ fontWeight: 700 }}>{l.year_month}</td>
                      <td>
                        <span className={l.status === 'locked' ? 'badge badge-danger' : 'badge badge-success'}>
                          {l.status === 'locked' ? <Lock size={10} /> : <Unlock size={10} />}
                          {l.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>{l.locked_by || 'Admin'}</td>
                      <td>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleLock(l.year_month, l.status)}
                        >
                          {l.status === 'locked' ? 'Unlock' : 'Lock'}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="glass-card">
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={20} color="#10b981" /> Database Backup & Excel Export
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1.25rem' }}>
            संपूर्ण डेटाबेस एका क्लिकवर एक्सेल शीट (.xlsx) किंवा .db फाईलमध्ये डाऊनलोड करा.
          </span>

          <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'rgba(16,185,129,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16,185,129,0.3)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#059669', marginBottom: '0.35rem' }}>📊 Download Backup (Excel Sheet .xlsx)</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Download full multi-sheet Excel workbook of all boat & distributor records.</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button className="btn btn-success" onClick={handleDownloadExcelBackup}>
                <FileSpreadsheet size={16} /> Download Excel (.xlsx)
              </button>
              <button className="btn btn-secondary" onClick={handleDownloadBackup}>
                <Download size={16} /> Raw Database (.db)
              </button>
            </div>
          </div>

          <div style={{ padding: '1rem', background: 'rgba(244,63,94,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(244,63,94,0.3)' }}>
            <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e11d48', marginBottom: '0.35rem' }}>Restore Database File</h4>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>Upload a saved .db backup file to restore database.</p>

            <form onSubmit={handleRestoreDatabase}>
              <input
                type="file"
                accept=".db,.sqlite"
                className="form-control"
                style={{ marginBottom: '0.75rem' }}
                onChange={(e) => setRestoreFile(e.target.files[0])}
              />
              <button type="submit" className="btn btn-danger btn-sm">
                <Upload size={14} /> Restore Database
              </button>
            </form>

            {restoreMsg && (
              <div style={{ marginTop: '0.75rem', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 600 }}>
                {restoreMsg}
              </div>
            )}
          </div>
        </div>

        <div className="glass-card" style={{ border: '1px solid rgba(239, 68, 68, 0.4)' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.25rem', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#ef4444" /> Data Reset & Selective Erasure
          </h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginBottom: '1.25rem' }}>
            पासवर्डद्वारे सुरक्षितपणे डेटा हटवा किंवा फॅक्टरी रीसेट करा.
          </span>

          <div style={{ padding: '1rem', background: 'rgba(239,68,68,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <div className="form-group" style={{ marginBottom: '0.8rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'block' }}>Select Erasure Target / सेगमेंट निवडा</label>
              <select className="form-control" value={resetTarget} onChange={(e) => setResetTarget(e.target.value)}>
                <option value="all">🔥 COMPLETE FACTORY RESET (Erase All Business Records)</option>
                <option value="boat_finance">⛵ Boat Finance Only (Expenses, Income, Fuel, Maintenance)</option>
                <option value="distributor">📦 Distributor ERP Only (Parties, Stock, Invoices, Payments)</option>
                <option value="crew">👥 Crew & Salary Loans Only</option>
                <option value="date_range">📅 Date Cutoff Erasure (Erase all entries before date)</option>
              </select>
            </div>

            {resetTarget === 'date_range' && (
              <div className="form-group" style={{ marginBottom: '0.8rem' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.3rem', display: 'block' }}>Erase All Records Before Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={beforeDate}
                  onChange={(e) => setBeforeDate(e.target.value)}
                />
              </div>
            )}

            <button
              className="btn btn-danger"
              style={{ width: '100%', marginTop: '0.5rem', fontWeight: 700 }}
              onClick={() => { setAdminConfirmPassword(''); setResetError(''); setShowResetModal(true); }}
            >
              <Trash2 size={16} /> Erase Selected Data
            </button>

            {resetMsg && (
              <div style={{ marginTop: '0.75rem', padding: '0.6rem', borderRadius: '6px', background: 'rgba(16,185,129,0.15)', border: '1px solid #10b981', color: '#10b981', fontSize: '0.8rem', fontWeight: 700 }}>
                {resetMsg}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <div>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>User Accounts & Access Control</h3>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>अ‍ॅक्सेस मॅनेजमेंट (Admin vs Finance Manager)</span>
          </div>

          <button className="btn btn-primary" onClick={openAddUserModal}>
            <UserPlus size={16} /> Add User (नवीन युझर जोडा)
          </button>
        </div>

        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Username</th>
                <th>Full Name</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{u.username}</td>
                  <td>{u.name}</td>
                  <td>
                    <span className={u.role === 'admin' ? 'badge badge-admin' : 'badge badge-manager'}>
                      {u.role.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <span className={u.active_status ? 'badge badge-success' : 'badge badge-danger'}>
                      {u.active_status ? 'ACTIVE' : 'DISABLED'}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{u.created_at}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u.id)}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Add User Account (नवीन खाते)</h3>
              <button className="modal-close" onClick={() => setShowUserModal(false)}><X size={24} /></button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleUserSubmit}>
              <div className="form-group">
                <label>Full Name / नाव *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Accountant"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Username / युझरनेम *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. accountant1"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Password / पासवर्ड *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter secure password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Role / अधिकार प्रकार *</label>
                <select className="form-control" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="finance_manager">Finance Manager (आर्थिक व्यवस्थापक)</option>
                  <option value="admin">Admin (अ‍ॅडमिन)</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUserModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User Account</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '460px', border: '2px solid #ef4444' }}>
            <div className="modal-header">
              <h3 style={{ color: '#ef4444', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertTriangle size={22} color="#ef4444" /> CONFIRM DATA RESET
              </h3>
              <button className="modal-close" onClick={() => setShowResetModal(false)}><X size={24} /></button>
            </div>

            <div style={{ background: 'rgba(239,68,68,0.1)', padding: '0.8rem', borderRadius: '8px', marginBottom: '1rem', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444', fontSize: '0.85rem', fontWeight: 600 }}>
              ⚠️ WARNING: You are about to permanently erase data for:
              <div style={{ fontWeight: 800, marginTop: '0.3rem', color: 'var(--text-main)', textTransform: 'uppercase' }}>
                {resetTarget === 'all' && '🔥 COMPLETE FACTORY RESET (ALL RECORDS)'}
                {resetTarget === 'boat_finance' && '⛵ BOAT FINANCE MODULE RECORDS'}
                {resetTarget === 'distributor' && '📦 DISTRIBUTOR ERP RECORDS'}
                {resetTarget === 'crew' && '👥 CREW MEMBERS & SALARIES'}
                {resetTarget === 'date_range' && `📅 ALL RECORDS CREATED BEFORE ${beforeDate}`}
              </div>
            </div>

            {resetError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {resetError}
              </div>
            )}

            <form onSubmit={handleExecuteResetData}>
              <div className="form-group">
                <label style={{ fontWeight: 700, color: 'var(--text-main)' }}>Enter Admin Password / अ‍ॅडमिन पासवर्ड प्रविष्ट करा *</label>
                <input
                  type="password"
                  className="form-control"
                  placeholder="Enter your admin password to confirm"
                  value={adminConfirmPassword}
                  onChange={(e) => setAdminConfirmPassword(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowResetModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ fontWeight: 800 }}>Confirm & Erase Permanently</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
