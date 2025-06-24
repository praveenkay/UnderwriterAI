import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("broker"), // broker, underwriter, admin
  name: text("name").notNull(),
});

export const policies = sqliteTable("policies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyNumber: text("policy_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  policyType: text("policy_type").notNull(), // SME, restaurant, tech, etc.
  premium: real("premium").notNull(),
  coverageAmount: real("coverage_amount").notNull(),
  startDate: integer("start_date", { mode: "timestamp" }).notNull(),
  endDate: integer("end_date", { mode: "timestamp" }).notNull(),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  claimsHistory: text("claims_history", { mode: "json" }).notNull().default("[]"),
  riskProfile: text("risk_profile").notNull().default("medium"), // low, medium, high
  renewalDate: integer("renewal_date", { mode: "timestamp" }),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  sessionId: text("session_id").notNull(),
  brokerId: integer("broker_id").references(() => users.id),
  brokerName: text("broker_name").notNull(),
  sender: text("sender").notNull(), // broker, ai, underwriter
  message: text("message").notNull(),
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  messageType: text("message_type").notNull().default("text"), // text, decision, escalation
  metadata: text("metadata", { mode: "json" }).default("{}"),
  policyNumber: text("policy_number"), // Related policy if applicable
  isArchived: integer("is_archived", { mode: "boolean" }).notNull().default(false),
});

export const underwritingDecisions = sqliteTable("underwriting_decisions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  policyId: integer("policy_id").references(() => policies.id),
  brokerId: integer("broker_id").references(() => users.id),
  brokerName: text("broker_name").notNull(),
  sessionId: text("session_id"), // Link to chat session
  requestType: text("request_type").notNull(), // discount, amendment, coverage_change
  requestDetails: text("request_details", { mode: "json" }).notNull(),
  decision: text("decision").notNull(), // approved, declined, escalated
  decisionReason: text("decision_reason").notNull(),
  confidence: real("confidence").notNull(), // 0-1
  processedBy: text("processed_by").notNull(), // ai, human_underwriter
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  responseTime: integer("response_time_ms").notNull(),
  rulesApplied: text("rules_applied", { mode: "json" }).default("[]"),
});

export const documents = sqliteTable("documents", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  filename: text("filename").notNull(),
  originalFilename: text("original_filename").notNull(),
  fileType: text("file_type").notNull(), // chat_log, guideline, policy
  uploadedBy: integer("uploaded_by").references(() => users.id),
  brokerName: text("broker_name").notNull(),
  uploadDate: integer("upload_date", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  processedDate: integer("processed_date", { mode: "timestamp" }),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  extractedRules: text("extracted_rules", { mode: "json" }).notNull().default("[]"),
  content: text("content"),
  fileSize: integer("file_size"),
  contentHash: text("content_hash"), // For deduplication
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
});

export const underwritingRules = sqliteTable("underwriting_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  ruleType: text("rule_type").notNull(), // discount, coverage, risk_assessment
  conditions: text("conditions", { mode: "json" }).notNull(),
  action: text("action", { mode: "json" }).notNull(),
  confidence: real("confidence").notNull(),
  source: text("source").notNull(), // extracted_from_chat, guideline_document, manual
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
});

export const escalations = sqliteTable("escalations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  chatMessageId: integer("chat_message_id").references(() => chatMessages.id),
  brokerId: integer("broker_id").references(() => users.id),
  brokerName: text("broker_name").notNull(),
  reason: text("reason").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: text("assigned_to"), // underwriter name
  assignedToId: integer("assigned_to_id").references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, in_progress, resolved
  createdAt: integer("created_at", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  resolvedAt: integer("resolved_at", { mode: "timestamp" }),
  resolutionNotes: text("resolution_notes"),
});

// New table for analytics tracking
export const analyticsEvents = sqliteTable("analytics_events", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  eventType: text("event_type").notNull(), // chat_message, decision_made, document_uploaded, etc.
  brokerId: integer("broker_id").references(() => users.id),
  brokerName: text("broker_name").notNull(),
  sessionId: text("session_id"),
  entityType: text("entity_type"), // policy, document, chat, etc.
  entityId: integer("entity_id"), // ID of the related entity
  timestamp: integer("timestamp", { mode: "timestamp" }).notNull().$defaultFn(() => new Date()),
  metadata: text("metadata", { mode: "json" }).default("{}"),
  duration: integer("duration_ms"), // For performance tracking
});

// New table for broker performance metrics
export const brokerMetrics = sqliteTable("broker_metrics", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  brokerId: integer("broker_id").references(() => users.id),
  brokerName: text("broker_name").notNull(),
  metricDate: integer("metric_date", { mode: "timestamp" }).notNull(),
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
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export const insertUnderwritingDecisionSchema = createInsertSchema(underwritingDecisions).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertUnderwritingRuleSchema = createInsertSchema(underwritingRules).omit({ id: true });
export const insertEscalationSchema = createInsertSchema(escalations).omit({ id: true });
export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({ id: true });
export const insertBrokerMetricsSchema = createInsertSchema(brokerMetrics).omit({ id: true });

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
