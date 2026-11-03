// routes/login.js
 
const express   = require('express');
const { getDb } = require('../database/setup');

const MODE = (process.env.MODE || 'secure').toLowerCase();

//  Shared input validation
function validateInput(req, res) {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({
      success: false,
      message: 'Username and password are required.'
    });
    return null;
  }

  if (username.length > 64 || password.length > 128) {
    res.status(400).json({
      success: false,
      message: 'Input exceeds allowed length.'
    });
    return null;
  }

  return { username, password };
}

//  VULNERABLE IMPLEMENTATION
function vulnerableLogin(req, res) {
  const input = validateInput(req, res);
  if (!input) return;

  const { username, password } = input;
  const db = getDb();

  // VULNERABLE LINE — direct string concatenation User input is embedded directly in the SQL string. An attacker can close the quote and inject new logic.

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
    console.error('[vulnerable] Query error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred.'
    });
  }
}

//  SECURE IMPLEMENTATION — PARAMETERIZED QUERY

function secureLogin(req, res) {
  const input = validateInput(req, res);
  if (!input) return;

  const { username, password } = input;
  const db = getDb();

  try {
    // SECURE LINE — parameterized query (the fix) User input is bound via ?, treated strictly as data.

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
  } catch (err) {
    console.error('[secure] Query error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'A server error occurred.'
    });
  }
}


//  Router setup

// Dedicated routers so tests can hit each implementation directly
const vulnerableRouter = express.Router();
vulnerableRouter.post('/login', vulnerableLogin);

const secureRouter = express.Router();
secureRouter.post('/login', secureLogin);

// Mode-based router — used by the frontend (/api/login)
const modeRouter = express.Router();
modeRouter.post('/login', MODE === 'vulnerable' ? vulnerableLogin : secureLogin);

module.exports = { vulnerableRouter, secureRouter, modeRouter };
