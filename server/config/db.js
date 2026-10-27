const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../bookleaf.db');

// Ensure database directory exists if custom path provided
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const rawDb = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Failed to connect to SQLite database:', err.message);
  } else {
    console.log(`Connected to SQLite database at: ${DB_PATH}`);
  }
});

// Enable foreign keys
rawDb.run('PRAGMA foreign_keys = ON;');

// Promisified database helpers
const db = {
  raw: rawDb,

  run(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ lastID: this.lastID, changes: this.changes });
      });
    });
  },

  get(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.get(sql, params, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  },

  all(sql, params = []) {
    return new Promise((resolve, reject) => {
      rawDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows || []);
      });
    });
  },

  exec(sql) {
    return new Promise((resolve, reject) => {
      rawDb.exec(sql, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
  },

  async initSchema() {
    const schemaSql = `
      CREATE TABLE IF NOT EXISTS authors (
        author_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        phone TEXT,
        city TEXT,
        joined_date TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('author', 'admin')),
        name TEXT NOT NULL,
        author_id TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS books (
        book_id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        title TEXT NOT NULL,
        isbn TEXT,
        genre TEXT,
        publication_date TEXT,
        status TEXT NOT NULL,
        mrp REAL,
        author_royalty_per_copy REAL,
        total_copies_sold INTEGER DEFAULT 0,
        total_royalty_earned REAL DEFAULT 0,
        royalty_paid REAL DEFAULT 0,
        royalty_pending REAL DEFAULT 0,
        last_royalty_payout_date TEXT,
        print_partner TEXT,
        available_on TEXT DEFAULT '[]',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS tickets (
        ticket_id TEXT PRIMARY KEY,
        author_id TEXT NOT NULL,
        book_id TEXT,
        subject TEXT NOT NULL,
        description TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'Open' CHECK(status IN ('Open', 'In Progress', 'Resolved', 'Closed')),
        category TEXT NOT NULL,
        category_ai TEXT,
        category_override INTEGER DEFAULT 0,
        priority TEXT NOT NULL DEFAULT 'Medium' CHECK(priority IN ('Critical', 'High', 'Medium', 'Low')),
        priority_ai TEXT,
        priority_override INTEGER DEFAULT 0,
        assigned_to TEXT,
        ai_draft_response TEXT,
        attachment_name TEXT,
        attachment_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (author_id) REFERENCES authors(author_id) ON DELETE CASCADE,
        FOREIGN KEY (book_id) REFERENCES books(book_id) ON DELETE SET NULL
      );

      CREATE TABLE IF NOT EXISTS ticket_messages (
        message_id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        sender_id TEXT NOT NULL,
        sender_role TEXT NOT NULL CHECK(sender_role IN ('author', 'admin', 'system')),
        sender_name TEXT NOT NULL,
        content TEXT NOT NULL,
        is_ai_drafted INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS ticket_notes (
        note_id TEXT PRIMARY KEY,
        ticket_id TEXT NOT NULL,
        admin_id TEXT NOT NULL,
        admin_name TEXT NOT NULL,
        content TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ticket_id) REFERENCES tickets(ticket_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS idx_tickets_author ON tickets(author_id);
      CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
      CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
      CREATE INDEX IF NOT EXISTS idx_messages_ticket ON ticket_messages(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_notes_ticket ON ticket_notes(ticket_id);
      CREATE INDEX IF NOT EXISTS idx_books_author ON books(author_id);
    `;

    await db.exec(schemaSql);
    console.log('Database schema successfully checked and verified.');
  }
};

module.exports = db;
