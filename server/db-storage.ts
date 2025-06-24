import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";
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
  userSettings,
  type User,
  type UpsertUser,
  type Policy,
  type ChatMessage,
  type UnderwritingDecision,
  type Document,
  type UnderwritingRule,
  type Escalation,
  type AnalyticsEvent,
  type BrokerMetrics,
  type UserSettings
} from "@shared/schema";
import { IStorage } from "./storage";

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: any): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Policy operations
  async getPolicy(id: number): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.id, id));
    return policy;
  }

  async getPolicyByNumber(policyNumber: string): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.policyNumber, policyNumber));
    return policy;
  }

  async createPolicy(insertPolicy: any): Promise<Policy> {
    const [policy] = await db
      .insert(policies)
      .values(insertPolicy)
      .returning();
    return policy;
  }

  async getAllPolicies(): Promise<Policy[]> {
    return await db.select().from(policies).orderBy(desc(policies.createdAt));
  }

  // Chat messages
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    const [message] = await db.select().from(chatMessages).where(eq(chatMessages.id, id));
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db
      .select()
      .from(chatMessages)
      .where(eq(chatMessages.sessionId, sessionId))
      .orderBy(chatMessages.timestamp);
  }

  async createChatMessage(insertMessage: any): Promise<ChatMessage> {
    const [message] = await db
      .insert(chatMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).orderBy(desc(chatMessages.timestamp));
  }

  // Underwriting decisions
  async getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined> {
    const [decision] = await db.select().from(underwritingDecisions).where(eq(underwritingDecisions.id, id));
    return decision;
  }

  async createUnderwritingDecision(insertDecision: any): Promise<UnderwritingDecision> {
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
    return document;
  }

  async createDocument(insertDocument: any): Promise<Document> {
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
    await db
      .update(documents)
      .set({
        status,
        processedDate: new Date(),
        extractedRules: extractedRules || []
      })
      .where(eq(documents.id, id));
  }

  // Underwriting rules
  async getUnderwritingRule(id: number): Promise<UnderwritingRule | undefined> {
    const [rule] = await db.select().from(underwritingRules).where(eq(underwritingRules.id, id));
    return rule;
  }

  async createUnderwritingRule(insertRule: any): Promise<UnderwritingRule> {
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
      .where(eq(underwritingRules.isActive, true))
      .orderBy(desc(underwritingRules.createdAt));
  }

  async getRulesByType(ruleType: string): Promise<UnderwritingRule[]> {
    return await db
      .select()
      .from(underwritingRules)
      .where(and(eq(underwritingRules.ruleType, ruleType), eq(underwritingRules.isActive, true)));
  }

  // Escalations
  async getEscalation(id: number): Promise<Escalation | undefined> {
    const [escalation] = await db.select().from(escalations).where(eq(escalations.id, id));
    return escalation;
  }

  async createEscalation(insertEscalation: any): Promise<Escalation> {
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
      .where(eq(escalations.status, 'pending'))
      .orderBy(desc(escalations.createdAt));
  }

  async updateEscalationStatus(id: number, status: string, assignedTo?: string): Promise<void> {
    const updateData: any = { status };
    if (assignedTo) updateData.assignedTo = assignedTo;
    if (status === 'resolved') updateData.resolvedAt = new Date();

    await db
      .update(escalations)
      .set(updateData)
      .where(eq(escalations.id, id));
  }

  // Analytics events
  async createAnalyticsEvent(insertEvent: any): Promise<AnalyticsEvent> {
    const [event] = await db
      .insert(analyticsEvents)
      .values(insertEvent)
      .returning();
    return event;
  }

  async getAnalyticsEventsByBroker(brokerId: string, limit = 100): Promise<AnalyticsEvent[]> {
    return await db
      .select()
      .from(analyticsEvents)
      .where(eq(analyticsEvents.brokerId, brokerId))
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(limit);
  }

  // Broker metrics
  async createOrUpdateBrokerMetrics(insertMetrics: any): Promise<BrokerMetrics> {
    const [metrics] = await db
      .insert(brokerMetrics)
      .values(insertMetrics)
      .onConflictDoUpdate({
        target: [brokerMetrics.brokerId, brokerMetrics.metricDate],
        set: insertMetrics
      })
      .returning();
    return metrics;
  }

  async getBrokerMetrics(brokerId: string, date?: Date): Promise<BrokerMetrics | undefined> {
    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [metrics] = await db
      .select()
      .from(brokerMetrics)
      .where(
        and(
          eq(brokerMetrics.brokerId, brokerId),
          gte(brokerMetrics.metricDate, startOfDay),
          lte(brokerMetrics.metricDate, endOfDay)
        )
      );
    return metrics;
  }

  async getAllBrokerMetrics(date?: Date): Promise<BrokerMetrics[]> {
    if (date) {
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      return await db
        .select()
        .from(brokerMetrics)
        .where(
          and(
            gte(brokerMetrics.metricDate, startOfDay),
            lte(brokerMetrics.metricDate, endOfDay)
          )
        );
    }
    
    return await db.select().from(brokerMetrics).orderBy(desc(brokerMetrics.metricDate));
  }

  // User settings
  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId));
    return settings;
  }

  async createOrUpdateUserSettings(userId: string, settings: any): Promise<UserSettings> {
    const [result] = await db
      .insert(userSettings)
      .values({ ...settings, userId })
      .onConflictDoUpdate({
        target: userSettings.userId,
        set: { ...settings, updatedAt: new Date() }
      })
      .returning();
    return result;
  }
}