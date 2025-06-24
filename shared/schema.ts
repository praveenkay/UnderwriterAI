import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("broker"), // broker, underwriter, admin
  name: text("name").notNull(),
});

export const policies = pgTable("policies", {
  id: serial("id").primaryKey(),
  policyNumber: text("policy_number").notNull().unique(),
  clientName: text("client_name").notNull(),
  policyType: text("policy_type").notNull(), // SME, restaurant, tech, etc.
  premium: integer("premium").notNull(),
  coverageAmount: integer("coverage_amount").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isActive: boolean("is_active").notNull().default(true),
  claimsHistory: jsonb("claims_history").notNull().default([]),
  riskProfile: text("risk_profile").notNull().default("medium"), // low, medium, high
  renewalDate: timestamp("renewal_date"),
});

export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  sender: text("sender").notNull(), // broker, ai, underwriter
  message: text("message").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  messageType: text("message_type").notNull().default("text"), // text, decision, escalation
  metadata: jsonb("metadata").notNull().default({}),
});

export const underwritingDecisions = pgTable("underwriting_decisions", {
  id: serial("id").primaryKey(),
  policyId: integer("policy_id").references(() => policies.id),
  requestType: text("request_type").notNull(), // discount, amendment, coverage_change
  requestDetails: jsonb("request_details").notNull(),
  decision: text("decision").notNull(), // approved, declined, escalated
  decisionReason: text("decision_reason").notNull(),
  confidence: integer("confidence").notNull(), // 0-100
  processedBy: text("processed_by").notNull(), // ai, human_underwriter
  timestamp: timestamp("timestamp").notNull().defaultNow(),
  responseTime: integer("response_time_ms").notNull(),
});

export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  filename: text("filename").notNull(),
  fileType: text("file_type").notNull(), // chat_log, guideline, policy
  uploadDate: timestamp("upload_date").notNull().defaultNow(),
  processedDate: timestamp("processed_date"),
  status: text("status").notNull().default("pending"), // pending, processing, completed, failed
  extractedRules: jsonb("extracted_rules").notNull().default([]),
  content: text("content"),
});

export const underwritingRules = pgTable("underwriting_rules", {
  id: serial("id").primaryKey(),
  ruleType: text("rule_type").notNull(), // discount, coverage, risk_assessment
  conditions: jsonb("conditions").notNull(),
  action: jsonb("action").notNull(),
  confidence: integer("confidence").notNull(),
  source: text("source").notNull(), // extracted_from_chat, guideline_document, manual
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const escalations = pgTable("escalations", {
  id: serial("id").primaryKey(),
  chatMessageId: integer("chat_message_id").references(() => chatMessages.id),
  reason: text("reason").notNull(),
  priority: text("priority").notNull().default("medium"), // low, medium, high
  assignedTo: text("assigned_to"), // underwriter name
  status: text("status").notNull().default("pending"), // pending, in_progress, resolved
  createdAt: timestamp("created_at").notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at"),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const insertPolicySchema = createInsertSchema(policies).omit({ id: true });
export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({ id: true });
export const insertUnderwritingDecisionSchema = createInsertSchema(underwritingDecisions).omit({ id: true });
export const insertDocumentSchema = createInsertSchema(documents).omit({ id: true });
export const insertUnderwritingRuleSchema = createInsertSchema(underwritingRules).omit({ id: true });
export const insertEscalationSchema = createInsertSchema(escalations).omit({ id: true });

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
