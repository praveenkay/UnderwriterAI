import {
  sqliteTable,
  text,
  integer,
  real,
  index,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table
export const sessions = sqliteTable(
  "sessions",
  {
    sid: text("sid").primaryKey(),
    sess: text("sess").notNull(), // JSON as text
    expire: integer("expire").notNull(), // timestamp as integer
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull(),
  email: text("email").unique(),
  firstName: text("first_name"),
  lastName: text("last_name"),
  profileImageUrl: text("profile_image_url"),
  username: text("username").unique(),
  password: text("password"),
  role: text("role").notNull().default("broker"), // broker, underwriter, admin
  name: text("name").notNull(),
  createdAt: integer("created_at"), // timestamp as integer
  updatedAt: integer("updated_at"), // timestamp as integer
});

export const policies = sqliteTable("policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  policyType: text("policy_type").notNull(), // SME, restaurant, tech, etc.
  premium: real("premium").notNull(),
  coverageAmount: real("coverage_amount").notNull(),
  startDate: integer("start_date").notNull(), // date as timestamp
  endDate: integer("end_date").notNull(), // date as timestamp
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  claimsHistory: text("claims_history").notNull().default("[]"), // JSON as text
  riskProfile: text("risk_profile").notNull().default("medium"), // low, medium, high
  renewalDate: integer("renewal_date"), // date as timestamp
  createdAt: integer("created_at"), // timestamp as integer
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  brokerId: text("broker_id"),
  brokerName: text("broker_name").notNull(),
  sender: text("sender").notNull(), // broker, ai, underwriter
  message: text("message").notNull(),
  timestamp: integer("timestamp").notNull(), // timestamp as integer
  messageType: text("message_type").notNull().default("text"), // text, decision, escalation
  metadata: text("metadata").default("{}"), // JSON as text
  policyNumber: text("policy_number"), // Related policy if applicable
  isArchived: integer("is_archived", { mode: 'boolean' }).notNull().default(false),
  attachments: text("attachments").default("[]"), // JSON as text
});

export const underwritingDecisions = sqliteTable("underwriting_decisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyId: integer("policy_id"),
  brokerId: text("broker_id"),
  brokerName: text("broker_name").notNull(),
  sessionId: text("session_id"), // Link to chat session
  requestType: text("request_type").notNull(), // discount, amendment, coverage_change
  requestDetails: text("request_details").notNull(), // JSON as text
  decision: text("decision").notNull(), // approved, declined, escalated
  decisionReason: text("decision_reason").notNull(),
  confidence: real("confidence").notNull(), // 0-1
  processedBy: text("processed_by").notNull(), // ai, human_underwriter
  timestamp: integer("timestamp").notNull(), // timestamp as integer
  responseTime: integer("response_time_ms").notNull(),
  rulesApplied: text("rules_applied").default("[]"), // JSON as text
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileType: text("file_type").notNull(), // chat_log, guideline, policy, quote
  uploadedBy: text("uploaded_by"),
  brokerName: text("broker_name").notNull(),
  uploadDate: integer("upload_date").notNull(), // timestamp as integer
  processedDate: integer("processed_date"), // timestamp as integer
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  extractedRules: text("extracted_rules").notNull().default("[]"), // JSON as text
  content: text("content"),
  fileSize: integer("file_size"),
  contentHash: text("content_hash"), // For deduplication
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  filePath: text("file_path"), // Server file path
  mimeType: text("mime_type"),
  extractedData: text("extracted_data").default("{}"), // JSON as text
});

export const underwritingRules = sqliteTable("underwriting_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ruleType: text("rule_type").notNull(), // discount, coverage, risk_assessment
  conditions: text("conditions").notNull(), // JSON as text
  action: text("action").notNull(), // JSON as text
  confidence: real("confidence").notNull(),
  source: text("source").notNull(), // extracted_from_chat, guideline_document, manual
  isActive: integer("is_active", { mode: 'boolean' }).notNull().default(true),
  createdAt: integer("created_at").notNull(), // timestamp as integer
  sourceDocumentId: integer("source_document_id"),
});

