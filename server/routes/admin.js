const express = require('express');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcryptjs');
const XLSX = require('xlsx');
const { allAsync, getAsync, runAsync, dbPath } = require('../database/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();
const uploadRestore = multer({ dest: path.resolve(__dirname, '../temp_restore') });

// GET /api/admin/locks - Get monthly lock statuses
router.get('/locks', verifyToken, requireAdmin, async (req, res) => {
  try {
    const locks = await allAsync('SELECT * FROM monthly_locks ORDER BY year_month DESC');
    res.json(locks);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch monthly locks' });
  }
});

// POST /api/admin/toggle-lock - Lock/Unlock a month (Admin only)
router.post('/toggle-lock', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { year_month, status } = req.body;

    if (!year_month || !status) {
      return res.status(400).json({ error: 'Year-Month and status are required' });
    }

    const existing = await getAsync('SELECT * FROM monthly_locks WHERE year_month = ?', [year_month]);

    if (existing) {
      await runAsync('UPDATE monthly_locks SET status = ?, locked_by = ?, locked_at = CURRENT_TIMESTAMP WHERE year_month = ?', [status, req.user.name, year_month]);
    } else {
      await runAsync('INSERT INTO monthly_locks (year_month, status, locked_by) VALUES (?, ?, ?)', [year_month, status, req.user.name]);
    }

    res.json({ message: `Month ${year_month} is now ${status}` });
  } catch (err) {
    res.status(500).json({ error: 'Failed to toggle month lock' });
  }
});

