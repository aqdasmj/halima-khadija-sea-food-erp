const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const upload = require('../middleware/upload');

const router = express.Router();

async function isMonthLocked(dateStr) {
  if (!dateStr) return false;
  const ym = dateStr.substring(0, 7);
  const lock = await getAsync('SELECT * FROM monthly_locks WHERE year_month = ? AND status = "locked"', [ym]);
  return !!lock;
}

router.get('/', verifyToken, async (req, res) => {
  try {
    const { boat_id, category, startDate, endDate, month } = req.query;
    let query = `
      SELECT e.*, b.name as boat_name
      FROM expenses e
      JOIN boats b ON e.boat_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (boat_id) {
      query += ' AND e.boat_id = ?';
      params.push(boat_id);
    }
    if (category) {
      query += ' AND e.category = ?';
      params.push(category);
    }
    if (startDate) {
      query += ' AND e.date >= ?';
      params.push(startDate);
    }
    if (endDate) {
      query += ' AND e.date <= ?';
      params.push(endDate);
    }
    if (month) {
      query += ' AND e.date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY e.date DESC, e.id DESC';

    const expenses = await allAsync(query, params);
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

router.post('/', verifyToken, upload.single('receipt'), async (req, res) => {
  try {
    const { date, boat_id, category, description, amount, paid_by, payment_method, notes } = req.body;

    if (!date || !boat_id || !category || !amount) {
      return res.status(400).json({ error: 'Date, boat, category, and amount are required' });
    }

    if (req.user.role !== 'admin') {
      const locked = await isMonthLocked(date);
      if (locked) {
        return res.status(403).json({ error: 'This month is locked by Admin. Cannot add new expenses.' });
      }
    }

    const receipt_path = req.file ? `/uploads/${req.file.filename}` : null;

    const result = await runAsync(
      `INSERT INTO expenses (date, boat_id, category, description, amount, paid_by, payment_method, receipt_path, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        boat_id,
        category.trim(),
        description || '',
        parseFloat(amount),
        paid_by || '',
        payment_method || 'Cash',
        receipt_path,
        notes || ''
      ]
    );

    const created = await getAsync('SELECT e.*, b.name as boat_name FROM expenses e JOIN boats b ON e.boat_id = b.id WHERE e.id = ?', [result.id]);
    res.status(201).json({ message: 'Expense recorded successfully', expense: created });
  } catch (err) {
    console.error('Error adding expense:', err);
    res.status(500).json({ error: 'Failed to record expense' });
  }
});

router.put('/:id', verifyToken, upload.single('receipt'), async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Expense not found' });

    if (req.user.role !== 'admin') {
      const locked = await isMonthLocked(existing.date);
      if (locked) {
        return res.status(403).json({ error: 'Cannot edit an expense in a locked month.' });
      }
    }

    const { date, boat_id, category, description, amount, paid_by, payment_method, notes } = req.body;
    let receipt_path = existing.receipt_path;
    if (req.file) {
      receipt_path = `/uploads/${req.file.filename}`;
    }

    const targetDate = date || existing.date;
    if (req.user.role !== 'admin' && targetDate !== existing.date) {
      const targetLocked = await isMonthLocked(targetDate);
      if (targetLocked) {
        return res.status(403).json({ error: 'Target month is locked by Admin.' });
      }
    }

    await runAsync(
      `UPDATE expenses SET date = ?, boat_id = ?, category = ?, description = ?, amount = ?, paid_by = ?, payment_method = ?, receipt_path = ?, notes = ?
       WHERE id = ?`,
      [
        targetDate,
        boat_id || existing.boat_id,
        category ? category.trim() : existing.category,
        description !== undefined ? description : existing.description,
        amount !== undefined ? parseFloat(amount) : existing.amount,
        paid_by !== undefined ? paid_by : existing.paid_by,
        payment_method || existing.payment_method,
        receipt_path,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );

    res.json({ message: 'Expense updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM expenses WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Expense record not found' });

    if (req.user.role !== 'admin') {
      const locked = await isMonthLocked(existing.date);
      if (locked) {
        return res.status(403).json({ error: 'Finance Manager cannot delete records in a locked month.' });
      }
    }

    await runAsync('DELETE FROM expenses WHERE id = ?', [req.params.id]);
    res.json({ message: 'Expense deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
