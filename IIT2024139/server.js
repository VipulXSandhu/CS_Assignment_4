// server.js — Entry point

const express = require('express');
const path    = require('path');

const { initDatabase } = require('./database/setup');
const { vulnerableRouter, secureRouter, modeRouter } = require('./routes/login');

const app  = express();
const PORT = process.env.PORT || 3000;
const MODE = (process.env.MODE || 'secure').toLowerCase();

// ---- Middleware ----
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---- Database ----
initDatabase();

// API routes (all defined in routes/login.js)
app.use('/api/vulnerable', vulnerableRouter);   // tests hit this directly
app.use('/api/secure',     secureRouter);        // tests hit this directly
app.use('/api',            modeRouter);          // frontend uses /api/login

// Tell the front-end which mode the server was started in
app.get('/api/mode', (_req, res) => {
  res.json({ mode: MODE });
});

// ---- Start (only when run directly, not via tests) ----
if (require.main === module) {
  app.listen(PORT, '127.0.0.1', () => {
    console.log();
    console.log(`  ┌──────────────────────────────────────────────┐`);
    console.log(`  │  SQL Injection Demo  —  ${MODE.toUpperCase()} MODE${' '.repeat(Math.max(0, 14 - MODE.length))}│`);
    console.log(`  │  http://localhost:${PORT}                    │`);
    console.log(`  └──────────────────────────────────────────────┘`);
    console.log();
  });
}

module.exports = app;   // exported for Supertest
