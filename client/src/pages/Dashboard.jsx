import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import KPICard from '../components/KPICard';
import SmartAlerts from '../components/SmartAlerts';
import {
  DollarSign,
  TrendingDown,
  TrendingUp,
  Clock,
  Users,
  Calendar,
  Filter
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [boats, setBoats] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('2026-07');
  const [selectedBoat, setSelectedBoat] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBoats() {
      try {
        const b = await apiFetch('/boats');
        setBoats(b);
      } catch (err) {
        console.error('Failed to load boats:', err);
      }
    }
    loadBoats();
  }, []);

  useEffect(() => {
    async function fetchAnalytics() {
      setLoading(true);
      try {
        let query = `/analytics/dashboard?month=${selectedMonth}`;
        if (selectedBoat) query += `&boat_id=${selectedBoat}`;
        const res = await apiFetch(query);
        setData(res);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchAnalytics();
  }, [selectedMonth, selectedBoat]);

  if (loading || !data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading Dashboard Analytics...
      </div>
    );
  }

  const trendLabels = [...(data.monthlyTrends || [])].reverse().map(t => t.month);
  const dieselData = [...(data.monthlyTrends || [])].reverse().map(t => t.diesel_cost);
  const maintenanceData = [...(data.monthlyTrends || [])].reverse().map(t => t.maintenance_cost);
  const totalExpenseData = [...(data.monthlyTrends || [])].reverse().map(t => t.total_expense);

  const barChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Expenses',
        data: totalExpenseData,
        backgroundColor: 'rgba(244, 63, 94, 0.7)',
        borderColor: '#f43f5e',
        borderWidth: 1
      },
      {
        label: 'Diesel',
        data: dieselData,
        backgroundColor: 'rgba(0, 210, 255, 0.7)',
        borderColor: '#00d2ff',
        borderWidth: 1
      }
    ]
  };

  const categoryLabels = (data.categoryBreakdown || []).map(c => c.category);
  const categoryAmounts = (data.categoryBreakdown || []).map(c => c.total_amount);

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: categoryAmounts,
        backgroundColor: [
          '#00d2ff',
          '#f59e0b',
          '#10b981',
          '#f43f5e',
          '#6366f1',
          '#ec4899'
        ],
        borderWidth: 1
      }
    ]
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
            DASHBOARD
          </h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
            साखरी नाटे - नफा/तोटा विश्लेषण
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', width: '100%', maxWidth: '360px' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Calendar size={14} color="var(--accent-cyan)" />
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="form-control"
              style={{ padding: '0.1rem 0.2rem', border: 'none', background: 'transparent', minHeight: '34px', fontSize: '0.8rem' }}
            />
          </div>

          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-surface)', padding: '0.3rem 0.6rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
            <Filter size={14} color="var(--accent-cyan)" />
            <select
              value={selectedBoat}
              onChange={(e) => setSelectedBoat(e.target.value)}
              className="form-control"
              style={{ padding: '0.1rem 0.2rem', border: 'none', background: 'transparent', minHeight: '34px', fontSize: '0.8rem' }}
            >
              <option value="">All Boats</option>
              {boats.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="mobile-pnl-hero glass-card">
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>
          Net Profit / Loss ({data.targetMonth})
        </span>
        <div style={{ fontSize: '2.2rem', fontWeight: 900, color: data.currentProfit >= 0 ? '#10b981' : '#f43f5e', margin: '0.25rem 0' }}>
          ₹{data.currentProfit.toLocaleString('en-IN')}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          <span>Income: <strong style={{ color: '#10b981' }}>₹{data.currentIncome.toLocaleString('en-IN')}</strong></span>
          <span>Expenses: <strong style={{ color: '#f43f5e' }}>₹{data.currentExpenses.toLocaleString('en-IN')}</strong></span>
        </div>
      </div>

      <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem' }}>
        <KPICard
          title="Monthly Income"
          marathiTitle="मासे विक्री जमा"
          value={`₹${data.currentIncome.toLocaleString('en-IN')}`}
          changePct={data.incomeChangePct}
          icon={TrendingUp}
          color="#10b981"
        />
        <KPICard
          title="Monthly Expenses"
          marathiTitle="महिना खर्च"
          value={`₹${data.currentExpenses.toLocaleString('en-IN')}`}
          changePct={data.expenseChangePct}
          icon={TrendingDown}
          color="#f43f5e"
        />
        <KPICard
          title="Pending Buyers"
          marathiTitle="व्यापाऱ्यांची उधारी"
          value={`₹${data.totalPendingBuyerPayments.toLocaleString('en-IN')}`}
          icon={Clock}
          color="#f59e0b"
        />
        <KPICard
          title="Crew Advances"
          marathiTitle="खलाशी अ‍ॅडव्हान्स"
          value={`₹${data.pendingCrewAdvances.toLocaleString('en-IN')}`}
          icon={Users}
          color="#6366f1"
        />
      </div>

      <SmartAlerts suggestions={data.suggestions} />

      <div className="glass-card">
        <h3 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.65rem' }}>
          Boat Profit Breakdown ({data.targetMonth})
        </h3>

        <div className="desktop-table-view">
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Boat Name</th>
                  <th>Income</th>
                  <th>Expenses</th>
                  <th>Profit / Loss</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.boatComparison.map(b => (
                  <tr key={b.boat_id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{b.boat_name}</td>
                    <td style={{ color: '#10b981', fontWeight: 700 }}>₹{b.total_income.toLocaleString('en-IN')}</td>
                    <td style={{ color: '#f43f5e', fontWeight: 700 }}>₹{b.total_expenses.toLocaleString('en-IN')}</td>
                    <td style={{ fontWeight: 800, color: b.net_profit >= 0 ? '#10b981' : '#f43f5e' }}>
                      ₹{b.net_profit.toLocaleString('en-IN')}
                    </td>
                    <td>
                      <span className={b.net_profit >= 0 ? 'badge badge-success' : 'badge badge-danger'}>
                        {b.net_profit >= 0 ? 'PROFIT' : 'LOSS'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mobile-card-list">
          {data.boatComparison.map(b => (
            <div key={b.boat_id} className="mobile-card-item">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>{b.boat_name}</h4>
                <span className={b.net_profit >= 0 ? 'badge badge-success' : 'badge badge-danger'}>
                  {b.net_profit >= 0 ? 'PROFIT' : 'LOSS'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color)' }}>
                <span>Income: <strong style={{ color: '#10b981' }}>₹{b.total_income.toLocaleString('en-IN')}</strong></span>
                <span>Expenses: <strong style={{ color: '#f43f5e' }}>₹{b.total_expenses.toLocaleString('en-IN')}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