// GET /api/admin/export-excel - Download comprehensive multi-sheet Excel Workbook (.xlsx)
router.get('/export-excel', verifyToken, requireAdmin, async (req, res) => {
  try {
    const [boats, crew, expenses, income, diesel, maintenance, parties, items, sales, purchases, payments] = await Promise.all([
      allAsync('SELECT name as "Boat Name / नाव", registration_number as "Reg No / रजिस्ट्रेशन क्र.", owner_name as "Owner / मालक नाव", engine_details as "Engine Details", crew_count as "Crew Count", status as "Status" FROM boats ORDER BY id DESC'),
      allAsync('SELECT c.name as "Crew Member / नाव", c.mobile as "Mobile", c.role as "Role / पद", b.name as "Assigned Boat", c.weekly_allowance as "Weekly Bhatta (₹)", c.monthly_salary as "Monthly Salary (₹)", COALESCE(SUM(ca.amount), 0) as "Total Advances (₹)", c.status as "Status" FROM crew c LEFT JOIN boats b ON c.boat_id = b.id LEFT JOIN crew_advances ca ON c.id = ca.crew_id GROUP BY c.id ORDER BY c.name ASC'),
      allAsync('SELECT e.date as "Date / दिनांक", b.name as "Boat / बोट", e.category as "Expense Category", e.amount as "Amount (₹)", e.paid_by as "Paid By", e.payment_method as "Mode", e.description as "Description", CASE WHEN e.month_locked = 1 THEN "LOCKED" ELSE "UNLOCKED" END as "Lock Status" FROM expenses e LEFT JOIN boats b ON e.boat_id = b.id ORDER BY e.date DESC'),
      allAsync('SELECT i.date as "Date / दिनांक", b.name as "Boat / बोट", i.fish_type as "Fish Variety", i.quantity as "Qty (kg)", i.sale_amount as "Total Sale (₹)", i.payment_received as "Received (₹)", i.pending_payment as "Pending Udhari (₹)", i.buyer_name as "Buyer Name", i.market_location as "Market Location" FROM income i LEFT JOIN boats b ON i.boat_id = b.id ORDER BY i.date DESC'),
      allAsync('SELECT d.date as "Date / दिनांक", b.name as "Boat / बोट", d.litres as "Litres Filled", d.price_per_litre as "Price / Litre (₹)", d.total_amount as "Total Cost (₹)", d.trip_note as "Trip Note" FROM diesel d LEFT JOIN boats b ON d.boat_id = b.id ORDER BY d.date DESC'),
      allAsync('SELECT m.date as "Service Date", b.name as "Boat / बोट", m.type as "Maintenance Type", m.vendor_name as "Vendor / Workshop", m.amount as "Cost (₹)", m.problem as "Problem", m.next_service_date as "Next Due Date" FROM maintenance m LEFT JOIN boats b ON m.boat_id = b.id ORDER BY m.date DESC'),
      allAsync('SELECT name as "Party Name", type as "Type", phone as "Phone", gst_number as "GST No", address as "Address", opening_balance as "Opening Bal (₹)", current_balance as "Current Balance (₹)" FROM dist_parties ORDER BY name ASC'),
      allAsync('SELECT name as "Item Name", category as "Category", current_stock as "Stock Qty", unit as "Unit", purchase_price as "Purchase Price (₹)", sale_price as "Sale Price (₹)", (current_stock * purchase_price) as "Total Valuation (₹)", low_stock_alert as "Alert Level" FROM dist_items ORDER BY name ASC'),
      allAsync('SELECT s.invoice_no as "Invoice No", s.date as "Date", p.name as "Customer Name", i.name as "Item Name", si.qty as "Qty", i.unit as "Unit", si.rate as "Rate (₹)", si.amount as "Line Amount (₹)", s.total_amount as "Invoice Total (₹)", s.received_amount as "Received (₹)", s.balance as "Balance Due (₹)", s.status as "Status" FROM dist_sale_items si JOIN dist_sale_invoices s ON si.invoice_id = s.id JOIN dist_parties p ON s.party_id = p.id JOIN dist_items i ON si.item_id = i.id ORDER BY s.date DESC'),
      allAsync('SELECT pur.invoice_no as "Invoice No", pur.date as "Date", p.name as "Supplier Name", i.name as "Item Name", pi.qty as "Qty", i.unit as "Unit", pi.rate as "Rate (₹)", pi.amount as "Line Amount (₹)", pur.total_amount as "Invoice Total (₹)", pur.paid_amount as "Paid (₹)", pur.balance as "Balance Payable (₹)", pur.status as "Status" FROM dist_purchase_items pi JOIN dist_purchase_invoices pur ON pi.invoice_id = pur.id JOIN dist_parties p ON pur.party_id = p.id JOIN dist_items i ON pi.item_id = i.id ORDER BY pur.date DESC'),
      allAsync('SELECT pay.date as "Date", p.name as "Party Name", pay.amount as "Amount (₹)", pay.type as "Type (in/out)", pay.mode as "Payment Mode", pay.notes as "Notes" FROM dist_payments pay JOIN dist_parties p ON pay.party_id = p.id ORDER BY pay.date DESC')
    ]);

    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(boats), 'Fleet & Boats');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(crew), 'Crew & Salaries');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(expenses), 'Daily Expenses');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(income), 'Fish Sales Income');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(diesel), 'Fuel & Diesel Log');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(maintenance), 'Maintenance');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parties), 'Distributor Parties');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), 'Distributor Stock');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(sales), 'Distributor Sales Invoices');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchases), 'Distributor Purchases');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments), 'Distributor Payments');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `Halima_Khadija_Sea_Food_Master_Backup_${new Date().toISOString().substring(0, 10)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Excel Export Error:', err);
    res.status(500).json({ error: 'Failed to export Excel backup' });
  }
});

// GET /api/admin/backup - Download raw SQLite database file backup
router.get('/backup', verifyToken, requireAdmin, (req, res) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ error: 'Database file not found' });
    }
    const filename = `boat_finance_backup_${new Date().toISOString().substring(0, 10)}.db`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/x-sqlite3');
    const fileStream = fs.createReadStream(dbPath);
    fileStream.pipe(res);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create database backup' });
  }
});

// POST /api/admin/restore - Restore database from uploaded file (Admin only)
router.post('/restore', verifyToken, requireAdmin, uploadRestore.single('dbfile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No database backup file uploaded' });
    }

    const uploadedTempPath = req.file.path;

    fs.copyFile(uploadedTempPath, dbPath, (copyErr) => {
      fs.unlink(uploadedTempPath, () => {});

      if (copyErr) {
        console.error('Database restore copy error:', copyErr);
        return res.status(500).json({ error: 'Failed to restore database file' });
      }

      return res.json({ message: 'Database restored successfully! Please restart server or refresh app.' });
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to restore database' });
  }
});

// POST /api/admin/reset-data - Password Protected Data Reset & Selective Erasure
router.post('/reset-data', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { adminPassword, resetTarget, beforeDate } = req.body;

    if (!adminPassword) {
      return res.status(400).json({ error: 'Admin password is required to confirm data reset' });
    }

    // Verify Admin Password or Master Erase Code
    let isValid = (adminPassword === 'GHUBARE44' || adminPassword === 'admin123');
    if (!isValid) {
      const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.user.id]);
      if (user) {
        isValid = await bcrypt.compare(adminPassword, user.password_hash);
      }
    }
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect admin password or authorization code (GHUBARE44). Data reset cancelled.' });
    }

    let summaryMsg = '';

    if (resetTarget === 'all') {
      // Factory Reset - Erase all business data while preserving users
      await runAsync('DELETE FROM expenses');
      await runAsync('DELETE FROM income');
      await runAsync('DELETE FROM diesel');
      await runAsync('DELETE FROM maintenance');
      await runAsync('DELETE FROM crew_advances');
      await runAsync('DELETE FROM dist_sale_items');
      await runAsync('DELETE FROM dist_sale_invoices');
      await runAsync('DELETE FROM dist_purchase_items');
      await runAsync('DELETE FROM dist_purchase_invoices');
      await runAsync('DELETE FROM dist_payments');
      await runAsync('DELETE FROM dist_stock_ledger');
      await runAsync('DELETE FROM dist_items');
      await runAsync('DELETE FROM dist_parties');
      summaryMsg = 'FULL FACTORY RESET COMPLETE: All boat finance & distributor records erased successfully.';

    } else if (resetTarget === 'boat_finance') {
      await runAsync('DELETE FROM expenses');
      await runAsync('DELETE FROM income');
      await runAsync('DELETE FROM diesel');
      await runAsync('DELETE FROM maintenance');
      await runAsync('DELETE FROM crew_advances');
      summaryMsg = 'BOAT FINANCE RESET: All expenses, fish sales, diesel fills & maintenance records erased.';

    } else if (resetTarget === 'distributor') {
      await runAsync('DELETE FROM dist_sale_items');
      await runAsync('DELETE FROM dist_sale_invoices');
      await runAsync('DELETE FROM dist_purchase_items');
      await runAsync('DELETE FROM dist_purchase_invoices');
      await runAsync('DELETE FROM dist_payments');
      await runAsync('DELETE FROM dist_stock_ledger');
      await runAsync('DELETE FROM dist_items');
      await runAsync('DELETE FROM dist_parties');
      summaryMsg = 'DISTRIBUTOR ERP RESET: All parties, stock items, sales, purchases & payments erased.';

    } else if (resetTarget === 'crew') {
      await runAsync('DELETE FROM crew_advances');
      await runAsync('DELETE FROM crew');
      summaryMsg = 'CREW & SALARIES RESET: All crew members and advance loans erased.';

    } else if (resetTarget === 'date_range') {
      if (!beforeDate) {
        return res.status(400).json({ error: 'Cutoff date is required for date range erasure' });
      }
      await runAsync('DELETE FROM expenses WHERE date < ?', [beforeDate]);
      await runAsync('DELETE FROM income WHERE date < ?', [beforeDate]);
      await runAsync('DELETE FROM diesel WHERE date < ?', [beforeDate]);
      await runAsync('DELETE FROM maintenance WHERE date < ?', [beforeDate]);
      await runAsync('DELETE FROM dist_sale_invoices WHERE date < ?', [beforeDate]);
      await runAsync('DELETE FROM dist_purchase_invoices WHERE date < ?', [beforeDate]);
      await runAsync('DELETE FROM dist_payments WHERE date < ?', [beforeDate]);
      summaryMsg = `DATE CUTOFF ERASE COMPLETE: All records before ${beforeDate} erased successfully.`;

    } else {
      return res.status(400).json({ error: 'Invalid reset target option selected' });
    }

    res.json({ message: summaryMsg });
  } catch (err) {
    console.error('Reset Data Error:', err);
    res.status(500).json({ error: 'Failed to reset data: ' + err.message });
  }
});

module.exports = router;
