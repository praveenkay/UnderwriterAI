import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  integer,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table (required for auth)
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  username: varchar("username").unique(),
  password: varchar("password"),
  role: varchar("role").notNull().default("broker"), // broker, underwriter, admin
  name: varchar("name"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyNumber: varchar("policy_number").notNull().unique(),
  clientName: varchar("client_name").notNull(),
  policyType: varchar("policy_type").notNull(), // SME, restaurant, tech, etc.
  premium: real("premium").notNull(),
  coverageAmount: real("coverage_amount").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  claimsHistory: jsonb("claims_history").notNull().default("[]"),
  riskProfile: varchar("risk_profile").notNull().default("medium"), // low, medium, high
  renewalDate: timestamp("renewal_date"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: varchar("session_id").notNull(),
  brokerId: varchar("broker_id").references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  sender: varchar("sender").notNull(), // broker, ai, underwriter
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  messageType: varchar("message_type").notNull().default("text"), // text, decision, escalation
  metadata: jsonb("metadata").default("{}"),
  policyNumber: varchar("policy_number"), // Related policy if applicable
  isArchived: boolean("is_archived").notNull().default(false),
  attachments: jsonb("attachments").default("[]"), // File attachments
});

export const underwritingDecisions = pgTable("underwriting_decisions", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => policies.id),
  brokerId: varchar("broker_id").references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  sessionId: varchar("session_id"), // Link to chat session
  requestType: varchar("request_type").notNull(), // discount, amendment, coverage_change
  requestDetails: jsonb("request_details").notNull(),
  decision: varchar("decision").notNull(), // approved, declined, escalated
  decisionReason: text("decision_reason").notNull(),
  confidence: real("confidence").notNull(), // 0-1
  processedBy: varchar("processed_by").notNull(), // ai, human_underwriter
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  responseTime: integer("response_time_ms").notNull(),
  rulesApplied: jsonb("rules_applied").default("[]"),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: varchar("filename").notNull(),
  originalFilename: varchar("original_filename").notNull(),
  fileType: varchar("file_type").notNull(), // chat_log, guideline, policy, quote
  uploadedBy: varchar("uploaded_by").references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  processedDate: timestamp("processed_date"),
  status: varchar("status").notNull().default("pending"), // pending, processing, completed, failed
  extractedRules: jsonb("extracted_rules").notNull().default("[]"),
  extractedData: jsonb("extracted_data").default("{}"), // General extracted data
  content: text("content"),
  fileSize: integer("file_size"),
  contentHash: varchar("content_hash"), // For deduplication
  isActive: boolean("is_active").notNull().default(true),
  filePath: varchar("file_path"), // Store file path for downloads
  mimeType: varchar("mime_type"),
});

export const underwritingRules = pgTable("underwriting_rules", {
  id: serial("id").primaryKey(),
  ruleType: varchar("rule_type").notNull(), // discount, coverage, risk_assessment
  conditions: jsonb("conditions").notNull(),
  action: jsonb("action").notNull(),
  confidence: real("confidence").notNull(),
  source: varchar("source").notNull(), // extracted_from_chat, guideline_document, manual
  sourceDocumentId: integer("source_document_id").references(() => documents.id),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const escalations = pgTable("escalations", {
  id: serial("id").primaryKey(),
  chatMessageId: integer("chat_message_id").references(() => chatMessages.id),
  brokerId: varchar("broker_id").references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  reason: text("reason").notNull(),
  priority: varchar("priority").notNull().default("medium"), // low, medium, high
  assignedTo: varchar("assigned_to"), // underwriter name
  assignedToId: varchar("assigned_to_id").references(() => users.id),
  status: varchar("status").notNull().default("pending"), // pending, in_progress, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
  resolutionNotes: text("resolution_notes"),
});

// Analytics tracking
export const analyticsEvents = pgTable("analytics_events", {
  id: serial("id").primaryKey(),
  eventType: varchar("event_type").notNull(), // chat_message, decision_made, document_uploaded, etc.
  brokerId: varchar("broker_id").references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  sessionId: varchar("session_id"),
  entityType: varchar("entity_type"), // policy, document, chat, etc.
  entityId: integer("entity_id"), // ID of the related entity
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  metadata: jsonb("metadata").default("{}"),
  duration: integer("duration_ms"), // For performance tracking
});

// Broker performance metrics
export const brokerMetrics = pgTable("broker_metrics", {
  id: serial("id").primaryKey(),
  brokerId: varchar("broker_id").references(() => users.id),
  brokerName: varchar("broker_name").notNull(),
  metricDate: timestamp("metric_date").notNull(),
  totalChats: integer("total_chats").notNull().default(0),
  totalDecisions: integer("total_decisions").notNull().default(0),
  avgResponseTime: real("avg_response_time").notNull().default(0),
  avgConfidence: real("avg_confidence").notNull().default(0),
  successfulDecisions: integer("successful_decisions").notNull().default(0),
  escalatedCases: integer("escalated_cases").notNull().default(0),
  documentsUploaded: integer("documents_uploaded").notNull().default(0),
  activePolicies: integer("active_policies").notNull().default(0),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const upsertUserSchema = createInsertSchema(users).omit({ createdAt: true, updatedAt: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true, timestamp: true });
export const insertUnderwritingDecisionSchema = createInsertSchema(underwritingDecisions).omit({ id: true, timestamp: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true, uploadDate: true });
export const insertUnderwritingRuleSchema = createInsertSchema(underwritingRules).omit({ id: true, createdAt: true });
export const insertEscalationSchema = createInsertSchema(escalations).omit({ id: true, createdAt: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true, timestamp: true });
export const insertBrokerMetricsSchema = createInsertSchema(brokerMetrics).omit({ id: true });

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = z.infer<typeof upsertUserSchema>;
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
