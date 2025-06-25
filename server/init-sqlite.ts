import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from "@shared/schema";

export function initializeSQLiteDatabase() {
  const sqlite = new Database('./data.db');
  const db = drizzle(sqlite, { schema });

  // Create tables manually since drizzle config is locked
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS "sessions" (
      "sid" TEXT PRIMARY KEY,
      "sess" TEXT NOT NULL,
      "expire" INTEGER NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");

    CREATE TABLE IF NOT EXISTS "users" (
      "id" TEXT PRIMARY KEY NOT NULL,
      "email" TEXT UNIQUE,
      "first_name" TEXT,
      "last_name" TEXT,
      "profile_image_url" TEXT,
      "username" TEXT UNIQUE,
      "password" TEXT,
      "role" TEXT NOT NULL DEFAULT 'broker',
      "name" TEXT NOT NULL,
      "created_at" INTEGER,
      "updated_at" INTEGER
    );

    CREATE TABLE IF NOT EXISTS "policies" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "policy_number" TEXT NOT NULL UNIQUE,
      "client_name" TEXT NOT NULL,
      "policy_type" TEXT NOT NULL,
      "premium" REAL NOT NULL,
      "coverage_amount" REAL NOT NULL,
      "start_date" INTEGER NOT NULL,
      "end_date" INTEGER NOT NULL,
      "is_active" INTEGER DEFAULT 1,
      "claims_history" TEXT DEFAULT '[]',
      "risk_profile" TEXT NOT NULL DEFAULT 'medium',
      "renewal_date" INTEGER,
      "created_at" INTEGER
    );

    CREATE TABLE IF NOT EXISTS "chat_messages" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "session_id" TEXT NOT NULL,
      "broker_id" TEXT,
      "broker_name" TEXT NOT NULL,
      "sender" TEXT NOT NULL,
      "message" TEXT NOT NULL,
      "timestamp" INTEGER NOT NULL,
      "message_type" TEXT DEFAULT 'text',
      "metadata" TEXT DEFAULT '{}',
      "policy_number" TEXT,
      "is_archived" INTEGER DEFAULT 0,
      "attachments" TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS "underwriting_decisions" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "policy_id" INTEGER,
      "broker_id" TEXT,
      "broker_name" TEXT NOT NULL,
      "session_id" TEXT,
      "request_type" TEXT NOT NULL,
      "request_details" TEXT NOT NULL,
      "decision" TEXT NOT NULL,
      "decision_reason" TEXT NOT NULL,
      "confidence" REAL NOT NULL,
      "processed_by" TEXT NOT NULL,
      "timestamp" INTEGER NOT NULL,
      "response_time_ms" INTEGER NOT NULL,
      "rules_applied" TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS "documents" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "filename" TEXT NOT NULL,
      "original_filename" TEXT NOT NULL,
      "file_type" TEXT NOT NULL,
      "uploaded_by" TEXT,
      "broker_name" TEXT NOT NULL,
      "upload_date" INTEGER NOT NULL,
      "processed_date" INTEGER,
      "status" TEXT DEFAULT 'pending',
      "extracted_rules" TEXT DEFAULT '[]',
      "content" TEXT,
      "file_size" INTEGER,
      "content_hash" TEXT,
      "is_active" INTEGER DEFAULT 1,
      "file_path" TEXT,
      "mime_type" TEXT,
      "extracted_data" TEXT DEFAULT '{}'
    );

    CREATE TABLE IF NOT EXISTS "underwriting_rules" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "rule_type" TEXT NOT NULL,
      "conditions" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "confidence" REAL NOT NULL,
      "source" TEXT NOT NULL,
      "is_active" INTEGER DEFAULT 1,
      "created_at" INTEGER NOT NULL,
      "source_document_id" INTEGER
    );

    CREATE TABLE IF NOT EXISTS "escalations" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "chat_message_id" INTEGER,
      "broker_id" TEXT,
      "broker_name" TEXT NOT NULL,
      "reason" TEXT NOT NULL,
      "priority" TEXT DEFAULT 'medium',
      "assigned_to" TEXT,
      "assigned_to_id" TEXT,
      "status" TEXT DEFAULT 'pending',
      "created_at" INTEGER NOT NULL,
      "resolved_at" INTEGER,
      "resolution_notes" TEXT
    );

    CREATE TABLE IF NOT EXISTS "analytics_events" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "event_type" TEXT NOT NULL,
      "broker_id" TEXT NOT NULL,
      "broker_name" TEXT NOT NULL,
      "session_id" TEXT,
      "entity_type" TEXT,
      "entity_id" INTEGER,
      "timestamp" INTEGER NOT NULL,
      "metadata" TEXT DEFAULT '{}',
      "duration_ms" INTEGER
    );

    CREATE TABLE IF NOT EXISTS "broker_metrics" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "broker_id" TEXT NOT NULL,
      "broker_name" TEXT NOT NULL,
      "metric_date" INTEGER NOT NULL,
      "total_chats" INTEGER DEFAULT 0,
      "total_decisions" INTEGER DEFAULT 0,
      "avg_response_time" REAL DEFAULT 0,
      "avg_confidence" REAL DEFAULT 0,
      "successful_decisions" INTEGER DEFAULT 0,
      "escalated_cases" INTEGER DEFAULT 0,
      "documents_uploaded" INTEGER DEFAULT 0,
      "active_policies" INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS "user_settings" (
      "id" INTEGER PRIMARY KEY AUTOINCREMENT,
      "user_id" TEXT NOT NULL UNIQUE,
      "ai_personality" TEXT DEFAULT 'professional',
      "auto_save_chats" INTEGER DEFAULT 1,
      "notifications_enabled" INTEGER DEFAULT 1,
      "data_retention_days" INTEGER DEFAULT 90,
      "privacy_level" TEXT DEFAULT 'standard',
      "created_at" INTEGER NOT NULL,
      "updated_at" INTEGER NOT NULL
    );
  `);

  // Seed some initial data
  const now = Date.now();
  
  // Insert sample policies
  sqlite.prepare(`
    INSERT OR IGNORE INTO policies (
      id, policy_number, client_name, policy_type, premium, coverage_amount,
      start_date, end_date, is_active, claims_history, risk_profile, renewal_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1, "SME-2024-0892", "ABC Bakery", "SME Restaurant", 2400, 500000,
    new Date("2024-01-01").getTime(), new Date("2024-12-31").getTime(), 1, '[]', 'low', 
    new Date("2024-12-01").getTime(), now
  );

  sqlite.prepare(`
    INSERT OR IGNORE INTO policies (
      id, policy_number, client_name, policy_type, premium, coverage_amount,
      start_date, end_date, is_active, claims_history, risk_profile, renewal_date, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2, "SME-2024-1234", "City Restaurant", "SME Restaurant", 3600, 750000,
    new Date("2024-01-15").getTime(), new Date("2025-01-14").getTime(), 1, 
    '[{"type":"fire","amount":15000,"date":"2023-06-15"}]', 'high', 
    new Date("2025-01-01").getTime(), now
  );

  // Insert sample underwriting rules
  sqlite.prepare(`
    INSERT OR IGNORE INTO underwriting_rules (
      id, rule_type, conditions, action, confidence, source, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    1, "discount", '{"claimsHistory":"none_3_years","renewalStatus":"active"}', 
    '{"discountType":"renewal","percentage":5}', 0.95, 'extracted_from_chat', 1, now
  );

  sqlite.prepare(`
    INSERT OR IGNORE INTO underwriting_rules (
      id, rule_type, conditions, action, confidence, source, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    2, "risk_assessment", '{"previousClaims":"fire","businessType":"restaurant"}', 
    '{"action":"escalate","reason":"Fire risk requires manual review"}', 0.9, 'extracted_from_chat', 1, now
  );

  sqlite.prepare(`
    INSERT OR IGNORE INTO underwriting_rules (
      id, rule_type, conditions, action, confidence, source, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    3, "coverage", '{"businessType":"restaurant","location":"city"}', 
    '{"recommendedCoverage":750000,"reasoning":"Urban restaurant higher exposure"}', 0.85, 'manual', 1, now
  );

  console.log("SQLite database initialized with tables and sample data");
  sqlite.close();
  
  return true;
}