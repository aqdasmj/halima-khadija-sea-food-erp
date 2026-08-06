const express = require('express');
const bcrypt = require('bcryptjs');
const { allAsync, getAsync, runAsync } = require('../database/db');
const { verifyToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const users = await allAsync('SELECT id, username, name, role, active_status, created_at FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, name, role } = req.body;

    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, password, and name are required' });
    }

    const existing = await getAsync('SELECT id FROM users WHERE username = ?', [username.trim()]);
    if (existing) {
      return res.status(400).json({ error: 'Username already taken' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await runAsync(
      'INSERT INTO users (username, password_hash, name, role) VALUES (?, ?, ?, ?)',
      [username.trim(), hash, name.trim(), role || 'finance_manager']
    );

    res.status(201).json({ message: 'User created successfully', userId: result.id });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    const { name, role, active_status, password } = req.body;
    const user = await getAsync('SELECT * FROM users WHERE id = ?', [req.params.id]);

    if (!user) return res.status(404).json({ error: 'User not found' });

    let newHash = user.password_hash;
    if (password) {
      newHash = await bcrypt.hash(password, 10);
    }

    await runAsync(
      `UPDATE users SET name = ?, role = ?, active_status = ?, password_hash = ? WHERE id = ?`,
      [
        name ? name.trim() : user.name,
        role || user.role,
        active_status !== undefined ? active_status : user.active_status,
        newHash,
        req.params.id
      ]
    );

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

router.delete('/:id', verifyToken, requireAdmin, async (req, res) => {
  try {
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own admin account' });
    }
    await runAsync('DELETE FROM users WHERE id = ?', [req.params.id]);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
