import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import {
  users,
  policies,
  chatMessages,
  underwritingDecisions,
  documents,
  underwritingRules,
  escalations,
  analyticsEvents,
  brokerMetrics,
  type User,
  type InsertUser,
  type Policy,
  type InsertPolicy,
  type ChatMessage,
  type InsertChatMessage,
  type UnderwritingDecision,
  type InsertUnderwritingDecision,
  type Document,
  type InsertDocument,
  type UnderwritingRule,
  type InsertUnderwritingRule,
  type Escalation,
  type InsertEscalation,
  type AnalyticsEvent,
  type InsertAnalyticsEvent,
  type BrokerMetrics,
  type InsertBrokerMetrics,
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Policies
  async getPolicy(id: number): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.id, id));
    return policy || undefined;
  }

  async getPolicyByNumber(policyNumber: string): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.policyNumber, policyNumber));
    return policy || undefined;
  }

  async createPolicy(insertPolicy: InsertPolicy): Promise<Policy> {
    const [policy] = await db
      .insert(policies)
      .values(insertPolicy)
      .returning();
    return policy;
  }

  async getAllPolicies(): Promise<Policy[]> {
    return await db.select().from(policies);
  }

  // Chat Messages
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return message || undefined;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.timestamp));
  }

  // Underwriting Decisions
  async getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined> {
    const [decision] = await db.select().from(underwritingDecisions).where(eq(underwritingDecisions.id, id));
    return decision || undefined;
  }

  async createUnderwritingDecision(insertDecision: InsertUnderwritingDecision): Promise<UnderwritingDecision> {
    const [decision] = await db
      .insert(underwritingDecisions)
      .values(insertDecision)
      .returning();
    return decision;
  }

  async getDecisionsByPolicy(policyId: number): Promise<UnderwritingDecision[]> {
    return await db
      .select()
      .from(underwritingDecisions)
      .where(eq(underwritingDecisions.policyId, policyId))
      .orderBy(desc(underwritingDecisions.timestamp));
  }

  async getRecentDecisions(limit = 10): Promise<UnderwritingDecision[]> {
    return await db
      .select()
      .from(underwritingDecisions)
      .orderBy(desc(underwritingDecisions.timestamp))
      .limit(limit);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return await db.select().from(documents).orderBy(desc(documents.uploadDate));
  }

  async updateDocumentStatus(id: number, status: string, extractedRules?: any[]): Promise<void> {
    const updateData: any = { status };
    if (extractedRules) {
      updateData.extractedRules = extractedRules;
    }
    
    await db
      .update(documents)
      .set(updateData)
      .where(eq(documents.id, id));
  }

  // Underwriting Rules
  async getUnderwritingRule(id: number): Promise<UnderwritingRule | undefined> {
    const [rule] = await db.select().from(underwritingRules).where(eq(underwritingRules.id, id));
    return rule || undefined;
  }

  async createUnderwritingRule(insertRule: InsertUnderwritingRule): Promise<UnderwritingRule> {
    const [rule] = await db
      .insert(underwritingRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async getActiveRules(): Promise<UnderwritingRule[]> {
    return await db
      .select()
      .from(underwritingRules)
      .where(eq(underwritingRules.isActive, true));
  }

  async getRulesByType(ruleType: string): Promise<UnderwritingRule[]> {
    return await db
      .select()
      .from(underwritingRules)
      .where(eq(underwritingRules.ruleType, ruleType));
  }

  // Escalations
  async getEscalation(id: number): Promise<Escalation | undefined> {
    const [escalation] = await db.select().from(escalations).where(eq(escalations.id, id));
    return escalation || undefined;
  }

  async createEscalation(insertEscalation: InsertEscalation): Promise<Escalation> {
    const [escalation] = await db
      .insert(escalations)
      .values(insertEscalation)
      .returning();
    return escalation;
  }

  async getPendingEscalations(): Promise<Escalation[]> {
    return await db
      .select()
      .from(escalations)
      .where(eq(escalations.status, "pending"))
      .orderBy(desc(escalations.createdAt));
  }

  async updateEscalationStatus(id: number, status: string, assignedTo?: string): Promise<void> {
    const updateData: any = { status };
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }
    
    await db
      .update(escalations)
      .set(updateData)
      .where(eq(escalations.id, id));
  }

  // Analytics Events
  async createAnalyticsEvent(insertEvent: InsertAnalyticsEvent): Promise<AnalyticsEvent> {
    const [event] = await db
      .insert(analyticsEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getAnalyticsEventsByBroker(brokerId: number, limit = 100): Promise<AnalyticsEvent[]> {
    return await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.brokerId, brokerId))
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(limit);
  }

  // Broker Metrics
  async createOrUpdateBrokerMetrics(insertMetrics: InsertBrokerMetrics): Promise<BrokerMetrics> {
    // Check if metrics exist for this broker and date
    const existingMetrics = await this.getBrokerMetrics(insertMetrics.brokerId!, insertMetrics.metricDate!);
    
    if (existingMetrics) {
      // Update existing metrics
      const [updated] = await db
        .update(brokerMetrics)
        .set(insertMetrics)
        .where(eq(brokerMetrics.id, existingMetrics.id))
        .returning();
      return updated;
    } else {
      // Create new metrics
      const [metrics] = await db
        .insert(brokerMetrics)
        .values(insertMetrics)
        .returning();
      return metrics;
    }
  }

  async getBrokerMetrics(brokerId: number, date?: Date): Promise<BrokerMetrics | undefined> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    const [metrics] = await db
      .select()
      .from(brokerMetrics)
      .where(eq(brokerMetrics.brokerId, brokerId))
      .orderBy(desc(brokerMetrics.metricDate))
      .limit(1);
    
    return metrics || undefined;
  }

  async getAllBrokerMetrics(date?: Date): Promise<BrokerMetrics[]> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    
    return await db
      .select()
      .from(brokerMetrics)
      .orderBy(desc(brokerMetrics.metricDate));
  }
}