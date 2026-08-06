const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { boat_id, month } = req.query;
    let query = `
      SELECT d.*, b.name as boat_name
      FROM diesel d
      JOIN boats b ON d.boat_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (boat_id) {
      query += ' AND d.boat_id = ?';
      params.push(boat_id);
    }
    if (month) {
      query += ' AND d.date LIKE ?';
      params.push(`${month}%`);
    }

    query += ' ORDER BY d.date DESC, d.id DESC';

    const logs = await allAsync(query, params);

    const monthlySummary = await allAsync(`
      SELECT 
        strftime('%Y-%m', date) as year_month,
        boat_id,
        SUM(litres) as total_litres,
        SUM(total_amount) as total_cost,
        AVG(price_per_litre) as avg_price,
        COUNT(*) as trip_count
      FROM diesel
      GROUP BY year_month, boat_id
      ORDER BY year_month DESC
    `);

    res.json({ logs, monthlySummary });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch diesel logs' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, boat_id, litres, price_per_litre, total_amount, trip_note } = req.body;

    if (!date || !boat_id || !litres || !price_per_litre) {
      return res.status(400).json({ error: 'Date, boat, litres, and price per litre are required' });
    }

    const ltrs = parseFloat(litres);
    const rate = parseFloat(price_per_litre);
    const total = total_amount ? parseFloat(total_amount) : (ltrs * rate);

    const result = await runAsync(
      `INSERT INTO diesel (date, boat_id, litres, price_per_litre, total_amount, trip_note)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [date, boat_id, ltrs, rate, total, trip_note || '']
    );

    const boat = await getAsync('SELECT name FROM boats WHERE id = ?', [boat_id]);
    await runAsync(
      `INSERT INTO expenses (date, boat_id, category, description, amount, paid_by, payment_method, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        boat_id,
        'Diesel',
        `${ltrs} Litres Diesel @ ₹${rate}/L (${trip_note || 'Trip diesel'})`,
        total,
        'Nate Diesel Depot',
        'Bank',
        'Auto-synced from Diesel Tracker'
      ]
    );

    const created = await getAsync('SELECT d.*, b.name as boat_name FROM diesel d JOIN boats b ON d.boat_id = b.id WHERE d.id = ?', [result.id]);
    res.status(201).json({ message: 'Diesel entry logged and synced to expenses', record: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log diesel entry' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await runAsync('DELETE FROM diesel WHERE id = ?', [req.params.id]);
    res.json({ message: 'Diesel log deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete diesel log' });
  }
});

module.exports = router;
