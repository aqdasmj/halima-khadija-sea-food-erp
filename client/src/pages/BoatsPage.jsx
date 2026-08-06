import React, { useState, useEffect, useContext } from 'react';
import { apiFetch } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { Ship, Plus, Edit2, Trash2, Users, CheckCircle, AlertCircle, X } from 'lucide-react';

export default function BoatsPage() {
  const { isAdmin } = useContext(AuthContext);
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBoat, setEditingBoat] = useState(null);

  const [name, setName] = useState('');
  const [regNum, setRegNum] = useState('');
  const [owner, setOwner] = useState('');
  const [engine, setEngine] = useState('');
  const [crewCount, setCrewCount] = useState(0);
  const [status, setStatus] = useState('active');

  const [formError, setFormError] = useState('');

  const fetchBoats = async () => {
    try {
      const res = await apiFetch('/boats');
      setBoats(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBoats();
  }, []);

  const openAddModal = () => {
    setEditingBoat(null);
    setName('');
    setRegNum('');
    setOwner('Ghubare Family (Sakhri Nate)');
    setEngine('');
    setCrewCount(6);
    setStatus('active');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (b) => {
    setEditingBoat(b);
    setName(b.name);
    setRegNum(b.registration_number);
    setOwner(b.owner_name);
    setEngine(b.engine_details || '');
    setCrewCount(b.crew_count || 0);
    setStatus(b.status || 'active');
    setFormError('');
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const payload = {
        name,
        registration_number: regNum,
        owner_name: owner,
        engine_details: engine,
        crew_count: parseInt(crewCount),
        status
      };

      if (editingBoat) {
        await apiFetch(`/boats/${editingBoat.id}`, {
          method: 'PUT',
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/boats', {
          method: 'POST',
          body: JSON.stringify(payload)
        });
      }

      setShowModal(false);
      fetchBoats();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this boat record?')) return;
    try {
      await apiFetch(`/boats/${id}`, { method: 'DELETE' });
      fetchBoats();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            BOAT MANAGEMENT
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#00d2ff' }}>
            बोटींची माहिती व नोंदणी (साखरी नाटे)
          </span>
        </div>

        {isAdmin && (
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={18} /> Add New Boat (नवीन बोट जोडा)
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading boats...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {boats.map((b) => (
            <div key={b.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ padding: '0.6rem', borderRadius: '12px', background: 'rgba(0, 210, 255, 0.15)', color: '#00d2ff' }}>
                      <Ship size={24} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#fff' }}>{b.name}</h3>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{b.registration_number}</span>
                    </div>
                  </div>
                  <span className={b.status === 'active' ? 'badge badge-success' : 'badge badge-danger'}>
                    {b.status === 'active' ? <CheckCircle size={10} /> : <AlertCircle size={10} />}
                    {b.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', fontSize: '0.85rem', marginTop: '1rem', background: 'rgba(10, 17, 40, 0.5)', padding: '0.85rem', borderRadius: 'var(--radius-sm)' }}>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Owner:</strong> {b.owner_name}</div>
                  <div><strong style={{ color: 'var(--text-muted)' }}>Engine:</strong> {b.engine_details || 'Not specified'}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.2rem', color: '#7dd3fc' }}>
                    <Users size={14} /> <strong>Assigned Crew:</strong> {b.active_crew_count || 0} / {b.crew_count} Members
                  </div>
                </div>
              </div>

              {isAdmin && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.25rem', paddingTop: '0.85rem', borderTop: '1px solid var(--border-color)' }}>
                  <button className="btn btn-secondary btn-sm" style={{ flex: 1 }} onClick={() => openEditModal(b)}>
                    <Edit2 size={14} /> Edit (बदल करा)
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDelete(b.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>{editingBoat ? 'Edit Boat Record' : 'Add New Boat (नवीन बोट)'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}><X size={24} /></button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244,63,94,0.15)', border: '1px solid rgba(244,63,94,0.3)', color: '#fda4af', padding: '0.75rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSave}>
              <div className="form-group">
                <label>Boat Name / बोटीचे नाव *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Halima Khadija"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Number / नोंदणी क्रमांक *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. IND-MH-08-MM-1422"
                  value={regNum}
                  onChange={(e) => setRegNum(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Owner Name / मालकाचे नाव *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ghubare Family (Sakhri Nate)"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label>Engine Details / इंजिन माहिती</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Ashok Leyland 160 HP Marine Engine"
                  value={engine}
                  onChange={(e) => setEngine(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Max Crew Capacity / खलाशी क्षमता</label>
                  <input
                    type="number"
                    className="form-control"
                    value={crewCount}
                    onChange={(e) => setCrewCount(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Status / स्थिती</label>
                  <select className="form-control" value={status} onChange={(e) => setStatus(e.target.value)}>
                    <option value="active">Active (सुरू)</option>
                    <option value="maintenance">Under Maintenance (दुरुस्तीत)</option>
                    <option value="inactive">Inactive (बंद)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">{editingBoat ? 'Update Boat' : 'Save Boat'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
