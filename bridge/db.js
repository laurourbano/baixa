/**
 * db.js — Camada de acesso a dados (SQLite via better-sqlite3)
 */
const path = require('path');
const Database = require('better-sqlite3');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH = path.join(DATA_DIR, 'baixa.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
  }
  return db;
}

function initSchema() {
  const conn = getDb();
  conn.exec(`
    CREATE TABLE IF NOT EXISTS state (
      key TEXT PRIMARY KEY,
      data TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
}

// Prepared statements (lazy init)
let _saveState, _getAllState, _insertBackup, _getAllBackups, _getBackupByName;

function getStatements() {
  if (!_saveState) {
    const conn = getDb();
    _saveState = conn.prepare(`
      INSERT INTO state (key, data, updated_at) VALUES ('main', ?, ?)
      ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `);
    _getAllState = conn.prepare("SELECT data FROM state WHERE key = 'main'").pluck(true);
    _insertBackup = conn.prepare('INSERT INTO backups (name, data, created_at) VALUES (?, ?, ?)');
    _getAllBackups = conn.prepare('SELECT name, created_at FROM backups ORDER BY created_at DESC');
    _getBackupByName = conn.prepare('SELECT data FROM backups WHERE name = ?').pluck(true);
  }
  return { _saveState, _getAllState, _insertBackup, _getAllBackups, _getBackupByName };
}

function saveState(data, timestamp) {
  const { _saveState } = getStatements();
  _saveState.run(data, timestamp);
}

function getState() {
  const { _getAllState } = getStatements();
  return _getAllState.get();
}

function insertBackup(name, data, timestamp) {
  const { _insertBackup } = getStatements();
  _insertBackup.run(name, data, timestamp);
}

function getAllBackups() {
  const { _getAllBackups } = getStatements();
  return _getAllBackups.all();
}

function getBackupByName(name) {
  const { _getBackupByName } = getStatements();
  return _getBackupByName.get(name);
}

module.exports = {
  initSchema,
  saveState,
  getState,
  insertBackup,
  getAllBackups,
  getBackupByName,
  getDb
};
