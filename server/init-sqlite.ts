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
      broker_id INTEGER REFERENCES users(id),
      broker_name TEXT NOT NULL,
      sender TEXT NOT NULL,
      message TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      message_type TEXT NOT NULL DEFAULT 'text',
      metadata TEXT DEFAULT '{}',
      policy_number TEXT,
      is_archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS underwriting_decisions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      policy_id INTEGER REFERENCES policies(id),
      broker_id INTEGER REFERENCES users(id),
      broker_name TEXT NOT NULL,
      session_id TEXT,
      request_type TEXT NOT NULL,
      request_details TEXT NOT NULL,
      decision TEXT NOT NULL,
      decision_reason TEXT NOT NULL,
      confidence REAL NOT NULL,
      processed_by TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      response_time_ms INTEGER NOT NULL,
      rules_applied TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_filename TEXT NOT NULL,
      file_type TEXT NOT NULL,
      uploaded_by INTEGER REFERENCES users(id),
      broker_name TEXT NOT NULL,
      upload_date INTEGER NOT NULL,
      processed_date INTEGER,
      status TEXT NOT NULL DEFAULT 'pending',
      extracted_rules TEXT NOT NULL DEFAULT '[]',
      content TEXT,
      file_size INTEGER,
      content_hash TEXT,
      is_active INTEGER NOT NULL DEFAULT 1
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
      broker_id INTEGER REFERENCES users(id),
      broker_name TEXT NOT NULL,
      reason TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'medium',
      assigned_to TEXT,
      assigned_to_id INTEGER REFERENCES users(id),
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL,
      resolved_at INTEGER,
      resolution_notes TEXT
    );

    CREATE TABLE IF NOT EXISTS analytics_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      broker_id INTEGER REFERENCES users(id),
      broker_name TEXT NOT NULL,
      session_id TEXT,
      entity_type TEXT,
      entity_id INTEGER,
      timestamp INTEGER NOT NULL,
      metadata TEXT DEFAULT '{}',
      duration_ms INTEGER
    );

    CREATE TABLE IF NOT EXISTS broker_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      broker_id INTEGER REFERENCES users(id),
      broker_name TEXT NOT NULL,
      metric_date INTEGER NOT NULL,
      total_chats INTEGER NOT NULL DEFAULT 0,
      total_decisions INTEGER NOT NULL DEFAULT 0,
      avg_response_time REAL NOT NULL DEFAULT 0,
      avg_confidence REAL NOT NULL DEFAULT 0,
      successful_decisions INTEGER NOT NULL DEFAULT 0,
      escalated_cases INTEGER NOT NULL DEFAULT 0,
      documents_uploaded INTEGER NOT NULL DEFAULT 0,
      active_policies INTEGER NOT NULL DEFAULT 0
    );
  `);

  console.log("SQLite database initialized with tables");
  db.close();
}