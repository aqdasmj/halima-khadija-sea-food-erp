const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { boat_id } = req.query;
    let query = `
      SELECT m.*, b.name as boat_name
      FROM maintenance m
      JOIN boats b ON m.boat_id = b.id
      WHERE 1=1
    `;
    const params = [];

    if (boat_id) {
      query += ' AND m.boat_id = ?';
      params.push(boat_id);
    }

    query += ' ORDER BY m.date DESC, m.id DESC';

    const records = await allAsync(query, params);
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch maintenance records' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { date, boat_id, type, problem, vendor_name, amount, next_service_date, notes } = req.body;

    if (!date || !boat_id || !type || !amount) {
      return res.status(400).json({ error: 'Date, boat, maintenance type, and amount are required' });
    }

    const result = await runAsync(
      `INSERT INTO maintenance (date, boat_id, type, problem, vendor_name, amount, next_service_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        date,
        boat_id,
        type.trim(),
        problem || '',
        vendor_name || '',
        parseFloat(amount),
        next_service_date || null,
        notes || ''
      ]
    );

    const created = await getAsync('SELECT m.*, b.name as boat_name FROM maintenance m JOIN boats b ON m.boat_id = b.id WHERE m.id = ?', [result.id]);
    res.status(201).json({ message: 'Maintenance record logged', record: created });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log maintenance record' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const existing = await getAsync('SELECT * FROM maintenance WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ error: 'Maintenance record not found' });

    const { date, boat_id, type, problem, vendor_name, amount, next_service_date, notes } = req.body;

    await runAsync(
      `UPDATE maintenance SET date = ?, boat_id = ?, type = ?, problem = ?, vendor_name = ?, amount = ?, next_service_date = ?, notes = ?
       WHERE id = ?`,
      [
        date || existing.date,
        boat_id || existing.boat_id,
        type ? type.trim() : existing.type,
        problem !== undefined ? problem : existing.problem,
        vendor_name !== undefined ? vendor_name : existing.vendor_name,
        amount !== undefined ? parseFloat(amount) : existing.amount,
        next_service_date !== undefined ? next_service_date : existing.next_service_date,
        notes !== undefined ? notes : existing.notes,
        req.params.id
      ]
    );

    res.json({ message: 'Maintenance record updated' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update maintenance record' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await runAsync('DELETE FROM maintenance WHERE id = ?', [req.params.id]);
    res.json({ message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete maintenance record' });
  }
});

module.exports = router;
