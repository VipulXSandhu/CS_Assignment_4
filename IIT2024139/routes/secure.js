//routes/secure.js

const express  = require('express');
const router   = express.Router();
const { getDb } = require('../database/setup');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  // ── Input validation ──────────────────────────────────────
  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  if (username.length > 64 || password.length > 128) {
    return res.status(400).json({
      success: false,
      message: 'Input exceeds allowed length.'
    });
  }

  const db = getDb();

  try {
    
    // SECURE — parameterized query (the fix) User input is bound as data; it can never alter the SQL structure, preventing injection.

    const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND password = ?');
    const user = stmt.get(username, password);

    if (user) {
      return res.json({
        success: true,
        message: `Welcome, authenticated as ${user.username}!`,
        user: { username: user.username, role: user.role }
      });
    }

    return res.json({
      success: false,
      message: 'Invalid username or password.'
    });
  }catch (err) {
    // Generic error — no internal details exposed
    console.error('[secure] Query error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred.'
    });
  }
});

module.exports = router;
