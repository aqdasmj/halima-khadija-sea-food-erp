import React, { useState, useEffect, useContext } from 'react';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Users, Plus, DollarSign, History, Edit2, Trash2, X, Phone, ShieldCheck } from 'lucide-react';

export default function CrewPage() {
  const { isAdmin } = useContext(AuthContext);
  const [crewList, setCrewList] = useState([]);
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedBoat, setSelectedBoat] = useState('');

  const [showCrewModal, setShowCrewModal] = useState(false);
  const [editingCrew, setEditingCrew] = useState(null);
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const [activeCrewForAdvance, setActiveCrewForAdvance] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [advanceHistory, setAdvanceHistory] = useState([]);

  const [formError, setFormError] = useState('');

  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [role, setRole] = useState('Khalasi');
  const [boatId, setBoatId] = useState('');
  const [weeklyAllowance, setWeeklyAllowance] = useState('1000');
  const [monthlySalary, setMonthlySalary] = useState('15000');
  const [notes, setNotes] = useState('');

  const [advanceDate, setAdvanceDate] = useState(new Date().toISOString().substring(0, 10));
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceType, setAdvanceType] = useState('advance');
  const [advanceNotes, setAdvanceNotes] = useState('');

  const fetchCrew = async () => {
    try {
      let query = '/crew?';
      if (selectedBoat) query += `boat_id=${selectedBoat}`;
      const data = await apiFetch(query);
      setCrewList(data);
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
    fetchCrew();
  }, [selectedBoat]);

  const openAddCrewModal = () => {
    setEditingCrew(null);
    setName('');
    setMobile('');
    setRole('Khalasi');
    setWeeklyAllowance('1000');
    setMonthlySalary('15000');
    setNotes('');
    setFormError('');
    setShowCrewModal(true);
  };

  const openEditCrewModal = (c) => {
    setEditingCrew(c);
    setName(c.name);
    setMobile(c.mobile || '');
    setRole(c.role);
    setBoatId(c.boat_id);
    setWeeklyAllowance(c.weekly_allowance);
    setMonthlySalary(c.monthly_salary);
    setNotes(c.notes || '');
    setFormError('');
    setShowCrewModal(true);
  };

  const handleCrewSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        name,
        mobile,
        role,
        boat_id: boatId,
        weekly_allowance: parseFloat(weeklyAllowance),
        monthly_salary: parseFloat(monthlySalary),
        notes
      };

      if (editingCrew) {
        await apiFetch(`/crew/${editingCrew.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/crew', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowCrewModal(false);
      fetchCrew();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openAdvanceModal = (c) => {
    setActiveCrewForAdvance(c);
    setAdvanceDate(new Date().toISOString().substring(0, 10));
    setAdvanceAmount('');
    setAdvanceType('advance');
    setAdvanceNotes('');
    setFormError('');
    setShowAdvanceModal(true);
  };

  const handleAdvanceSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        date: advanceDate,
        crew_id: activeCrewForAdvance.id,
        amount: parseFloat(advanceAmount),
        type: advanceType,
        notes: advanceNotes
      };

      await apiFetch('/crew/advances', {
        method: 'POST',
        body: JSON.stringify(payload)
      });

      setShowAdvanceModal(false);
      fetchCrew();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const openHistoryModal = async (c) => {
    try {
      const history = await apiFetch(`/crew/${c.id}/advances`);
      setAdvanceHistory(history);
      setActiveCrewForAdvance(c);
      setShowHistoryModal(true);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteCrew = async (id) => {
    if (!window.confirm('Delete this crew member?')) return;
    try {
      await apiFetch(`/crew/${id}`, { method: 'DELETE' });
      fetchCrew();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            CREW MANAGEMENT & SALARY TRACKER
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#00d2ff' }}>
            खलाशी पगार, हप्ता (भत्ता) व अ‍ॅडव्हान्स नोंद (साखरी नाटे)
          </span>
        </div>

        <button className="btn btn-primary" onClick={openAddCrewModal}>
          <Plus size={18} /> Add New Crew Member (नवीन खलाशी जोडा)
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
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading crew directory...</div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Crew Member (खलाशी नाव)</th>
                  <th>Role (हुद्दा)</th>
                  <th>Boat (बोट)</th>
                  <th>Weekly Allowance (हप्ता)</th>
                  <th>Monthly Salary (पगार)</th>
                  <th>Pending Advance (अ‍ॅडव्हान्स बाकी)</th>
                  <th>Final Payable Salary (देय पगार)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {crewList.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                      No crew members registered.
                    </td>
                  </tr>
                ) : (
                  crewList.map(c => (
                    <tr key={c.id}>
                      <td>
                        <div style={{ fontWeight: 700, color: '#fff' }}>{c.name}</div>
                        {c.mobile && (
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                            <Phone size={10} /> {c.mobile}
                          </div>
                        )}
                      </td>
                      <td><span className="badge badge-manager">{c.role}</span></td>
                      <td style={{ fontWeight: 600, color: '#7dd3fc' }}>{c.boat_name || 'Unassigned'}</td>
                      <td>₹{c.weekly_allowance.toLocaleString('en-IN')}/wk</td>
                      <td style={{ fontWeight: 700 }}>₹{c.monthly_salary.toLocaleString('en-IN')}</td>
                      <td>
                        {c.net_pending_advance > 0 ? (
                          <span className="badge badge-danger">₹{c.net_pending_advance.toLocaleString('en-IN')}</span>
                        ) : (
                          <span className="badge badge-success">₹0</span>
                        )}
                      </td>
                      <td style={{ color: '#10b981', fontWeight: 800, fontSize: '0.95rem' }}>
                        ₹{c.final_payable_salary.toLocaleString('en-IN')}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-warning btn-sm"
                            title="Log Advance or Deduction"
                            onClick={() => openAdvanceModal(c)}
                          >
                            <DollarSign size={14} /> Advance
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="View History"
                            onClick={() => openHistoryModal(c)}
                          >
                            <History size={14} />
                          </button>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEditCrewModal(c)}>
                            <Edit2 size={14} />
                          </button>
                          {isAdmin && (
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteCrew(c.id)}>
                              <Trash2 size={14} />
                            </button>
                          )}
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

      {showCrewModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingCrew ? 'Edit Crew Member' : 'Add New Crew Member (नवीन खलाशी)'}</h3>
              <button className="modal-close" onClick={() => setShowCrewModal(false)}><X size={24} /></button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleCrewSubmit}>
              <div className="form-group">
                <label>Full Name / पूर्ण नाव *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Nasir Ghubare"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Mobile Number / मोबाईल क्र.</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. 9421234567"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Role / हुद्दा *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Tandel / Khalasi / Engine Driver"
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Assigned Boat / बोट *</label>
                <select className="form-control" value={boatId} onChange={(e) => setBoatId(e.target.value)} required>
                  {boats.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Weekly Allowance (₹) / हप्ता</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 1200"
                    value={weeklyAllowance}
                    onChange={(e) => setWeeklyAllowance(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Monthly Salary (₹) / मासिक पगार</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 18000"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCrewModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Crew Member</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAdvanceModal && activeCrewForAdvance && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Log Payment / Advance: {activeCrewForAdvance.name}</h3>
              <button className="modal-close" onClick={() => setShowAdvanceModal(false)}><X size={24} /></button>
            </div>

            <form onSubmit={handleAdvanceSubmit}>
              <div className="form-group">
                <label>Date / दिनांक *</label>
                <input
                  type="date"
                  className="form-control"
                  value={advanceDate}
                  onChange={(e) => setAdvanceDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Transaction Type / प्रकार</label>
                <select className="form-control" value={advanceType} onChange={(e) => setAdvanceType(e.target.value)}>
                  <option value="advance">Advance Given (खलाशाला अ‍ॅडव्हान्स दिले)</option>
                  <option value="deduction">Advance Deducted (पगारातून अ‍ॅडव्हान्स कापले)</option>
                  <option value="allowance_payout">Weekly Allowance Payout (साप्ताहिक हप्ता वाटप)</option>
                </select>
              </div>

              <div className="form-group">
                <label>Amount (₹) / रक्कम *</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 3000"
                  value={advanceAmount}
                  onChange={(e) => setAdvanceAmount(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Notes / कारण / टीप</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Emergency home medical expense"
                  value={advanceNotes}
                  onChange={(e) => setAdvanceNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAdvanceModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Advance Record</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && activeCrewForAdvance && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '650px' }}>
            <div className="modal-header">
              <h3>Advance History: {activeCrewForAdvance.name}</h3>
              <button className="modal-close" onClick={() => setShowHistoryModal(false)}><X size={24} /></button>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {advanceHistory.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>No advance history recorded.</td></tr>
                  ) : (
                    advanceHistory.map(h => (
                      <tr key={h.id}>
                        <td>{h.date}</td>
                        <td>
                          <span className={h.type === 'advance' ? 'badge badge-danger' : 'badge badge-success'}>
                            {h.type}
                          </span>
                        </td>
                        <td style={{ fontWeight: 'bold' }}>₹{h.amount.toLocaleString('en-IN')}</td>
                        <td style={{ fontSize: '0.85rem' }}>{h.notes || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
