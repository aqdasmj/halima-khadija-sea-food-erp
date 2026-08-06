const express = require('express');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const boats = await allAsync(`
      SELECT b.*, 
        (SELECT COUNT(*) FROM crew WHERE boat_id = b.id AND status = 'active') as active_crew_count
      FROM boats b
      ORDER BY b.id DESC
    `);
    res.json(boats);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch boats' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const boat = await getAsync('SELECT * FROM boats WHERE id = ?', [req.params.id]);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });
    
    const crew = await allAsync('SELECT * FROM crew WHERE boat_id = ?', [req.params.id]);
    res.json({ boat, crew });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch boat details' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, registration_number, owner_name, engine_details, crew_count, status } = req.body;

    if (!name || !registration_number || !owner_name) {
      return res.status(400).json({ error: 'Boat name, registration number, and owner name are required' });
    }

    const existing = await getAsync('SELECT id FROM boats WHERE registration_number = ?', [registration_number.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Registration number already exists' });
    }

    const result = await runAsync(
      `INSERT INTO boats (name, registration_number, owner_name, engine_details, crew_count, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        name.trim(),
        registration_number.trim(),
        owner_name.trim(),
        engine_details || '',
        crew_count || 0,
        status || 'active'
      ]
    );

    const newBoat = await getAsync('SELECT * FROM boats WHERE id = ?', [result.id]);
    res.status(201).json({ message: 'Boat added successfully', boat: newBoat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to add boat' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, registration_number, owner_name, engine_details, crew_count, status } = req.body;

    const boat = await getAsync('SELECT * FROM boats WHERE id = ?', [req.params.id]);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

    await runAsync(
      `UPDATE boats SET name = ?, registration_number = ?, owner_name = ?, engine_details = ?, crew_count = ?, status = ?
       WHERE id = ?`,
      [
        name ? name.trim() : boat.name,
        registration_number ? registration_number.trim() : boat.registration_number,
        owner_name ? owner_name.trim() : boat.owner_name,
        engine_details !== undefined ? engine_details : boat.engine_details,
        crew_count !== undefined ? crew_count : boat.crew_count,
        status || boat.status,
        req.params.id
      ]
    );

    const updatedBoat = await getAsync('SELECT * FROM boats WHERE id = ?', [req.params.id]);
    res.json({ message: 'Boat updated successfully', boat: updatedBoat });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update boat' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const boat = await getAsync('SELECT * FROM boats WHERE id = ?', [req.params.id]);
    if (!boat) return res.status(404).json({ error: 'Boat not found' });

    await runAsync('DELETE FROM boats WHERE id = ?', [req.params.id]);
    res.json({ message: 'Boat deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete boat' });
  }
});

module.exports = router;
