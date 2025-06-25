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
    // Convert Date objects to timestamps for SQLite
    const policyData = {
      ...insertPolicy,
      startDate: insertPolicy.startDate instanceof Date ? insertPolicy.startDate.getTime() : insertPolicy.startDate,
      endDate: insertPolicy.endDate instanceof Date ? insertPolicy.endDate.getTime() : insertPolicy.endDate,
      renewalDate: insertPolicy.renewalDate instanceof Date ? insertPolicy.renewalDate.getTime() : insertPolicy.renewalDate,
      createdAt: insertPolicy.createdAt instanceof Date ? insertPolicy.createdAt.getTime() : Date.now(),
      claimsHistory: typeof insertPolicy.claimsHistory === 'object' ? JSON.stringify(insertPolicy.claimsHistory) : insertPolicy.claimsHistory || '[]'
    };

    const result = await db
      .insert(policies)
      .values(policyData)
      .returning();
    return result[0];
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
    // Convert Date objects to timestamps for SQLite
    const messageData = {
      ...insertMessage,
      timestamp: insertMessage.timestamp instanceof Date ? insertMessage.timestamp.getTime() : insertMessage.timestamp || Date.now(),
      metadata: typeof insertMessage.metadata === 'object' ? JSON.stringify(insertMessage.metadata) : insertMessage.metadata || '{}',
      attachments: typeof insertMessage.attachments === 'object' ? JSON.stringify(insertMessage.attachments) : insertMessage.attachments || '[]'
    };

    const result = await db
      .insert(chatMessages)
      .values(messageData)
      .returning();
    return result[0];
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
    // Convert Date objects to timestamps for SQLite
    const decisionData = {
      ...insertDecision,
      timestamp: insertDecision.timestamp instanceof Date ? insertDecision.timestamp.getTime() : insertDecision.timestamp || Date.now(),
      requestDetails: typeof insertDecision.requestDetails === 'object' ? JSON.stringify(insertDecision.requestDetails) : insertDecision.requestDetails,
      rulesApplied: typeof insertDecision.rulesApplied === 'object' ? JSON.stringify(insertDecision.rulesApplied) : insertDecision.rulesApplied || '[]'
    };

    const result = await db
      .insert(underwritingDecisions)
      .values(decisionData)
      .returning();
    return result[0];
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
    // Convert Date objects to timestamps for SQLite
    const documentData = {
      ...insertDocument,
      uploadDate: insertDocument.uploadDate instanceof Date ? insertDocument.uploadDate.getTime() : insertDocument.uploadDate || Date.now(),
      processedDate: insertDocument.processedDate instanceof Date ? insertDocument.processedDate.getTime() : insertDocument.processedDate,
      extractedRules: typeof insertDocument.extractedRules === 'object' ? JSON.stringify(insertDocument.extractedRules) : insertDocument.extractedRules || '[]',
      extractedData: typeof insertDocument.extractedData === 'object' ? JSON.stringify(insertDocument.extractedData) : insertDocument.extractedData || '{}'
    };

    const result = await db
      .insert(documents)
      .values(documentData)
      .returning();
    return result[0];
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
    // Convert Date objects to timestamps for SQLite
    const ruleData = {
      ...insertRule,
      createdAt: insertRule.createdAt instanceof Date ? insertRule.createdAt.getTime() : insertRule.createdAt || Date.now(),
      conditions: typeof insertRule.conditions === 'object' ? JSON.stringify(insertRule.conditions) : insertRule.conditions,
      action: typeof insertRule.action === 'object' ? JSON.stringify(insertRule.action) : insertRule.action
    };

    const result = await db
      .insert(underwritingRules)
      .values(ruleData)
      .returning();
    return result[0];
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
    // Convert Date objects to timestamps for SQLite
    const escalationData = {
      ...insertEscalation,
      createdAt: insertEscalation.createdAt instanceof Date ? insertEscalation.createdAt.getTime() : insertEscalation.createdAt || Date.now(),
      resolvedAt: insertEscalation.resolvedAt instanceof Date ? insertEscalation.resolvedAt.getTime() : insertEscalation.resolvedAt
    };

    const result = await db
      .insert(escalations)
      .values(escalationData)
      .returning();
    return result[0];
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
    // Convert Date objects to timestamps for SQLite
    const eventData = {
      ...insertEvent,
      timestamp: insertEvent.timestamp instanceof Date ? insertEvent.timestamp.getTime() : insertEvent.timestamp || Date.now(),
      metadata: typeof insertEvent.metadata === 'object' ? JSON.stringify(insertEvent.metadata) : insertEvent.metadata || '{}'
    };

    const result = await db
      .insert(analyticsEvents)
      .values(eventData)
      .returning();
    return result[0];
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