export const escalations = sqliteTable("escalations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatMessageId: integer("chat_message_id"),
  brokerId: text("broker_id"),
  brokerName: text("broker_name").notNull(),
  reason: text("reason").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: text("assigned_to"), // underwriter name
  assignedToId: text("assigned_to_id"),
  status: text("status").notNull().default("pending"), // pending, in_progress, resolved
  createdAt: integer("created_at").notNull(), // timestamp as integer
  resolvedAt: integer("resolved_at"), // timestamp as integer
  resolutionNotes: text("resolution_notes"),
});

// Analytics tracking
export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(), // chat_message, decision_made, document_uploaded, etc.
  brokerId: text("broker_id").notNull(),
  brokerName: text("broker_name").notNull(),
  sessionId: text("session_id"),
  entityType: text("entity_type"), // policy, document, chat, etc.
  entityId: integer("entity_id"), // ID of the related entity
  timestamp: integer("timestamp").notNull(), // timestamp as integer
  metadata: text("metadata").default("{}"), // JSON as text
  duration: integer("duration_ms"), // For performance tracking
});

// Broker performance metrics
export const brokerMetrics = sqliteTable("broker_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brokerId: text("broker_id").notNull(),
  brokerName: text("broker_name").notNull(),
  metricDate: integer("metric_date").notNull(), // date as timestamp
  totalChats: integer("total_chats").notNull().default(0),
  totalDecisions: integer("total_decisions").notNull().default(0),
  avgResponseTime: real("avg_response_time").notNull().default(0),
  avgConfidence: real("avg_confidence").notNull().default(0),
  successfulDecisions: integer("successful_decisions").notNull().default(0),
  escalatedCases: integer("escalated_cases").notNull().default(0),
  documentsUploaded: integer("documents_uploaded").notNull().default(0),
  activePolicies: integer("active_policies").notNull().default(0),
});

// User settings for AI chat configuration
export const userSettings = sqliteTable("user_settings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: text("user_id").notNull().unique(),
  aiPersonality: text("ai_personality").notNull().default("professional"), // professional, friendly, concise
  autoSaveChats: integer("auto_save_chats", { mode: 'boolean' }).notNull().default(true),
  notificationsEnabled: integer("notifications_enabled", { mode: 'boolean' }).notNull().default(true),
  dataRetentionDays: integer("data_retention_days").notNull().default(90),
  privacyLevel: text("privacy_level").notNull().default("standard"), // minimal, standard, full
  createdAt: integer("created_at").notNull(), // timestamp as integer
  updatedAt: integer("updated_at").notNull(), // timestamp as integer
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true, createdAt: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertUnderwritingDecisionSchema = createInsertSchema(underwritingDecisions).omit({ id: true, timestamp: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadDate: true });
export const insertUnderwritingRuleSchema = createInsertSchema(underwritingRules).omit({ id: true, createdAt: true });
export const insertEscalationSchema = createInsertSchema(escalations).omit({ id: true, createdAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, timestamp: true });
export const insertBrokerMetricsSchema = createInsertSchema(brokerMetrics).omit({ id: true });
export const insertUserSettingsSchema = createInsertSchema(userSettings).omit({ id: true, createdAt: true, updatedAt: true });

// Additional schemas for authentication
export type UpsertUser = typeof users.$inferInsert;

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Policy = typeof policies.$inferSelect;
export type InsertPolicy = z.infer<typeof insertPolicySchema>;
export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;
export type UnderwritingDecision = typeof underwritingDecisions.$inferSelect;
export type InsertUnderwritingDecision = z.infer<typeof insertUnderwritingDecisionSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type UnderwritingRule = typeof underwritingRules.$inferSelect;
export type InsertUnderwritingRule = z.infer<typeof insertUnderwritingRuleSchema>;
export type Escalation = typeof escalations.$inferSelect;
export type InsertEscalation = z.infer<typeof insertEscalationSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type BrokerMetrics = typeof brokerMetrics.$inferSelect;
export type InsertBrokerMetrics = z.infer<typeof insertBrokerMetricsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;