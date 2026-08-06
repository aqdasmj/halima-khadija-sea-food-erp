const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const { boat_id } = req.query;
    let query = `
      SELECT c.*, b.name as boat_name,
        COALESCE((SELECT SUM(amount) FROM crew_advances WHERE crew_id = c.id AND type = 'advance'), 0) as total_advances,
        COALESCE((SELECT SUM(amount) FROM crew_advances WHERE crew_id = c.id AND type = 'deduction'), 0) as total_deductions
      FROM crew c
      LEFT JOIN boats b ON c.boat_id = b.id
    `;
    const params = [];

    if (boat_id) {
      query += ' WHERE c.boat_id = ?';
      params.push(boat_id);
    }

    query += ' ORDER BY c.id DESC';

    const crewList = await allAsync(query, params);

    const result = crewList.map(c => ({
      ...c,
      net_pending_advance: c.total_advances - c.total_deductions,
      final_payable_salary: Math.max(0, c.monthly_salary - (c.total_advances - c.total_deductions))
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crew' });
  }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    const { name, mobile, role, boat_id, weekly_allowance, monthly_salary, notes } = req.body;

    if (!name || !role || !boat_id) {
      return res.status(400).json({ error: 'Name, role, and boat assignment are required' });
    }

    const resDb = await runAsync(
      `INSERT INTO crew (name, mobile, role, boat_id, weekly_allowance, monthly_salary, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name.trim(), mobile || '', role.trim(), boat_id, weekly_allowance || 0, monthly_salary || 0, notes || '']
    );

    res.status(201).json({ message: 'Crew member added', crewId: resDb.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add crew member' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { name, mobile, role, boat_id, weekly_allowance, monthly_salary, status, notes } = req.body;
    const crew = await getAsync('SELECT * FROM crew WHERE id = ?', [req.params.id]);

    if (!crew) return res.status(404).json({ error: 'Crew member not found' });

    await runAsync(
      `UPDATE crew SET name = ?, mobile = ?, role = ?, boat_id = ?, weekly_allowance = ?, monthly_salary = ?, status = ?, notes = ?
       WHERE id = ?`,
      [
        name ? name.trim() : crew.name,
        mobile !== undefined ? mobile : crew.mobile,
        role ? role.trim() : crew.role,
        boat_id || crew.boat_id,
        weekly_allowance !== undefined ? weekly_allowance : crew.weekly_allowance,
        monthly_salary !== undefined ? monthly_salary : crew.monthly_salary,
        status || crew.status,
        notes !== undefined ? notes : crew.notes,
        req.params.id
      ]
    );

    res.json({ message: 'Crew updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update crew member' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    await runAsync('DELETE FROM crew WHERE id = ?', [req.params.id]);
    res.json({ message: 'Crew member deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete crew member' });
  }
});

router.get('/:id/advances', verifyToken, async (req, res) => {
  try {
    const advances = await allAsync(
      'SELECT * FROM crew_advances WHERE crew_id = ? ORDER BY date DESC, id DESC',
      [req.params.id]
    );
    res.json(advances);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch crew advance history' });
  }
});

router.post('/advances', verifyToken, async (req, res) => {
  try {
    const { date, crew_id, amount, type, notes } = req.body;

    if (!date || !crew_id || !amount) {
      return res.status(400).json({ error: 'Date, crew member, and amount are required' });
    }

    await runAsync(
      `INSERT INTO crew_advances (date, crew_id, amount, type, notes)
       VALUES (?, ?, ?, ?, ?)`,
      [date, crew_id, parseFloat(amount), type || 'advance', notes || '']
    );

    res.status(201).json({ message: 'Crew payment / advance logged' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to log crew payment / advance' });
  }
});

module.exports = router;
