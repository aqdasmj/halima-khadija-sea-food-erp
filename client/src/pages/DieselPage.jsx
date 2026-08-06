import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { Fuel, Plus, AlertTriangle, Calendar, Filter, Trash2, X } from 'lucide-react';

export default function DieselPage() {
  const [dieselLogs, setDieselLogs] = useState([]);
  const [monthlySummary, setMonthlySummary] = useState([]);
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBoat, setSelectedBoat] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [formError, setFormError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [boatId, setBoatId] = useState('');
  const [litres, setLitres] = useState('');
  const [pricePerLitre, setPricePerLitre] = useState('95');
  const [totalAmount, setTotalAmount] = useState('');
  const [tripNote, setTripNote] = useState('');

  const fetchDiesel = async () => {
    try {
      let query = '/diesel?';
      if (selectedBoat) query += `boat_id=${selectedBoat}&`;
      if (selectedMonth) query += `month=${selectedMonth}&`;
      const data = await apiFetch(query);
      setDieselLogs(data.logs || []);
      setMonthlySummary(data.monthlySummary || []);
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
    fetchDiesel();
  }, [selectedBoat, selectedMonth]);

  const handleLitresOrRateChange = (lVal, rVal) => {
    const l = parseFloat(lVal) || 0;
    const r = parseFloat(rVal) || 0;
    setTotalAmount((l * r).toString());
  };

  const openAddModal = () => {
    setDate(new Date().toISOString().substring(0, 10));
    setLitres('');
    setPricePerLitre('95');
    setTotalAmount('');
    setTripNote('');
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
        litres: parseFloat(litres),
        price_per_litre: parseFloat(pricePerLitre),
        total_amount: parseFloat(totalAmount),
        trip_note: tripNote
      };

      await apiFetch('/diesel', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setShowModal(false);
      fetchDiesel();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this diesel log?')) return;
    try {
      await apiFetch(`/diesel/${id}`, { method: 'DELETE' });
      fetchDiesel();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            DIESEL TRACKER & ANALYTICS
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#00d2ff' }}>
            डिझेल खरेदी व वापर ट्रॅकर (साखरी नाटे)
          </span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Log Diesel Fill-up (डिझेल नोंद करा)
        </button>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="#00d2ff" />
          <select className="form-control" value={selectedBoat} onChange={(e) => setSelectedBoat(e.target.value)} style={{ width: '160px' }}>
            <option value="">All Boats</option>
            {boats.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="#00d2ff" />
          <input
            type="month"
            className="form-control"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            style={{ width: '160px' }}
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
        <div className="glass-card">
          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: '#94a3b8', marginBottom: '0.5rem' }}>
            Month-to-Month Diesel Comparison
          </h3>
          {monthlySummary.length === 0 ? (
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>No monthly summary data</span>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', marginTop: '0.5rem' }}>
              {monthlySummary.map((m, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem', background: 'rgba(10,17,40,0.5)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem' }}>
                  <span style={{ fontWeight: 700, color: '#00d2ff' }}>{m.year_month}</span>
                  <span><strong>{m.total_litres}</strong> Litres</span>
                  <span style={{ color: '#f43f5e', fontWeight: 700 }}>₹{m.total_cost.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="glass-card" style={{ padding: 0 }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading diesel logs...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Date (दिनांक)</th>
                  <th>Boat (बोट)</th>
                  <th>Litres (लिटर)</th>
                  <th>Price / Litre (दर/लिटर)</th>
                  <th>Total Cost (एकूण रक्कम)</th>
                  <th>Trip / Usage Note (फेरी तपशील)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {dieselLogs.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No diesel fill-up records found.
                    </td>
                  </tr>
                ) : (
                  dieselLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontWeight: 600 }}>{log.date}</td>
                      <td style={{ color: '#fff', fontWeight: 700 }}>{log.boat_name}</td>
                      <td style={{ color: '#00d2ff', fontWeight: 800 }}>{log.litres} Ltrs</td>
                      <td>₹{log.price_per_litre}/L</td>
                      <td style={{ color: '#f43f5e', fontWeight: 800 }}>₹{log.total_amount.toLocaleString('en-IN')}</td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{log.trip_note || '-'}</td>
                      <td>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(log.id)}>
                          <Trash2 size={14} />
                        </button>
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
              <h3>Log Diesel Purchase (डिझेल खरेदी नोंद)</h3>
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

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Total Litres (लिटर) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className="form-control"
                    placeholder="e.g. 500"
                    value={litres}
                    onChange={(e) => {
                      setLitres(e.target.value);
                      handleLitresOrRateChange(e.target.value, pricePerLitre);
                    }}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Price / Litre (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="e.g. 95"
                    value={pricePerLitre}
                    onChange={(e) => {
                      setPricePerLitre(e.target.value);
                      handleLitresOrRateChange(litres, e.target.value);
                    }}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Total Diesel Cost (₹) / एकूण किंमत</label>
                <input
                  type="number"
                  className="form-control"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  style={{ color: '#f43f5e', fontWeight: 'bold' }}
                  required
                />
              </div>

              <div className="form-group">
                <label>Trip / Usage Note (मासेमारी फेरी तपशील)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 6-Day deep sea fishing run toward Malvan"
                  value={tripNote}
                  onChange={(e) => setTripNote(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Diesel Entry</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
