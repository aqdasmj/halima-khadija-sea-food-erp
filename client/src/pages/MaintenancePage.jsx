import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Wrench, Plus, Calendar, AlertCircle, Edit2, Trash2, X } from 'lucide-react';

export default function MaintenancePage() {
  const [maintenanceList, setMaintenanceList] = useState([]);
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBoat, setSelectedBoat] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formError, setFormError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [boatId, setBoatId] = useState('');
  const [type, setType] = useState('Engine Service & Oil Change');
  const [problem, setProblem] = useState('');
  const [vendorName, setVendorName] = useState('');
  const [amount, setAmount] = useState('');
  const [nextServiceDate, setNextServiceDate] = useState('');
  const [notes, setNotes] = useState('');

  const fetchMaintenance = async () => {
    try {
      let query = '/maintenance?';
      if (selectedBoat) query += `boat_id=${selectedBoat}`;
      const data = await apiFetch(query);
      setMaintenanceList(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      const b = await apiFetch('/boats');
      setBoats(b);
      if (b.length > 0) setBoatId(b[0].id);
    }
    init();
  }, []);

  useEffect(() => {
    fetchMaintenance();
  }, [selectedBoat]);

  const openAddModal = () => {
    setEditingItem(null);
    setDate(new Date().toISOString().substring(0, 10));
    setType('Engine Service & Oil Change');
    setProblem('');
    setVendorName('');
    setAmount('');
    setNextServiceDate('');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setDate(item.date);
    setBoatId(item.boat_id);
    setType(item.type);
    setProblem(item.problem || '');
    setVendorName(item.vendor_name || '');
    setAmount(item.amount);
    setNextServiceDate(item.next_service_date || '');
    setNotes(item.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        date,
        boat_id: boatId,
        type,
        problem,
        vendor_name: vendorName,
        amount: parseFloat(amount),
        next_service_date: nextServiceDate || null,
        notes
      };

      if (editingItem) {
        await apiFetch(`/maintenance/${editingItem.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/maintenance', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowModal(false);
      fetchMaintenance();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this maintenance record?')) return;
    try {
      await apiFetch(`/maintenance/${id}`, { method: 'DELETE' });
      fetchMaintenance();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            BOAT MAINTENANCE & SERVICE REMINDERS
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#00d2ff' }}>
            बोट दुरुस्ती, मेंटेनन्स व सर्व्हिसिंग रिमाइंडर (साखरी नाटे)
          </span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Log Maintenance Record (दुरुस्ती नोंदवा)
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <select className="form-control" value={selectedBoat} onChange={(e) => setSelectedBoat(e.target.value)} style={{ width: '180px' }}>
          <option value="">All Boats (सर्व बोटी)</option>
          {boats.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading maintenance records...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date (दिनांक)</th>
                  <th>Boat (बोट)</th>
                  <th>Maintenance Type (प्रकार)</th>
                  <th>Problem / Details (समस्या/तपशील)</th>
                  <th>Vendor / Mechanic (गॅरेज/मिस्त्री)</th>
                  <th>Amount (रक्कम)</th>
                  <th>Next Service Reminder (पुढील सर्व्हिसिंग)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {maintenanceList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No maintenance records found.
                    </td>
                  </tr>
                ) : (
                  maintenanceList.map(m => (
                    <tr key={m.id}>
                      <td style={{ fontWeight: 600 }}>{m.date}</td>
                      <td style={{ color: '#fff', fontWeight: 700 }}>{m.boat_name}</td>
                      <td style={{ fontWeight: 700, color: '#f59e0b' }}>{m.type}</td>
                      <td style={{ maxWidth: '220px', fontSize: '0.85rem' }}>{m.problem || '-'}</td>
                      <td style={{ fontWeight: 600 }}>{m.vendor_name || '-'}</td>
                      <td style={{ color: '#f43f5e', fontWeight: 800 }}>₹{m.amount.toLocaleString('en-IN')}</td>
                      <td>
                        {m.next_service_date ? (
                          <span className="badge badge-warning">
                            <Calendar size={12} /> {m.next_service_date}
                          </span>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>No Reminder</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(m)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingItem ? 'Edit Maintenance Record' : 'Log Maintenance (दुरुस्ती नोंद करा)'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Date / दिनांक *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Boat / बोट *</label>
                  <select className="form-control" value={boatId} onChange={(e) => setBoatId(e.target.value)} required>
                    {boats.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Maintenance Type / काम प्रकार *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Engine Oil Service / Propeller Scraping / Winch Repair"
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Problem / Work Description (समस्या किंवा कामाचा तपशील)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Replaced primary fuel filter and impeller"
                  value={problem}
                  onChange={(e) => setProblem(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Vendor / Mechanic Name (वर्कशॉप/मिस्त्री)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Ratnagiri Marine Engineers"
                    value={vendorName}
                    onChange={(e) => setVendorName(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount (₹) / खर्च *</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 8500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Next Service Reminder Date (पुढील सर्व्हिसिंग तारीख)</label>
                <input
                  type="date"
                  className="form-control"
                  value={nextServiceDate}
                  onChange={(e) => setNextServiceDate(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Maintenance Record</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
