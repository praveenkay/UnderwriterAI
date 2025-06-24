import Database from 'better-sqlite3';

export function initializeSQLiteDatabase() {
  const db = new Database('./data.db');

  // Create tables manually since drizzle config is locked to PostgreSQL
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'broker',
      name TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS policies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_number TEXT NOT NULL UNIQUE,
      client_name TEXT NOT NULL,
      policy_type TEXT NOT NULL,
      premium REAL NOT NULL,
      coverage_amount REAL NOT NULL,
      start_date INTEGER NOT NULL,
      end_date INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      claims_history TEXT NOT NULL DEFAULT '[]',
      risk_profile TEXT NOT NULL DEFAULT 'medium',
      renewal_date INTEGER
    );

    CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text',
      metadata TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS underwriting_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER REFERENCES policies(id),
      request_type TEXT NOT NULL,
      request_details TEXT NOT NULL,
      decision TEXT NOT NULL,
      decision_reason TEXT NOT NULL,
      confidence REAL NOT NULL,
      processed_by TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      upload_date INTEGER NOT NULL,
      processed_date INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      extracted_rules TEXT NOT NULL DEFAULT '[]',
      content TEXT
    );

    CREATE TABLE IF NOT EXISTS underwriting_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rule_type TEXT NOT NULL,
      conditions TEXT NOT NULL,
      action TEXT NOT NULL,
      confidence REAL NOT NULL,
      source TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS escalations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      chat_message_id INTEGER REFERENCES chat_messages(id),
      reason TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      resolved_at INTEGER
    );
  `);

  console.log("SQLite database initialized with tables");
  db.close();
}