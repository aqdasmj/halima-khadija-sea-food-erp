import React, { useState, useEffect, useContext } from 'react';
import { apiFetch, getAuthToken } from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import ReceiptViewer from '../components/ReceiptViewer';
import {
  Receipt,
  Plus,
  Search,
  Filter,
  FileImage,
  Trash2,
  Edit2,
  X,
  Calendar
} from 'lucide-react';

export const EXPENSE_CATEGORIES = [
  'Diesel',
  'Ice',
  'Crew weekly allowance',
  'Crew monthly salary',
  'Food/ration',
  'Net repair',
  'Rope',
  'Engine oil',
  'Engine maintenance',
  'Boat maintenance',
  'Electrical repair',
  'Painting',
  'Welding',
  'Transport',
  'Harbour/landing charges',
  'Loan payment',
  'Advance payment',
  'Miscellaneous'
];

export default function ExpensesPage() {
  const { user, isAdmin } = useContext(AuthContext);
  const [expenses, setExpenses] = useState([]);
  const [boats, setBoats] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedBoat, setSelectedBoat] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [activeReceiptUrl, setActiveReceiptUrl] = useState(null);
  const [formError, setFormError] = useState('');

  const [date, setDate] = useState(new Date().toISOString().substring(0, 10));
  const [boatId, setBoatId] = useState('');
  const [category, setCategory] = useState('Diesel');
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [paidBy, setPaidBy] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Cash');
  const [receiptFile, setReceiptFile] = useState(null);
  const [notes, setNotes] = useState('');

  const fetchExpenses = async () => {
    try {
      let query = '/expenses?';
      if (selectedBoat) query += `boat_id=${selectedBoat}&`;
      if (selectedCategory) query += `category=${encodeURIComponent(selectedCategory)}&`;
      if (selectedMonth) query += `month=${selectedMonth}&`;
      const data = await apiFetch(query);
      setExpenses(data);
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
    fetchExpenses();
  }, [selectedBoat, selectedCategory, selectedMonth]);

  const openAddModal = () => {
    setEditingExpense(null);
    setDate(new Date().toISOString().substring(0, 10));
    setCategory('Diesel');
    setDescription('');
    setAmount('');
    setPaidBy('');
    setPaymentMethod('Cash');
    setReceiptFile(null);
    setNotes('');
    setFormError('');
    setShowModal(true);
  };

  const openEditModal = (exp) => {
    setEditingExpense(exp);
    setDate(exp.date);
    setBoatId(exp.boat_id);
    setCategory(exp.category);
    setDescription(exp.description || '');
    setAmount(exp.amount);
    setPaidBy(exp.paid_by || '');
    setPaymentMethod(exp.payment_method || 'Cash');
    setReceiptFile(null);
    setNotes(exp.notes || '');
    setFormError('');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    try {
      const formData = new FormData();
      formData.append('date', date);
      formData.append('boat_id', boatId);
      formData.append('category', category);
      formData.append('description', description);
      formData.append('amount', amount);
      formData.append('paid_by', paidBy);
      formData.append('payment_method', paymentMethod);
      formData.append('notes', notes);

      if (receiptFile) {
        formData.append('receipt', receiptFile);
      }

      const token = getAuthToken();
      const endpoint = editingExpense ? `/expenses/${editingExpense.id}` : '/expenses';
      const method = editingExpense ? 'PUT' : 'POST';

      const response = await fetch(`/api${endpoint}`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const resData = await response.json();
      if (!response.ok) {
        throw new Error(resData.error || 'Failed to save expense');
      }

      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense record?')) return;
    try {
      await apiFetch(`/expenses/${id}`, { method: 'DELETE' });
      fetchExpenses();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredExpenses = expenses.filter(e => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      e.category.toLowerCase().includes(term) ||
      (e.description && e.description.toLowerCase().includes(term)) ||
      (e.boat_name && e.boat_name.toLowerCase().includes(term)) ||
      (e.paid_by && e.paid_by.toLowerCase().includes(term))
    );
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            DAILY EXPENSES
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            दैनंदिन खर्च नोंद व पावती
          </span>
        </div>

        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={18} /> Add Expense
        </button>
      </div>

      <div className="glass-card" style={{ padding: '0.85rem', display: 'flex', gap: '0.65rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ flex: 1, minWidth: '160px', position: 'relative' }}>
          <Search size={15} color="var(--text-muted)" style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
          <input
            type="text"
            className="form-control"
            style={{ paddingLeft: '2.3rem', minHeight: '40px', fontSize: '0.85rem' }}
            placeholder="Search expense or boat..."
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

        <select className="form-control" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)} style={{ width: '140px', minHeight: '40px', fontSize: '0.8rem' }}>
          <option value="">All Categories</option>
          {EXPENSE_CATEGORIES.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading expenses...</div>
      ) : (
        <>
          <div className="glass-card desktop-table-view" style={{ padding: 0 }}>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Boat</th>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Receipt</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No expenses found.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map(exp => (
                      <tr key={exp.id}>
                        <td style={{ fontWeight: 600 }}>{exp.date}</td>
                        <td style={{ color: 'var(--text-main)', fontWeight: 700 }}>{exp.boat_name}</td>
                        <td><span className="badge badge-manager">{exp.category}</span></td>
                        <td>{exp.description || '-'}</td>
                        <td style={{ color: '#f43f5e', fontWeight: 800 }}>₹{exp.amount.toLocaleString('en-IN')}</td>
                        <td><span className="badge badge-warning">{exp.payment_method}</span></td>
                        <td>
                          {exp.receipt_path ? (
                            <button className="btn btn-secondary btn-sm" onClick={() => setActiveReceiptUrl(exp.receipt_path)}>
                              <FileImage size={14} color="var(--accent-cyan)" /> Photo
                            </button>
                          ) : '-'}
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem' }}>
                            <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(exp)}><Edit2 size={14} /></button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)}><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mobile-card-list">
            {filteredExpenses.length === 0 ? (
              <div className="glass-card" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '1.5rem' }}>
                No expenses logged.
              </div>
            ) : (
              filteredExpenses.map(exp => (
                <div key={exp.id} className="mobile-card-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <span className="badge badge-manager" style={{ marginBottom: '0.3rem' }}>{exp.category}</span>
                      <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{exp.boat_name}</h4>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f43f5e' }}>
                      ₹{exp.amount.toLocaleString('en-IN')}
                    </div>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{exp.description || 'No description'}</p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    <span>📅 {exp.date} • {exp.payment_method}</span>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      {exp.receipt_path && (
                        <button className="btn btn-secondary btn-sm" onClick={() => setActiveReceiptUrl(exp.receipt_path)}>
                          <FileImage size={13} color="var(--accent-cyan)" />
                        </button>
                      )}
                      <button className="btn btn-secondary btn-sm" onClick={() => openEditModal(exp)}><Edit2 size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(exp.id)}><Trash2 size={13} /></button>
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
              <h3>{editingExpense ? 'Edit Expense' : 'Add Daily Expense'}</h3>
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
                <label>Category *</label>
                <select className="form-control" value={category} onChange={(e) => setCategory(e.target.value)} required>
                  {EXPENSE_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. 30 Ice blocks"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Amount (₹) *</label>
                  <input
                    type="number"
                    step="0.01"
                    className="form-control"
                    placeholder="e.g. 5000"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Payment Method</label>
                  <select className="form-control" value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="UPI">UPI / GPay</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="Credit">Credit / Udhari</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Upload Receipt Photo</label>
                <input
                  type="file"
                  accept="image/*,.pdf"
                  className="form-control"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Expense</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ReceiptViewer receiptUrl={activeReceiptUrl} onClose={() => setActiveReceiptUrl(null)} />
    </div>
  );
}
