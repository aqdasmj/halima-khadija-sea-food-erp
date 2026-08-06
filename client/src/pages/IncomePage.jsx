import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { TrendingUp, Plus, Search, Filter, Edit2, Trash2, X } from 'lucide-react';

export default function IncomePage() {
  const [incomeList, setIncomeList] = useState([]);
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedBoat, setSelectedBoat] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');
  const [pendingOnly, setPendingOnly] = useState(false);

  const [showModal, setShowModal] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [formError, setFormError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [boatId, setBoatId] = useState('');
  const [fishType, setFishType] = useState('Surmai (Kingfish)');
  const [quantity, setQuantity] = useState('');
  const [saleAmount, setSaleAmount] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [marketLocation, setMarketLocation] = useState('Sakhri Nate Jetty');
  const [paymentReceived, setPaymentReceived] = useState('');
  const [pendingPayment, setPendingPayment] = useState('0');
  const [notes, setNotes] = useState('');

  const fetchIncome = async () => {
    try {
      let query = '/income?';
      if (selectedBoat) query += `boat_id=${selectedBoat}&`;
      if (selectedMonth) query += `month=${selectedMonth}&`;
      if (pendingOnly) query += `pendingOnly=true&`;
      const data = await apiFetch(query);
      setIncomeList(data);
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
    fetchIncome();
  }, [selectedBoat, selectedMonth, pendingOnly]);

  const openAddModal = () => {
    setEditingIncome(null);
    setDate(new Date().toISOString().substring(0, 10));
    setFishType('Surmai (Kingfish)');
    setQuantity('');
    setSaleAmount('');
    setBuyerName('');
    setMarketLocation('Sakhri Nate Jetty');
    setPaymentReceived('');
    setPendingPayment('0');
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (inc) => {
    setEditingIncome(inc);
    setDate(inc.date);
    setBoatId(inc.boat_id);
    setFishType(inc.fish_type);
    setQuantity(inc.quantity || '');
    setSaleAmount(inc.sale_amount);
    setBuyerName(inc.buyer_name || '');
    setMarketLocation(inc.market_location || '');
    setPaymentReceived(inc.payment_received);
    setPendingPayment(inc.pending_payment);
    setNotes(inc.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSaleAmtChange = (val) => {
    setSaleAmount(val);
    const sale = parseFloat(val) || 0;
    const rec = parseFloat(paymentReceived) || 0;
    setPendingPayment(Math.max(0, sale - rec).toString());
  };

  const handleRecAmtChange = (val) => {
    setPaymentReceived(val);
    const sale = parseFloat(saleAmount) || 0;
    const rec = parseFloat(val) || 0;
    setPendingPayment(Math.max(0, sale - rec).toString());
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        date,
        boat_id: boatId,
        fish_type: fishType,
        quantity: parseFloat(quantity) || 0,
        sale_amount: parseFloat(saleAmount),
        buyer_name: buyerName,
        market_location: marketLocation,
        payment_received: parseFloat(paymentReceived) || 0,
        pending_payment: parseFloat(pendingPayment) || 0,
        notes
      };

      if (editingIncome) {
        await apiFetch(`/income/${editingIncome.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/income', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowModal(false);
      fetchIncome();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this income record?')) return;
    try {
      await apiFetch(`/income/${id}`, { method: 'DELETE' });
      fetchIncome();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredIncome = incomeList.filter(i => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      i.fish_type.toLowerCase().includes(term) ||
      (i.buyer_name && i.buyer_name.toLowerCase().includes(term)) ||
      (i.market_location && i.market_location.toLowerCase().includes(term)) ||
      (i.boat_name && i.boat_name.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            FISH SALE INCOME
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            मासे विक्री जमा नोंद
          </span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Income
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '150px', position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.3rem', minHeight: '40px', fontSize: '0.85rem' }}
            placeholder="Search fish, buyer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select className="form-control" value={selectedBoat} onChange={(e) => setSelectedBoat(e.target.value)} style={{ width: '130px', minHeight: '40px', fontSize: '0.8rem' }}>
          <option value="">All Boats</option>
          {boats.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading income records...</div>
      ) : (
        <>
          <div className="glass-card desktop-table-view" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Boat</th>
                    <th>Fish Type</th>
                    <th>Quantity</th>
                    <th>Sale Amount</th>
                    <th>Received</th>
                    <th>Pending</th>
                    <th>Buyer</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIncome.map(inc => (
                    <tr key={inc.id}>
                      <td>{inc.date}</td>
                      <td style={{ fontWeight: 700 }}>{inc.boat_name}</td>
                      <td style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{inc.fish_type}</td>
                      <td>{inc.quantity ? `${inc.quantity} kg` : '-'}</td>
                      <td style={{ color: '#10b981', fontWeight: 800 }}>₹{inc.sale_amount.toLocaleString('en-IN')}</td>
                      <td>₹{inc.payment_received.toLocaleString('en-IN')}</td>
                      <td>
                        {inc.pending_payment > 0 ? (
                          <span className="badge badge-warning">₹{inc.pending_payment.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="badge badge-success">PAID</span>
                        )}
                      </td>
                      <td>{inc.buyer_name || '-'}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(inc)}><Edit2 size={14} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inc.id)}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mobile-card-list">
            {filteredIncome.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                No income logged.
              </div>
            ) : (
              filteredIncome.map(inc => (
                <div key={inc.id} className="mobile-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: 700 }}>{inc.fish_type}</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{inc.boat_name}</h4>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>
                      ₹{inc.sale_amount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    <span>Buyer: {inc.buyer_name || 'Direct Auction'}</span>
                    {inc.pending_payment > 0 ? (
                      <span className="badge badge-warning">₹{inc.pending_payment.toLocaleString('en-IN')} Pending</span>
                    ) : (
                      <span className="badge badge-success">Paid Full</span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📅 {inc.date} • {inc.quantity ? `${inc.quantity} kg` : ''}</span>
                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(inc)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(inc.id)}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingIncome ? 'Edit Fish Sale' : 'Add Fish Sale Income'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={22} /></button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Date *</label>
                  <input
                    type="date"
                    className="form-control"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Boat *</label>
                  <select className="form-control" value={boatId} onChange={(e) => setBoatId(e.target.value)} required>
                    {boats.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Fish Type *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Surmai / Paplet"
                  value={fishType}
                  onChange={(e) => setFishType(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Total Sale Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  className="form-control"
                  placeholder="e.g. 150000"
                  value={saleAmount}
                  onChange={(e) => handleSaleAmtChange(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Received Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={paymentReceived}
                    onChange={(e) => handleRecAmtChange(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Pending Udhari (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    value={pendingPayment}
                    onChange={(e) => setPendingPayment(e.target.value)}
                    style={{ color: 'var(--accent-amber)', fontWeight: 'bold' }}
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Buyer Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Razi Traders"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Income</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
