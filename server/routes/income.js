const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

async function isMonthLocked(dateStr) {
  if (!dateStr) return false;
  const ym = dateStr.substring(0, 7);
  const lock = await getAsync('SELECT * FROM monthly_locks WHERE year_month = ? AND status = "locked"', [ym]);
  return !!lock;
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { boat_id, buyer_name, startDate, endDate, month, pendingOnly } = req.query;
    let query = `
      SELECT i.*, b.name as boat_name
      FROM income i
      JOIN boats b ON i.boat_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (boat_id) {
      query += ' AND i.boat_id = ?';
      params.push(boat_id);
    }
    if (buyer_name) {
      query += ' AND i.buyer_name LIKE ?';
      params.push(`%${buyer_name}%`);
    }
    if (startDate) {
      query += ' AND i.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND i.date <= ?';
      params.push(endDate);
    }
    if (month) {
      query += ' AND i.date LIKE ?';
      params.push(`${month}%`);
    }
    if (pendingOnly === 'true') {
      query += ' AND i.pending_payment > 0';
    }

    query += ' ORDER BY i.date DESC, i.id DESC';

    const records = await allAsync(query, params);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch income records' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, boat_id, fish_type, quantity, sale_amount, buyer_name, market_location, payment_received, pending_payment, notes } = req.body;

    if (!date || !boat_id || !fish_type || sale_amount === undefined) {
      return res.status(400).json({ error: 'Date, boat, fish type, and total sale amount are required' });
    }

    if (req.user.role !== 'admin') {
      const locked = await isMonthLocked(date);
      if (locked) {
        return res.status(403).json({ error: 'This month is locked by Admin. Cannot add new income.' });
      }
    }

    const saleAmt = parseFloat(sale_amount);
    const recAmt = payment_received !== undefined ? parseFloat(payment_received) : saleAmt;
    const pendAmt = pending_payment !== undefined ? parseFloat(pending_payment) : (saleAmt - recAmt);

    const result = await runAsync(
      `INSERT INTO income (date, boat_id, fish_type, quantity, sale_amount, buyer_name, market_location, payment_received, pending_payment, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        boat_id,
        fish_type.trim(),
        quantity ? parseFloat(quantity) : 0,
        saleAmt,
        buyer_name ? buyer_name.trim() : '',
        market_location ? market_location.trim() : '',
        recAmt,
        Math.max(0, pendAmt),
        notes || ''
      ]
    );

    const created = await getAsync('SELECT i.*, b.name as boat_name FROM income i JOIN boats b ON i.boat_id = b.id WHERE i.id = ?', [result.id]);
    res.status(201).json({ message: 'Income record added successfully', income: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add income record' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM income WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Income record not found' });

    if (req.user.role !== 'admin') {
      const locked = await isMonthLocked(existing.date);
      if (locked) {
        return res.status(403).json({ error: 'Cannot edit income in a locked month.' });
      }
    }

    const { date, boat_id, fish_type, quantity, sale_amount, buyer_name, market_location, payment_received, pending_payment, notes } = req.body;

    const saleAmt = sale_amount !== undefined ? parseFloat(sale_amount) : existing.sale_amount;
    const recAmt = payment_received !== undefined ? parseFloat(payment_received) : existing.payment_received;
    const pendAmt = pending_payment !== undefined ? parseFloat(pending_payment) : Math.max(0, saleAmt - recAmt);

    await runAsync(
      `UPDATE income SET date = ?, boat_id = ?, fish_type = ?, quantity = ?, sale_amount = ?, buyer_name = ?, market_location = ?, payment_received = ?, pending_payment = ?, notes = ?
       WHERE id = ?`,
      [
        date || existing.date,
        boat_id || existing.boat_id,
        fish_type ? fish_type.trim() : existing.fish_type,
        quantity !== undefined ? parseFloat(quantity) : existing.quantity,
        saleAmt,
        buyer_name !== undefined ? buyer_name.trim() : existing.buyer_name,
        market_location !== undefined ? market_location.trim() : existing.market_location,
        recAmt,
        pendAmt,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );

    res.json({ message: 'Income record updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update income record' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM income WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Income record not found' });

    if (req.user.role !== 'admin') {
      const locked = await isMonthLocked(existing.date);
      if (locked) {
        return res.status(403).json({ error: 'Cannot delete income record in a locked month.' });
      }
    }

    await runAsync('DELETE FROM income WHERE id = ?', [req.params.id]);
    res.json({ message: 'Income record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income record' });
  }
});

module.exports = router;
