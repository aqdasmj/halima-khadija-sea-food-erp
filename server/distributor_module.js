/**
 * =========================================================================================
 *  DISTRIBUTOR MODULE - FULL CRUD REST API (HK TRADERS & FISHING MATERIALS)
 * =========================================================================================
 *  Fishing Net & Tackle Distribution ERP replacing Vyapar.
 *  Includes full CRUD for Parties, Items/Stock, Sale Invoices, Purchase Invoices, & Payments.
 * =========================================================================================
 */

const express = require('express');
const router = express.Router();
const XLSX = require('xlsx');
const { db, runAsync, allAsync, getAsync } = require('./database/db');

// -----------------------------------------------------------------------------------------
// 1. DATABASE SCHEMA INITIALIZATION FOR DISTRIBUTOR
// -----------------------------------------------------------------------------------------
function initDistributorDb() {
  db.serialize(() => {
    // 1. Parties
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_parties (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL DEFAULT 'both', -- 'customer', 'supplier', 'both'
        phone TEXT,
        gst_number TEXT,
        address TEXT,
        opening_balance REAL DEFAULT 0,
        current_balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 2. Items / Products
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Fishing Nets',
        unit TEXT NOT NULL DEFAULT 'kg', -- 'pcs', 'kg', 'meter', 'roll'
        current_stock REAL DEFAULT 0,
        purchase_price REAL NOT NULL DEFAULT 0,
        sale_price REAL NOT NULL DEFAULT 0,
        low_stock_alert REAL DEFAULT 10,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // 3. Sale Invoices
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_sale_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE NOT NULL,
        party_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        received_amount REAL DEFAULT 0,
        balance REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Unpaid', -- 'Paid', 'Unpaid', 'Partial'
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES dist_parties(id) ON DELETE RESTRICT
      )
    `);

    // 4. Sale Items
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        rate REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES dist_sale_invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES dist_items(id) ON DELETE RESTRICT
      )
    `);

    // 5. Purchase Invoices
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_purchase_invoices (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_no TEXT UNIQUE NOT NULL,
        party_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        total_amount REAL NOT NULL,
        paid_amount REAL DEFAULT 0,
        balance REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Unpaid', -- 'Paid', 'Unpaid', 'Partial'
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES dist_parties(id) ON DELETE RESTRICT
      )
    `);

    // 6. Purchase Items
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_purchase_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        invoice_id INTEGER NOT NULL,
        item_id INTEGER NOT NULL,
        qty REAL NOT NULL,
        rate REAL NOT NULL,
        amount REAL NOT NULL,
        FOREIGN KEY (invoice_id) REFERENCES dist_purchase_invoices(id) ON DELETE CASCADE,
        FOREIGN KEY (item_id) REFERENCES dist_items(id) ON DELETE RESTRICT
      )
    `);

    // 7. Payments Ledger
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_payments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        party_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        amount REAL NOT NULL,
        type TEXT NOT NULL, -- 'in' or 'out'
        mode TEXT DEFAULT 'Cash', -- 'Cash', 'UPI', 'Bank'
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (party_id) REFERENCES dist_parties(id) ON DELETE RESTRICT
      )
    `);

    // 8. Stock Ledger
    db.run(`
      CREATE TABLE IF NOT EXISTS dist_stock_ledger (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        item_id INTEGER NOT NULL,
        date TEXT NOT NULL,
        type TEXT NOT NULL, -- 'in' or 'out'
        qty REAL NOT NULL,
        ref_type TEXT NOT NULL, -- 'sale', 'purchase', 'adjustment'
        ref_id INTEGER,
        balance_after REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (item_id) REFERENCES dist_items(id) ON DELETE CASCADE
      )
    `);

    // Seed Data if empty
    db.get('SELECT COUNT(*) as count FROM dist_parties', [], async (err, row) => {
      if (!err && row.count === 0) {
        console.log('Seeding Distributor module with Vyapar data...');

        const p1 = await runAsync(`INSERT INTO dist_parties (name, type, phone, current_balance) VALUES (?, ?, ?, ?)`, ['Chidambaram Fishnets Pvt Ltd', 'supplier', '9822001122', 11443080]);
        const p2 = await runAsync(`INSERT INTO dist_parties (name, type, phone, current_balance) VALUES (?, ?, ?, ?)`, ['Talha Ghubare', 'customer', '9822112233', 2964267]);
        const p3 = await runAsync(`INSERT INTO dist_parties (name, type, phone, current_balance) VALUES (?, ?, ?, ?)`, ['Shafiq Darwe', 'customer', '9822223344', 1190882]);
        const p4 = await runAsync(`INSERT INTO dist_parties (name, type, phone, current_balance) VALUES (?, ?, ?, ?)`, ['Wali Borkar', 'customer', '9822334455', 474355]);

        const i1 = await runAsync(`INSERT INTO dist_items (name, category, unit, current_stock, purchase_price, sale_price, low_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['Fishing Nets 1.25X25X12 HDPE BLUE', 'Fishing Nets', 'kg', 50, 261.90, 320.00, 10]);
        const i2 = await runAsync(`INSERT INTO dist_items (name, category, unit, current_stock, purchase_price, sale_price, low_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['Fishing Nets 2.50X110X11 HDPE BLUE', 'Fishing Nets', 'kg', 113.6, 280.00, 350.00, 15]);
        const i3 = await runAsync(`INSERT INTO dist_items (name, category, unit, current_stock, purchase_price, sale_price, low_stock_alert) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['Fishing Nets 2/3X18X600 RED SK', 'Fishing Nets', 'kg', 5545.12, 290.00, 360.00, 100]);

        const pur1 = await runAsync(`INSERT INTO dist_purchase_invoices (invoice_no, party_id, date, total_amount, paid_amount, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['2504321', p1.id, '2026-03-13', 225286, 0, 225286, 'Unpaid']);
        await runAsync(`INSERT INTO dist_purchase_items (invoice_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)`, [pur1.id, i1.id, 860, 261.90, 225286]);
        await runAsync(`INSERT INTO dist_stock_ledger (item_id, date, type, qty, ref_type, ref_id, balance_after) VALUES (?, ?, ?, ?, ?, ?, ?)`, [i1.id, '2026-03-13', 'in', 860, 'purchase', pur1.id, 50]);

        const sale1 = await runAsync(`INSERT INTO dist_sale_invoices (invoice_no, party_id, date, total_amount, received_amount, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['SAL-1001', p2.id, '2026-07-28', 2964267, 0, 2964267, 'Unpaid']);
        await runAsync(`INSERT INTO dist_sale_items (invoice_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)`, [sale1.id, i3.id, 8234, 360.00, 2964267]);

        const sale2 = await runAsync(`INSERT INTO dist_sale_invoices (invoice_no, party_id, date, total_amount, received_amount, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['SAL-1002', p3.id, '2026-07-30', 1190882, 0, 1190882, 'Unpaid']);
        await runAsync(`INSERT INTO dist_sale_items (invoice_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)`, [sale2.id, i2.id, 3402, 350.00, 1190882]);

        const sale3 = await runAsync(`INSERT INTO dist_sale_invoices (invoice_no, party_id, date, total_amount, received_amount, balance, status) VALUES (?, ?, ?, ?, ?, ?, ?)`, ['SAL-1003', p4.id, '2026-07-31', 474355, 0, 474355, 'Unpaid']);
        await runAsync(`INSERT INTO dist_sale_items (invoice_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)`, [sale3.id, i1.id, 1482, 320.00, 474355]);

        console.log('Distributor seed data initialized.');
      }
    });
  });
}
initDistributorDb();

// -----------------------------------------------------------------------------------------
// 2. DASHBOARD METRICS ENDPOINT
// -----------------------------------------------------------------------------------------
router.get('/dashboard', async (req, res) => {
  try {
    const receivableRow = await getAsync(`
      SELECT COALESCE(SUM(current_balance), 0) as total, COUNT(*) as count 
      FROM dist_parties 
      WHERE current_balance > 0 AND (type = 'customer' OR type = 'both')
    `);

    const payableRow = await getAsync(`
      SELECT COALESCE(SUM(balance), 0) as total, COUNT(DISTINCT party_id) as count 
      FROM dist_purchase_invoices 
      WHERE status != 'Paid'
    `);

    const supplierPartyRow = await getAsync(`
      SELECT COALESCE(SUM(current_balance), 0) as total, COUNT(*) as count 
      FROM dist_parties 
      WHERE current_balance > 0 AND type = 'supplier'
    `);

    const totalPayableAmount = Math.max(payableRow.total, supplierPartyRow.total);
    const payablePartiesCount = Math.max(payableRow.count, supplierPartyRow.count);

    const lowStockItems = await allAsync(`
      SELECT * FROM dist_items WHERE current_stock <= low_stock_alert ORDER BY current_stock ASC
    `);

    const recentSales = await allAsync(`
      SELECT s.id, 'Sale' as type, s.invoice_no as number, s.date, s.total_amount as total, s.balance, s.status, p.name as party_name, s.party_id
      FROM dist_sale_invoices s
      JOIN dist_parties p ON s.party_id = p.id
      ORDER BY s.date DESC LIMIT 20
    `);

    const recentPurchases = await allAsync(`
      SELECT pur.id, 'Purchase' as type, pur.invoice_no as number, pur.date, pur.total_amount as total, pur.balance, pur.status, p.name as party_name, pur.party_id
      FROM dist_purchase_invoices pur
      JOIN dist_parties p ON pur.party_id = p.id
      ORDER BY pur.date DESC LIMIT 20
    `);

    const combinedTransactions = [...recentSales, ...recentPurchases]
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 30);

    res.json({
      companyName: 'HK TRADERS & FISHING MATERIALS',
      total_receivable: receivableRow.total,
      receivable_parties_count: receivableRow.count,
      total_payable: totalPayableAmount,
      payable_parties_count: payablePartiesCount,
      low_stock_items: lowStockItems,
      recent_transactions: combinedTransactions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------------------
// 3. PARTIES CRUD API
// -----------------------------------------------------------------------------------------
router.get('/parties', async (req, res) => {
  try {
    const parties = await allAsync('SELECT * FROM dist_parties ORDER BY name ASC');
    res.json(parties);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/parties', async (req, res) => {
  try {
    const { name, type, phone, gst_number, address, opening_balance } = req.body;
    if (!name) return res.status(400).json({ error: 'Party name is required' });

    const openBal = parseFloat(opening_balance) || 0;
    const result = await runAsync(
      `INSERT INTO dist_parties (name, type, phone, gst_number, address, opening_balance, current_balance)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, type || 'both', phone || null, gst_number || null, address || null, openBal, openBal]
    );

    res.json({ message: 'Party created successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, type, phone, gst_number, address, current_balance } = req.body;
    if (!name) return res.status(400).json({ error: 'Party name is required' });

    await runAsync(
      `UPDATE dist_parties SET name = ?, type = ?, phone = ?, gst_number = ?, address = ?, current_balance = ? WHERE id = ?`,
      [name, type || 'both', phone || null, gst_number || null, address || null, parseFloat(current_balance) || 0, id]
    );

    res.json({ message: 'Party updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/parties/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runAsync('DELETE FROM dist_parties WHERE id = ?', [id]);
    res.json({ message: 'Party deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------------------
// 4. ITEMS / STOCK CRUD API
// -----------------------------------------------------------------------------------------
router.get('/items', async (req, res) => {
  try {
    const items = await allAsync('SELECT * FROM dist_items ORDER BY name ASC');
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/items', async (req, res) => {
  try {
    const { name, category, unit, current_stock, purchase_price, sale_price, low_stock_alert } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });

    const result = await runAsync(
      `INSERT INTO dist_items (name, category, unit, current_stock, purchase_price, sale_price, low_stock_alert)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, category || 'Fishing Nets', unit || 'kg', parseFloat(current_stock) || 0, parseFloat(purchase_price) || 0, parseFloat(sale_price) || 0, parseFloat(low_stock_alert) || 10]
    );

    res.json({ message: 'Item created successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit, current_stock, purchase_price, sale_price, low_stock_alert } = req.body;
    if (!name) return res.status(400).json({ error: 'Item name is required' });

    await runAsync(
      `UPDATE dist_items SET name = ?, category = ?, unit = ?, current_stock = ?, purchase_price = ?, sale_price = ?, low_stock_alert = ? WHERE id = ?`,
      [name, category || 'Fishing Nets', unit || 'kg', parseFloat(current_stock) || 0, parseFloat(purchase_price) || 0, parseFloat(sale_price) || 0, parseFloat(low_stock_alert) || 10, id]
    );

    res.json({ message: 'Item updated successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await runAsync('DELETE FROM dist_items WHERE id = ?', [id]);
    res.json({ message: 'Item deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------------------
// 5. SALES INVOICES CRUD API (With Stock Decrement & Stock Ledger)
// -----------------------------------------------------------------------------------------
router.get('/sales', async (req, res) => {
  try {
    const sales = await allAsync(`
      SELECT s.*, p.name as party_name, p.phone as party_phone
      FROM dist_sale_invoices s
      JOIN dist_parties p ON s.party_id = p.id
      ORDER BY s.date DESC, s.id DESC
    `);
    res.json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/sales', async (req, res) => {
  try {
    const { invoice_no, party_id, date, items, received_amount, notes } = req.body;
    if (!party_id || !date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Party, date, and line items are required' });
    }

    const invNo = invoice_no || `SAL-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;
    items.forEach(i => {
      totalAmount += (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0);
    });

    const recAmt = parseFloat(received_amount) || 0;
    const balance = Math.max(0, totalAmount - recAmt);
    let status = 'Unpaid';
    if (balance === 0) status = 'Paid';
    else if (recAmt > 0) status = 'Partial';

    const invRes = await runAsync(
      `INSERT INTO dist_sale_invoices (invoice_no, party_id, date, total_amount, received_amount, balance, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invNo, party_id, date, totalAmount, recAmt, balance, status, notes || null]
    );

    for (const item of items) {
      const lineAmt = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      await runAsync(
        `INSERT INTO dist_sale_items (invoice_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)`,
        [invRes.id, item.item_id, item.qty, item.rate, lineAmt]
      );

      await runAsync(`UPDATE dist_items SET current_stock = current_stock - ? WHERE id = ?`, [item.qty, item.item_id]);

      const updatedItem = await getAsync(`SELECT current_stock FROM dist_items WHERE id = ?`, [item.item_id]);

      await runAsync(
        `INSERT INTO dist_stock_ledger (item_id, date, type, qty, ref_type, ref_id, balance_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.item_id, date, 'out', item.qty, 'sale', invRes.id, updatedItem ? updatedItem.current_stock : 0]
      );
    }

    if (balance > 0) {
      await runAsync(`UPDATE dist_parties SET current_balance = current_balance + ? WHERE id = ?`, [balance, party_id]);
    }

    res.json({ message: 'Sale invoice created successfully', id: invRes.id, invoice_no: invNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { received_amount, status } = req.body;

    const existing = await getAsync('SELECT * FROM dist_sale_invoices WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const newRec = parseFloat(received_amount);
    const newBal = Math.max(0, existing.total_amount - newRec);
    let newStatus = status || (newBal === 0 ? 'Paid' : newRec > 0 ? 'Partial' : 'Unpaid');

    await runAsync(
      `UPDATE dist_sale_invoices SET received_amount = ?, balance = ?, status = ? WHERE id = ?`,
      [newRec, newBal, newStatus, id]
    );

    const diff = existing.balance - newBal;
    if (diff !== 0) {
      await runAsync(`UPDATE dist_parties SET current_balance = MAX(0, current_balance - ?) WHERE id = ?`, [diff, existing.party_id]);
    }

    res.json({ message: 'Sale invoice updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/sales/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await getAsync('SELECT * FROM dist_sale_invoices WHERE id = ?', [id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = await allAsync('SELECT * FROM dist_sale_items WHERE invoice_id = ?', [id]);
    for (const item of items) {
      await runAsync('UPDATE dist_items SET current_stock = current_stock + ? WHERE id = ?', [item.qty, item.item_id]);
    }

    if (invoice.balance > 0) {
      await runAsync('UPDATE dist_parties SET current_balance = MAX(0, current_balance - ?) WHERE id = ?', [invoice.balance, invoice.party_id]);
    }

    await runAsync('DELETE FROM dist_sale_invoices WHERE id = ?', [id]);
    res.json({ message: 'Sale invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------------------
// 6. PURCHASE INVOICES CRUD API (With Stock Increment & Stock Ledger)
// -----------------------------------------------------------------------------------------
router.get('/purchases', async (req, res) => {
  try {
    const purchases = await allAsync(`
      SELECT pur.*, p.name as party_name, p.phone as party_phone
      FROM dist_purchase_invoices pur
      JOIN dist_parties p ON pur.party_id = p.id
      ORDER BY pur.date DESC, pur.id DESC
    `);
    res.json(purchases);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/purchases', async (req, res) => {
  try {
    const { invoice_no, party_id, date, items, paid_amount, notes } = req.body;
    if (!party_id || !date || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Party, date, and line items are required' });
    }

    const invNo = invoice_no || `PUR-${Date.now().toString().slice(-6)}`;
    let totalAmount = 0;
    items.forEach(i => {
      totalAmount += (parseFloat(i.qty) || 0) * (parseFloat(i.rate) || 0);
    });

    const paidAmt = parseFloat(paid_amount) || 0;
    const balance = Math.max(0, totalAmount - paidAmt);
    let status = 'Unpaid';
    if (balance === 0) status = 'Paid';
    else if (paidAmt > 0) status = 'Partial';

    const invRes = await runAsync(
      `INSERT INTO dist_purchase_invoices (invoice_no, party_id, date, total_amount, paid_amount, balance, status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [invNo, party_id, date, totalAmount, paidAmt, balance, status, notes || null]
    );

    for (const item of items) {
      const lineAmt = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      await runAsync(
        `INSERT INTO dist_purchase_items (invoice_id, item_id, qty, rate, amount) VALUES (?, ?, ?, ?, ?)`,
        [invRes.id, item.item_id, item.qty, item.rate, lineAmt]
      );

      await runAsync(`UPDATE dist_items SET current_stock = current_stock + ? WHERE id = ?`, [item.qty, item.item_id]);

      const updatedItem = await getAsync(`SELECT current_stock FROM dist_items WHERE id = ?`, [item.item_id]);

      await runAsync(
        `INSERT INTO dist_stock_ledger (item_id, date, type, qty, ref_type, ref_id, balance_after)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [item.item_id, date, 'in', item.qty, 'purchase', invRes.id, updatedItem ? updatedItem.current_stock : 0]
      );
    }

    if (balance > 0) {
      await runAsync(`UPDATE dist_parties SET current_balance = current_balance + ? WHERE id = ?`, [balance, party_id]);
    }

    res.json({ message: 'Purchase invoice created successfully', id: invRes.id, invoice_no: invNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { paid_amount, status } = req.body;

    const existing = await getAsync('SELECT * FROM dist_purchase_invoices WHERE id = ?', [id]);
    if (!existing) return res.status(404).json({ error: 'Invoice not found' });

    const newPaid = parseFloat(paid_amount);
    const newBal = Math.max(0, existing.total_amount - newPaid);
    let newStatus = status || (newBal === 0 ? 'Paid' : newPaid > 0 ? 'Partial' : 'Unpaid');

    await runAsync(
      `UPDATE dist_purchase_invoices SET paid_amount = ?, balance = ?, status = ? WHERE id = ?`,
      [newPaid, newBal, newStatus, id]
    );

    const diff = existing.balance - newBal;
    if (diff !== 0) {
      await runAsync(`UPDATE dist_parties SET current_balance = MAX(0, current_balance - ?) WHERE id = ?`, [diff, existing.party_id]);
    }

    res.json({ message: 'Purchase invoice updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/purchases/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await getAsync('SELECT * FROM dist_purchase_invoices WHERE id = ?', [id]);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    const items = await allAsync('SELECT * FROM dist_purchase_items WHERE invoice_id = ?', [id]);
    for (const item of items) {
      await runAsync('UPDATE dist_items SET current_stock = MAX(0, current_stock - ?) WHERE id = ?', [item.qty, item.item_id]);
    }

    if (invoice.balance > 0) {
      await runAsync('UPDATE dist_parties SET current_balance = MAX(0, current_balance - ?) WHERE id = ?', [invoice.balance, invoice.party_id]);
    }

    await runAsync('DELETE FROM dist_purchase_invoices WHERE id = ?', [id]);
    res.json({ message: 'Purchase invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -----------------------------------------------------------------------------------------
// 7. PAYMENTS CRUD API
// -----------------------------------------------------------------------------------------
router.get('/payments', async (req, res) => {
  try {
    const payments = await allAsync(`
      SELECT pay.*, p.name as party_name
      FROM dist_payments pay
      JOIN dist_parties p ON pay.party_id = p.id
      ORDER BY pay.date DESC, pay.id DESC
    `);
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/payments', async (req, res) => {
  try {
    const { party_id, date, amount, type, mode, notes } = req.body;
    if (!party_id || !date || !amount || !type) {
      return res.status(400).json({ error: 'Party, date, amount, and type (in/out) are required' });
    }

    const payAmt = parseFloat(amount);
    const result = await runAsync(
      `INSERT INTO dist_payments (party_id, date, amount, type, mode, notes) VALUES (?, ?, ?, ?, ?, ?)`,
      [party_id, date, payAmt, type, mode || 'Cash', notes || null]
    );

    await runAsync(`UPDATE dist_parties SET current_balance = MAX(0, current_balance - ?) WHERE id = ?`, [payAmt, party_id]);

    res.json({ message: 'Payment recorded successfully', id: result.id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/payments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const payment = await getAsync('SELECT * FROM dist_payments WHERE id = ?', [id]);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await runAsync('UPDATE dist_parties SET current_balance = current_balance + ? WHERE id = ?', [payment.amount, payment.party_id]);
    await runAsync('DELETE FROM dist_payments WHERE id = ?', [id]);

    res.json({ message: 'Payment deleted and party balance restored' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/distributor/export-excel - Download Distributor Excel Report
router.get('/export-excel', async (req, res) => {
  try {
    const [parties, items, saleItemsRows, purchaseItemsRows, payments, stockLedger] = await Promise.all([
      allAsync('SELECT name as "Party Name", type as "Party Type", phone as "Phone Number", gst_number as "GST Number", address as "Address", opening_balance as "Opening Balance (₹)", current_balance as "Current Balance (₹)" FROM dist_parties ORDER BY name ASC'),
      allAsync('SELECT name as "Item Name", category as "Category", current_stock as "Current Stock", unit as "Unit", purchase_price as "Purchase Price (₹)", sale_price as "Sale Price (₹)", (current_stock * purchase_price) as "Total Valuation (₹)", low_stock_alert as "Alert Level" FROM dist_items ORDER BY name ASC'),
      allAsync(`
        SELECT s.invoice_no as "Invoice No", s.date as "Date", p.name as "Customer Name", i.name as "Item Name", si.qty as "Qty Sold", i.unit as "Unit", si.rate as "Sale Rate (₹)", si.amount as "Line Amount (₹)", s.total_amount as "Invoice Total (₹)", s.received_amount as "Received (₹)", s.balance as "Balance Due (₹)", s.status as "Status"
        FROM dist_sale_items si
        JOIN dist_sale_invoices s ON si.invoice_id = s.id
        JOIN dist_parties p ON s.party_id = p.id
        JOIN dist_items i ON si.item_id = i.id
        ORDER BY s.date DESC
      `),
      allAsync(`
        SELECT pur.invoice_no as "Invoice No", pur.date as "Date", p.name as "Supplier Name", i.name as "Item Name", pi.qty as "Qty Purchased", i.unit as "Unit", pi.rate as "Purchase Rate (₹)", pi.amount as "Line Amount (₹)", pur.total_amount as "Invoice Total (₹)", pur.paid_amount as "Paid (₹)", pur.balance as "Balance Payable (₹)", pur.status as "Status"
        FROM dist_purchase_items pi
        JOIN dist_purchase_invoices pur ON pi.invoice_id = pur.id
        JOIN dist_parties p ON pur.party_id = p.id
        JOIN dist_items i ON pi.item_id = i.id
        ORDER BY pur.date DESC
      `),
      allAsync(`
        SELECT pay.date as "Date", p.name as "Party Name", pay.amount as "Amount (₹)", pay.type as "Type (in/out)", pay.mode as "Payment Mode", pay.notes as "Notes"
        FROM dist_payments pay
        JOIN dist_parties p ON pay.party_id = p.id
        ORDER BY pay.date DESC
      `),
      allAsync(`
        SELECT sl.date as "Date", i.name as "Item Name", sl.type as "Movement (in/out)", sl.qty as "Quantity", sl.ref_type as "Transaction Type", sl.balance_after as "Stock After Transaction"
        FROM dist_stock_ledger sl
        JOIN dist_items i ON sl.item_id = i.id
        ORDER BY sl.date DESC
      `)
    ]);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(parties), 'Parties Directory');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(items), 'Stock Inventory');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(saleItemsRows), 'Sales Invoices & Items');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(purchaseItemsRows), 'Purchase Invoices & Items');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(payments), 'Payment Ledger');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(stockLedger), 'Stock Movement Ledger');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `HK_Traders_Distributor_Report_${new Date().toISOString().substring(0, 10)}.xlsx`;

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    console.error('Distributor Excel Export Error:', err);
    res.status(500).json({ error: 'Failed to export distributor excel report' });
  }
});

module.exports = router;
