// routes/vulnerable.js

const express  = require('express');
const router   = express.Router();
const { getDb } = require('../database/setup');

router.post('/login', (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
  }

  const db = getDb();

  // VULNERABLE LINE — direct string concatenation An attacker can inject SQL logic via the input fields

  const query = `SELECT * FROM users WHERE username = '${username}' AND password = '${password}'`;

  try {
    const user = db.prepare(query).get();

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
  } catch (err) {
    // Do NOT leak internal error details to the client
    console.error('[vulnerable] Query error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred.'
    });
  }
});

module.exports = router;
