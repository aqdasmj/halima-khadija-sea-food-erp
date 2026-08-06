import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { AlertTriangle, TrendingUp, TrendingDown, Users, Package, ShoppingBag, PlusCircle, ArrowUpRight, ArrowDownLeft, Trash2, Edit, CheckCircle, X, DollarSign, FileText } from 'lucide-react';

export default function DistributorDashboard({ onSwitchModule }) {
  const [activeTab, setActiveTab] = useState('overview');
  
  const [data, setData] = useState(null);
  const [parties, setParties] = useState([]);
  const [items, setItems] = useState([]);
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  const [payments, setPayments] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal States
  const [showPartyModal, setShowPartyModal] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [partyForm, setPartyForm] = useState({ name: '', type: 'customer', phone: '', gst_number: '', address: '', opening_balance: '0' });

  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({ name: '', category: 'Fishing Nets', unit: 'kg', current_stock: '0', purchase_price: '0', sale_price: '0', low_stock_alert: '10' });

  const [showSaleModal, setShowSaleModal] = useState(false);
  const [saleForm, setSaleForm] = useState({ invoice_no: '', party_id: '', date: new Date().toISOString().substring(0, 10), received_amount: '0', notes: '' });
  const [saleLineItems, setSaleLineItems] = useState([{ item_id: '', qty: '1', rate: '0' }]);

  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [purchaseForm, setPurchaseForm] = useState({ invoice_no: '', party_id: '', date: new Date().toISOString().substring(0, 10), paid_amount: '0', notes: '' });
  const [purchaseLineItems, setPurchaseLineItems] = useState([{ item_id: '', qty: '1', rate: '0' }]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ party_id: '', date: new Date().toISOString().substring(0, 10), amount: '', type: 'in', mode: 'Cash', notes: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [dashRes, partiesRes, itemsRes, salesRes, purchasesRes, paymentsRes] = await Promise.all([
        apiFetch('/distributor/dashboard'),
        apiFetch('/distributor/parties'),
        apiFetch('/distributor/items'),
        apiFetch('/distributor/sales'),
        apiFetch('/distributor/purchases'),
        apiFetch('/distributor/payments')
      ]);

      setData(dashRes);
      setParties(partiesRes);
      setItems(itemsRes);
      setSales(salesRes);
      setPurchases(purchasesRes);
      setPayments(paymentsRes);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatINR = (val) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val || 0);
  };

  // PARTY CRUD
  const handleSaveParty = async (e) => {
    e.preventDefault();
    try {
      if (editingParty) {
        await apiFetch(`/distributor/parties/${editingParty.id}`, { method: 'PUT', body: JSON.stringify(partyForm) });
      } else {
        await apiFetch('/distributor/parties', { method: 'POST', body: JSON.stringify(partyForm) });
      }
      setShowPartyModal(false);
      setEditingParty(null);
      setPartyForm({ name: '', type: 'customer', phone: '', gst_number: '', address: '', opening_balance: '0' });
      await fetchAllData();
    } catch (err) {
      alert('Error saving party: ' + err.message);
    }
  };

  const handleDeleteParty = async (id) => {
    if (!window.confirm('Are you sure you want to delete this party?')) return;
    try {
      await apiFetch(`/distributor/parties/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (err) {
      alert('Error deleting party: ' + err.message);
    }
  };

  // ITEM CRUD
  const handleSaveItem = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        await apiFetch(`/distributor/items/${editingItem.id}`, { method: 'PUT', body: JSON.stringify(itemForm) });
      } else {
        await apiFetch('/distributor/items', { method: 'POST', body: JSON.stringify(itemForm) });
      }
      setShowItemModal(false);
      setEditingItem(null);
      setItemForm({ name: '', category: 'Fishing Nets', unit: 'kg', current_stock: '0', purchase_price: '0', sale_price: '0', low_stock_alert: '10' });
      await fetchAllData();
    } catch (err) {
      alert('Error saving item: ' + err.message);
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;
    try {
      await apiFetch(`/distributor/items/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (err) {
      alert('Error deleting item: ' + err.message);
    }
  };

  // SALE INVOICE CRUD
  const handleCreateSale = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...saleForm, items: saleLineItems };
      await apiFetch('/distributor/sales', { method: 'POST', body: JSON.stringify(payload) });
      setShowSaleModal(false);
      setSaleForm({ invoice_no: '', party_id: '', date: new Date().toISOString().substring(0, 10), received_amount: '0', notes: '' });
      setSaleLineItems([{ item_id: '', qty: '1', rate: '0' }]);
      await fetchAllData();
    } catch (err) {
      alert('Error creating sale invoice: ' + err.message);
    }
  };

  const handleDeleteSale = async (id) => {
    if (!window.confirm('Are you sure you want to delete this sale invoice? Stock will be reverted.')) return;
    try {
      await apiFetch(`/distributor/sales/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (err) {
      alert('Error deleting sale invoice: ' + err.message);
    }
  };

  // PURCHASE INVOICE CRUD
  const handleCreatePurchase = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...purchaseForm, items: purchaseLineItems };
      await apiFetch('/distributor/purchases', { method: 'POST', body: JSON.stringify(payload) });
      setShowPurchaseModal(false);
      setPurchaseForm({ invoice_no: '', party_id: '', date: new Date().toISOString().substring(0, 10), paid_amount: '0', notes: '' });
      setPurchaseLineItems([{ item_id: '', qty: '1', rate: '0' }]);
      await fetchAllData();
    } catch (err) {
      alert('Error creating purchase invoice: ' + err.message);
    }
  };

  const handleDeletePurchase = async (id) => {
    if (!window.confirm('Are you sure you want to delete this purchase invoice? Stock will be reverted.')) return;
    try {
      await apiFetch(`/distributor/purchases/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (err) {
      alert('Error deleting purchase invoice: ' + err.message);
    }
  };

  // PAYMENT CRUD
  const handleRecordPayment = async (e) => {
    e.preventDefault();
    try {
      await apiFetch('/distributor/payments', { method: 'POST', body: JSON.stringify(paymentForm) });
      setShowPaymentModal(false);
      setPaymentForm({ party_id: '', date: new Date().toISOString().substring(0, 10), amount: '', type: 'in', mode: 'Cash', notes: '' });
      await fetchAllData();
    } catch (err) {
      alert('Error recording payment: ' + err.message);
    }
  };

  const handleDeletePayment = async (id) => {
    if (!window.confirm('Delete this payment record? Party balance will be updated.')) return;
    try {
      await apiFetch(`/distributor/payments/${id}`, { method: 'DELETE' });
      await fetchAllData();
    } catch (err) {
      alert('Error deleting payment: ' + err.message);
    }
  };

  // EXCEL EXPORT
  const handleExportDistributorExcel = async () => {
    try {
      const token = localStorage.getItem('boat_finance_token');
      const res = await fetch('/api/distributor/export-excel', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to export distributor excel report');

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `HK_Traders_Distributor_Report_${new Date().toISOString().substring(0, 10)}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Export Error: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--accent-cyan)' }}>
        Loading Distributor ERP...
      </div>
    );
  }

  return (
    <div style={{ padding: '1.25rem', maxWidth: '1280px', margin: '0 auto' }}>
      
      {/* Top Header Module Switcher */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', background: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)' }}>
        <div>
          <div style={{ fontSize: '0.85rem', textTransform: 'uppercase', tracking: '0.05em', color: 'var(--text-muted)', fontWeight: 600 }}>
            HK TRADERS & FISHING MATERIALS
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            📦 Distributor ERP Module
          </h1>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          <button
            onClick={() => onSwitchModule('boat')}
            style={{ padding: '0.6rem 1.2rem', borderRadius: '8px', border: '1px solid var(--accent-cyan)', background: 'transparent', color: 'var(--accent-cyan)', fontWeight: 600, cursor: 'pointer' }}
          >
            ⛵ Switch to Boat Finance
          </button>
          <button
            onClick={handleExportDistributorExcel}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: '1px solid #10b981', background: 'rgba(16,185,129,0.15)', color: '#10b981', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <FileText size={18} /> 📥 Export Excel
          </button>
          <button
            onClick={() => setShowSaleModal(true)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: '#10b981', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={18} /> + Add Sale
          </button>
          <button
            onClick={() => setShowPurchaseModal(true)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: '#0284c7', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <PlusCircle size={18} /> + Add Purchase
          </button>
          <button
            onClick={() => setShowPaymentModal(true)}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <DollarSign size={18} /> Record Payment
          </button>
          <button
            onClick={() => { setEditingParty(null); setPartyForm({ name: '', type: 'customer', phone: '', gst_number: '', address: '', opening_balance: '0' }); setShowPartyModal(true); }}
            style={{ padding: '0.6rem 1rem', borderRadius: '8px', border: 'none', background: '#f59e0b', color: '#fff', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Users size={18} /> + Add Party
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '0.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '0.75rem', marginBottom: '1.5rem' }}>
        {[
          { id: 'overview', label: '📊 Dashboard Overview' },
          { id: 'parties', label: `👥 Parties (${parties.length})` },
          { id: 'items', label: `📦 Items & Stock (${items.length})` },
          { id: 'sales', label: `🧾 Sales Invoices (${sales.length})` },
          { id: 'purchases', label: `🛒 Purchases (${purchases.length})` },
          { id: 'payments', label: `💳 Payment Ledger (${payments.length})` }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              padding: '0.6rem 1.1rem',
              borderRadius: '8px',
              border: activeTab === t.id ? '1px solid var(--accent-cyan)' : '1px solid transparent',
              background: activeTab === t.id ? 'rgba(0, 210, 255, 0.15)' : 'rgba(255,255,255,0.03)',
              color: activeTab === t.id ? 'var(--accent-cyan)' : 'var(--text-main)',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && data && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Receivable</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981', margin: '0.4rem 0 0.2rem 0' }}>
                {formatINR(data.total_receivable)}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>From {data.receivable_parties_count} Parties</span>
            </div>

            <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Payable</span>
              <h2 style={{ fontSize: '2rem', fontWeight: 800, color: '#ef4444', margin: '0.4rem 0 0.2rem 0' }}>
                {formatINR(data.total_payable)}
              </h2>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>From {data.payable_parties_count} Parties</span>
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.08)', padding: '1.25rem' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: '0 0 1rem 0', color: 'var(--text-main)' }}>
              Recent Transactions & Party Ledger
            </h3>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Number</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Party Name</th>
                    <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Total</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Balance</th>
                    <th style={{ padding: '0.75rem 1rem', textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recent_transactions.map((t, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                      <td style={{ padding: '0.85rem 1rem', fontWeight: 600, color: t.type === 'Sale' ? '#10b981' : '#ef4444' }}>{t.type}</td>
                      <td style={{ padding: '0.85rem 1rem', fontFamily: 'monospace' }}>{t.number}</td>
                      <td style={{ padding: '0.85rem 1rem' }}>{t.party_name}</td>
                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)' }}>{t.date}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700 }}>{formatINR(t.total)}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', fontWeight: 700, color: t.balance > 0 ? '#ef4444' : '#10b981' }}>{formatINR(t.balance)}</td>
                      <td style={{ padding: '0.85rem 1rem', textAlign: 'center' }}>
                        <span style={{ padding: '0.25rem 0.65rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: t.status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: t.status === 'Paid' ? '#10b981' : '#ef4444' }}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PARTIES */}
      {activeTab === 'parties' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Parties & Customers Directory</h3>
            <button onClick={() => { setEditingParty(null); setPartyForm({ name: '', type: 'customer', phone: '', gst_number: '', address: '', opening_balance: '0' }); setShowPartyModal(true); }} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              + Add Party
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Name</th>
                  <th style={{ padding: '0.75rem' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Phone</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Current Balance</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {parties.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{p.name}</td>
                    <td style={{ padding: '0.75rem', textTransform: 'capitalize' }}>{p.type}</td>
                    <td style={{ padding: '0.75rem' }}>{p.phone || '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: p.current_balance > 0 ? '#ef4444' : '#10b981' }}>{formatINR(p.current_balance)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => { setEditingParty(p); setPartyForm(p); setShowPartyModal(true); }} style={{ padding: '0.3rem 0.6rem', marginRight: '0.4rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteParty(p.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: ITEMS */}
      {activeTab === 'items' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Inventory & Items</h3>
            <button onClick={() => { setEditingItem(null); setItemForm({ name: '', category: 'Fishing Nets', unit: 'kg', current_stock: '0', purchase_price: '0', sale_price: '0', low_stock_alert: '10' }); setShowItemModal(true); }} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              + Add Item
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Item Name</th>
                  <th style={{ padding: '0.75rem' }}>Category</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Stock Qty</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Purchase Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Sale Price</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map(i => (
                  <tr key={i.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{i.name}</td>
                    <td style={{ padding: '0.75rem' }}>{i.category}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: i.current_stock <= i.low_stock_alert ? '#ef4444' : '#10b981' }}>{i.current_stock} {i.unit}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>{formatINR(i.purchase_price)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 600 }}>{formatINR(i.sale_price)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => { setEditingItem(i); setItemForm(i); setShowItemModal(true); }} style={{ padding: '0.3rem 0.6rem', marginRight: '0.4rem', borderRadius: '6px', background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}>
                        <Edit size={14} /> Edit
                      </button>
                      <button onClick={() => handleDeleteItem(i.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SALES INVOICES */}
      {activeTab === 'sales' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Sales Invoices</h3>
            <button onClick={() => setShowSaleModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#10b981', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              + Add Sale
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Invoice No</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Customer Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Received</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Balance Due</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sales.map(s => (
                  <tr key={s.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>{s.invoice_no}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{s.date}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{s.party_name}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>{formatINR(s.total_amount)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatINR(s.received_amount)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: s.balance > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{formatINR(s.balance)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: s.status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: s.status === 'Paid' ? '#10b981' : '#ef4444' }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => handleDeleteSale(s.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: PURCHASES */}
      {activeTab === 'purchases' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Purchase Invoices</h3>
            <button onClick={() => setShowPurchaseModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#0284c7', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              + Add Purchase
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Invoice No</th>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Supplier Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Total Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Paid Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Balance Payable</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {purchases.map(pur => (
                  <tr key={pur.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem', fontFamily: 'monospace', fontWeight: 700 }}>{pur.invoice_no}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{pur.date}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{pur.party_name}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700 }}>{formatINR(pur.total_amount)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: '#10b981', fontWeight: 600 }}>{formatINR(pur.paid_amount)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', color: pur.balance > 0 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{formatINR(pur.balance)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: pur.status === 'Paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: pur.status === 'Paid' ? '#10b981' : '#ef4444' }}>
                        {pur.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => handleDeletePurchase(pur.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 6: PAYMENT LEDGER */}
      {activeTab === 'payments' && (
        <div style={{ background: 'var(--bg-surface)', borderRadius: '14px', padding: '1.25rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--text-main)' }}>Payment Ledger</h3>
            <button onClick={() => setShowPaymentModal(true)} style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: '#8b5cf6', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
              Record Payment
            </button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>Party Name</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Amount</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Type</th>
                  <th style={{ padding: '0.75rem' }}>Payment Mode</th>
                  <th style={{ padding: '0.75rem' }}>Notes</th>
                  <th style={{ padding: '0.75rem', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(pay => (
                  <tr key={pay.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', color: 'var(--text-main)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{pay.date}</td>
                    <td style={{ padding: '0.75rem', fontWeight: 600 }}>{pay.party_name}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: 700, color: pay.type === 'in' ? '#10b981' : '#ef4444' }}>{formatINR(pay.amount)}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <span style={{ padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 700, background: pay.type === 'in' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: pay.type === 'in' ? '#10b981' : '#ef4444' }}>
                        {pay.type === 'in' ? 'RECEIVED' : 'PAID OUT'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{pay.mode}</td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-muted)' }}>{pay.notes || '-'}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                      <button onClick={() => handleDeletePayment(pay.id)} style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', background: 'rgba(239,68,68,0.15)', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={14} /> Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT PARTY */}
      {showPartyModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>{editingParty ? 'Edit Party' : 'Add New Party'}</h3>
            <form onSubmit={handleSaveParty}>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Party Name *</label>
                <input required type="text" value={partyForm.name} onChange={e => setPartyForm({ ...partyForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Type</label>
                <select value={partyForm.type} onChange={e => setPartyForm({ ...partyForm, type: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                  <option value="customer">Customer</option>
                  <option value="supplier">Supplier</option>
                  <option value="both">Both</option>
                </select>
              </div>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Phone Number</label>
                <input type="text" value={partyForm.phone || ''} onChange={e => setPartyForm({ ...partyForm, phone: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>GST Number</label>
                <input type="text" value={partyForm.gst_number || ''} onChange={e => setPartyForm({ ...partyForm, gst_number: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Address</label>
                <input type="text" value={partyForm.address || ''} onChange={e => setPartyForm({ ...partyForm, address: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Opening Balance (₹)</label>
                <input type="number" step="any" value={partyForm.opening_balance || '0'} onChange={e => setPartyForm({ ...partyForm, opening_balance: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowPartyModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Party</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT ITEM */}
      {showItemModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '12px', width: '100%', maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>{editingItem ? 'Edit Item' : 'Add New Item'}</h3>
            <form onSubmit={handleSaveItem}>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Item Name *</label>
                <input required type="text" value={itemForm.name} onChange={e => setItemForm({ ...itemForm, name: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Category</label>
                  <select value={itemForm.category} onChange={e => setItemForm({ ...itemForm, category: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                    <option value="Fishing Nets">Fishing Nets</option>
                    <option value="Tackle">Tackle</option>
                    <option value="Rope">Rope</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Misc">Misc</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Unit</label>
                  <select value={itemForm.unit} onChange={e => setItemForm({ ...itemForm, unit: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                    <option value="kg">kg</option>
                    <option value="pcs">pcs</option>
                    <option value="meter">meter</option>
                    <option value="roll">roll</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Stock Qty</label>
                  <input type="number" step="any" value={itemForm.current_stock} onChange={e => setItemForm({ ...itemForm, current_stock: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Purchase Price</label>
                  <input type="number" step="any" value={itemForm.purchase_price} onChange={e => setItemForm({ ...itemForm, purchase_price: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Sale Price</label>
                  <input type="number" step="any" value={itemForm.sale_price} onChange={e => setItemForm({ ...itemForm, sale_price: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowItemModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#0284c7', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Item</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SALE INVOICE */}
      {showSaleModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', width: '100%', maxWidth: '640px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>+ Create Sale Invoice</h3>
            <form onSubmit={handleCreateSale}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select Customer *</label>
                  <select required value={saleForm.party_id} onChange={e => setSaleForm({ ...saleForm, party_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                    <option value="">Select Party...</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Date *</label>
                  <input required type="date" value={saleForm.date} onChange={e => setSaleForm({ ...saleForm, date: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Items List</label>
                {saleLineItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select required value={item.item_id} onChange={e => {
                      const sel = items.find(i => i.id === parseInt(e.target.value));
                      const copy = [...saleLineItems];
                      copy[idx].item_id = e.target.value;
                      if (sel) copy[idx].rate = sel.sale_price;
                      setSaleLineItems(copy);
                    }} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <option value="">Select Item...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} (Stock: {i.current_stock})</option>)}
                    </select>
                    <input type="number" placeholder="Qty" value={item.qty} onChange={e => { const copy = [...saleLineItems]; copy[idx].qty = e.target.value; setSaleLineItems(copy); }} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' }} />
                    <input type="number" placeholder="Rate" value={item.rate} onChange={e => { const copy = [...saleLineItems]; copy[idx].rate = e.target.value; setSaleLineItems(copy); }} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' }} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowSaleModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#10b981', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create Sale Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD PURCHASE INVOICE */}
      {showPurchaseModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', width: '100%', maxWidth: '640px', border: '1px solid rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>+ Create Purchase Invoice</h3>
            <form onSubmit={handleCreatePurchase}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select Supplier *</label>
                  <select required value={purchaseForm.party_id} onChange={e => setPurchaseForm({ ...purchaseForm, party_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                    <option value="">Select Supplier...</option>
                    {parties.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Date *</label>
                  <input required type="date" value={purchaseForm.date} onChange={e => setPurchaseForm({ ...purchaseForm, date: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
                </div>
              </div>

              {/* Line Items */}
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Purchased Items List</label>
                {purchaseLineItems.map((item, idx) => (
                  <div key={idx} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr auto', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <select required value={item.item_id} onChange={e => {
                      const sel = items.find(i => i.id === parseInt(e.target.value));
                      const copy = [...purchaseLineItems];
                      copy[idx].item_id = e.target.value;
                      if (sel) copy[idx].rate = sel.purchase_price;
                      setPurchaseLineItems(copy);
                    }} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' }}>
                      <option value="">Select Item...</option>
                      {items.map(i => <option key={i.id} value={i.id}>{i.name} (Current: {i.current_stock})</option>)}
                    </select>
                    <input type="number" placeholder="Qty" value={item.qty} onChange={e => { const copy = [...purchaseLineItems]; copy[idx].qty = e.target.value; setPurchaseLineItems(copy); }} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' }} />
                    <input type="number" placeholder="Purchase Rate" value={item.rate} onChange={e => { const copy = [...purchaseLineItems]; copy[idx].rate = e.target.value; setPurchaseLineItems(copy); }} style={{ padding: '0.5rem', borderRadius: '6px', background: 'var(--bg-primary)', color: 'var(--text-main)', border: '1px solid rgba(255,255,255,0.15)' }} />
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowPurchaseModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#0284c7', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Create Purchase Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECORD PAYMENT */}
      {showPaymentModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: '14px', width: '100%', maxWidth: '480px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h3 style={{ margin: '0 0 1rem 0', color: 'var(--text-main)' }}>💳 Record Payment</h3>
            <form onSubmit={handleRecordPayment}>
              <div style={{ marginBottom: '0.8rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Select Party *</label>
                <select required value={paymentForm.party_id} onChange={e => setPaymentForm({ ...paymentForm, party_id: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                  <option value="">Select Party...</option>
                  {parties.map(p => <option key={p.id} value={p.id}>{p.name} (Balance: ₹{p.current_balance})</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem', marginBottom: '0.8rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Amount (₹) *</label>
                  <input required type="number" value={paymentForm.amount} onChange={e => setPaymentForm({ ...paymentForm, amount: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>Type</label>
                  <select value={paymentForm.type} onChange={e => setPaymentForm({ ...paymentForm, type: e.target.value })} style={{ width: '100%', padding: '0.6rem', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.15)', background: 'var(--bg-primary)', color: 'var(--text-main)' }}>
                    <option value="in">Payment Received (In)</option>
                    <option value="out">Payment Made (Out)</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '1.2rem' }}>
                <button type="button" onClick={() => setShowPaymentModal(false)} style={{ padding: '0.6rem 1rem', borderRadius: '6px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)', color: 'var(--text-main)', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '0.6rem 1.2rem', borderRadius: '6px', background: '#8b5cf6', border: 'none', color: '#fff', fontWeight: 700, cursor: 'pointer' }}>Save Payment</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
