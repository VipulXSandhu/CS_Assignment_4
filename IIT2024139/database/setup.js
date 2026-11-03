// database/setup.js]

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_PATH = path.join(DATA_DIR, 'users.db');

let db;

// Return (and lazily create) the singleton DB handle.
function getDb() {
  if (!db) {
    // Ensure the data/ directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');       // safer concurrent reads
    db.pragma('foreign_keys = ON');
  }
  return db;
}

// Create schema + seed rows (idempotent).
function initDatabase() {
  const conn = getDb();

  conn.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id       INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT    UNIQUE NOT NULL,
      password TEXT    NOT NULL,
      role     TEXT    DEFAULT 'user'
    );
  `);

  const insert = conn.prepare(
    'INSERT OR IGNORE INTO users (username, password, role) VALUES (?, ?, ?)'
  );

  const seed = conn.transaction(() => {
    insert.run('admin', 'admin123', 'admin');
    insert.run('alice', 'password456', 'user');
    insert.run('bob', 'secret789', 'user');
    insert.run('krish', 'krish@008', 'user');
  });
  seed();

  console.log('[db] SQLite database ready  →', DB_PATH);
}

module.exports = { getDb, initDatabase };
