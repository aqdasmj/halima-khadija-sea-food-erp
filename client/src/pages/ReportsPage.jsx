import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/api';
import { exportToExcel } from '../utils/exportExcel';
import { exportToPdf } from '../utils/exportPdf';
import { FileText, Download, Printer, Filter, Calendar, Ship } from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('expenses'); // 'expenses', 'income', 'diesel', 'crew', 'pnl'
  const [boats, setBoats] = useState([]);
  const [selectedBoat, setSelectedBoat] = useState('');
  const [startDate, setStartDate] = useState('2026-06-01');
  const [endDate, setEndDate] = useState('2026-07-31');

  const [reportData, setReportData] = useState([]);
  const [pnlSummary, setPnlSummary] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadBoats() {
      const b = await apiFetch('/boats');
      setBoats(b);
    }
    loadBoats();
  }, []);

  const generateReport = async () => {
    setLoading(true);
    try {
      if (reportType === 'pnl') {
        let query = `/analytics/dashboard?month=${endDate.substring(0, 7)}`;
        if (selectedBoat) query += `&boat_id=${selectedBoat}`;
        const res = await apiFetch(query);
        setPnlSummary(res);
        setReportData([]);
      } else {
        setPnlSummary(null);
        let endpoint = `/${reportType}?startDate=${startDate}&endDate=${endDate}`;
        if (selectedBoat) endpoint += `&boat_id=${selectedBoat}`;
        const res = await apiFetch(endpoint);
        setReportData(Array.isArray(res) ? res : (res.logs || []));
      }
    } catch (err) {
      console.error(err);
      alert('Failed to generate report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    generateReport();
  }, [reportType, selectedBoat, startDate, endDate]);

  const handleExcelExport = () => {
    if (reportType === 'pnl' && pnlSummary) {
      const exportRows = pnlSummary.boatComparison.map(b => ({
        'Boat Name': b.boat_name,
        'Income (₹)': b.total_income,
        'Expenses (₹)': b.total_expenses,
        'Net Profit/Loss (₹)': b.net_profit
      }));
      exportToExcel(exportRows, `PnL_Report_${endDate.substring(0, 7)}`);
    } else {
      const formatted = reportData.map(item => {
        const row = { ...item };
        delete row.receipt_path;
        delete row.month_locked;
        return row;
      });
      exportToExcel(formatted, `${reportType.toUpperCase()}_Report`);
    }
  };

  const handlePdfExport = () => {
    exportToPdf('printable-report-area', `${reportType.toUpperCase()}_Report`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff' }}>
            BUSINESS REPORTS & EXPORT
          </h2>
          <span style={{ fontSize: '0.85rem', color: '#00d2ff' }}>
            अहवाल, एक्सेल व पीडीएफ डाऊनलोड (साखरी नाटे)
          </span>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-success" onClick={handleExcelExport}>
            <Download size={16} /> Export Excel (.xlsx)
          </button>
          <button className="btn btn-secondary" onClick={handlePdfExport}>
            <Printer size={16} /> Export PDF (.pdf)
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FileText size={16} color="#00d2ff" />
          <select className="form-control" value={reportType} onChange={(e) => setReportType(e.target.value)} style={{ width: '180px' }}>
            <option value="expenses">Expenses Report (खर्च)</option>
            <option value="income">Fish Sale Income (जमा)</option>
            <option value="diesel">Diesel Report (डिझेल)</option>
            <option value="crew">Crew & Salary (खलाशी)</option>
            <option value="maintenance">Maintenance (दुरुस्ती)</option>
            <option value="pnl">Master Profit & Loss (नफा/तोटा)</option>
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Ship size={16} color="#00d2ff" />
          <select className="form-control" value={selectedBoat} onChange={(e) => setSelectedBoat(e.target.value)} style={{ width: '160px' }}>
            <option value="">All Boats</option>
            {boats.map(b => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Calendar size={16} color="#00d2ff" />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>From:</span>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ width: '140px' }}
          />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>To:</span>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ width: '140px' }}
          />
        </div>
      </div>

      <div id="printable-report-area" className="glass-card" style={{ padding: '1.5rem', background: '#0a1128' }}>
        <div style={{ borderBottom: '2px solid #00d2ff', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>BOAT FINANCE MANAGER REPORT</h2>
            <span style={{ fontSize: '0.85rem', color: '#00d2ff' }}>Sakhri Nate, Ratnagiri, Maharashtra</span>
          </div>
          <div style={{ textAlign: 'right', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            <div><strong>Report Type:</strong> {reportType.toUpperCase()}</div>
            <div><strong>Date Range:</strong> {startDate} to {endDate}</div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Generating report data...</div>
        ) : reportType === 'pnl' && pnlSummary ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(16,185,129,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid #10b981' }}>
                <span style={{ fontSize: '0.8rem', color: '#6ee7b7' }}>Total Income</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#10b981' }}>₹{pnlSummary.currentIncome.toLocaleString('en-IN')}</h3>
              </div>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(244,63,94,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid #f43f5e' }}>
                <span style={{ fontSize: '0.8rem', color: '#fda4af' }}>Total Expenses</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#f43f5e' }}>₹{pnlSummary.currentExpenses.toLocaleString('en-IN')}</h3>
              </div>
              <div style={{ flex: 1, padding: '1rem', background: 'rgba(0,210,255,0.15)', borderRadius: 'var(--radius-sm)', border: '1px solid #00d2ff' }}>
                <span style={{ fontSize: '0.8rem', color: '#7dd3fc' }}>Net Profit / Loss</span>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: pnlSummary.currentProfit >= 0 ? '#10b981' : '#f43f5e' }}>
                  ₹{pnlSummary.currentProfit.toLocaleString('en-IN')}
                </h3>
              </div>
            </div>

            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Boat Name</th>
                    <th>Income (₹)</th>
                    <th>Expenses (₹)</th>
                    <th>Net Profit / Loss (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {pnlSummary.boatComparison.map(b => (
                    <tr key={b.boat_id}>
                      <td style={{ fontWeight: 700 }}>{b.boat_name}</td>
                      <td style={{ color: '#10b981', fontWeight: 700 }}>₹{b.total_income.toLocaleString('en-IN')}</td>
                      <td style={{ color: '#f43f5e', fontWeight: 700 }}>₹{b.total_expenses.toLocaleString('en-IN')}</td>
                      <td style={{ fontWeight: 800, color: b.net_profit >= 0 ? '#10b981' : '#f43f5e' }}>₹{b.net_profit.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  {reportData.length > 0 && Object.keys(reportData[0]).filter(k => k !== 'receipt_path' && k !== 'month_locked').map(key => (
                    <th key={key}>{key.replace('_', ' ').toUpperCase()}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reportData.length === 0 ? (
                  <tr><td colSpan="10" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>No data records found for selected period.</td></tr>
                ) : (
                  reportData.map((row, idx) => (
                    <tr key={idx}>
                      {Object.keys(row).filter(k => k !== 'receipt_path' && k !== 'month_locked').map(key => (
                        <td key={key}>{row[key] !== null ? String(row[key]) : '-'}</td>
                      ))}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
