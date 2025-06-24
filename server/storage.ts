import {
  users, policies, chatMessages, underwritingDecisions, documents, underwritingRules, escalations,
  analyticsEvents, brokerMetrics,
  type User, type InsertUser, type UpsertUser, type Policy, type InsertPolicy, type ChatMessage, type InsertChatMessage,
  type UnderwritingDecision, type InsertUnderwritingDecision, type Document, type InsertDocument,
  type UnderwritingRule, type InsertUnderwritingRule, type Escalation, type InsertEscalation,
  type AnalyticsEvent, type InsertAnalyticsEvent, type BrokerMetrics, type InsertBrokerMetrics
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte } from "drizzle-orm";

export interface IStorage {
  // Users (Required for Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Policies
  getPolicy(id: number): Promise<Policy | undefined>;
  getPolicyByNumber(policyNumber: string): Promise<Policy | undefined>;
  createPolicy(policy: InsertPolicy): Promise<Policy>;
  getAllPolicies(): Promise<Policy[]>;

  // Chat Messages
  getChatMessage(id: number): Promise<ChatMessage | undefined>;
  getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getAllChatMessages(): Promise<ChatMessage[]>;
  updateChatMessageAttachments(id: number, attachments: any[]): Promise<void>;

  // Underwriting Decisions
  getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined>;
  createUnderwritingDecision(decision: InsertUnderwritingDecision): Promise<UnderwritingDecision>;
  getDecisionsByPolicy(policyId: number): Promise<UnderwritingDecision[]>;
  getRecentDecisions(limit?: number): Promise<UnderwritingDecision[]>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  getAllDocuments(): Promise<Document[]>;
  getDocumentsByBroker(brokerId: string): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, extractedRules?: any[], extractedData?: any): Promise<void>;

  // Underwriting Rules
  getUnderwritingRule(id: number): Promise<UnderwritingRule | undefined>;
  createUnderwritingRule(rule: InsertUnderwritingRule): Promise<UnderwritingRule>;
  getActiveRules(): Promise<UnderwritingRule[]>;
  getRulesByType(ruleType: string): Promise<UnderwritingRule[]>;

  // Escalations
  getEscalation(id: number): Promise<Escalation | undefined>;
  createEscalation(escalation: InsertEscalation): Promise<Escalation>;
  getPendingEscalations(): Promise<Escalation[]>;
  updateEscalationStatus(id: number, status: string, assignedTo?: string): Promise<void>;

  // Analytics Events
  createAnalyticsEvent(event: InsertAnalyticsEvent): Promise<AnalyticsEvent>;
  getAnalyticsEventsByBroker(brokerId: string, limit?: number): Promise<AnalyticsEvent[]>;
  
  // Broker Metrics
  createOrUpdateBrokerMetrics(metrics: InsertBrokerMetrics): Promise<BrokerMetrics>;
  getBrokerMetrics(brokerId: string, date?: Date): Promise<BrokerMetrics | undefined>;
  getAllBrokerMetrics(date?: Date): Promise<BrokerMetrics[]>;
}

export class DatabaseStorage implements IStorage {
  // Users (Required for Auth)
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
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
    return policy;
  }

  async getPolicyByNumber(policyNumber: string): Promise<Policy | undefined> {
    const [policy] = await db.select().from(policies).where(eq(policies.policyNumber, policyNumber));
    return policy;
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
    return message;
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return await db.select().from(chatMessages).where(eq(chatMessages.sessionId, sessionId)).orderBy(chatMessages.timestamp);
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

  async updateChatMessageAttachments(id: number, attachments: any[]): Promise<void> {
    await db.update(chatMessages)
      .set({ attachments })
      .where(eq(chatMessages.id, id));
  }

  // Underwriting Decisions
  async getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined> {
    const [decision] = await db.select().from(underwritingDecisions).where(eq(underwritingDecisions.id, id));
    return decision;
  }

  async createUnderwritingDecision(insertDecision: InsertUnderwritingDecision): Promise<UnderwritingDecision> {
    const [decision] = await db
      .insert(underwritingDecisions)
      .values(insertDecision)
      .returning();
    return decision;
  }

  async getDecisionsByPolicy(policyId: number): Promise<UnderwritingDecision[]> {
    return await db.select().from(underwritingDecisions).where(eq(underwritingDecisions.policyId, policyId));
  }

  async getRecentDecisions(limit = 10): Promise<UnderwritingDecision[]> {
    return await db.select().from(underwritingDecisions)
      .orderBy(desc(underwritingDecisions.timestamp))
      .limit(limit);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document;
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

  async getDocumentsByBroker(brokerId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.uploadedBy, brokerId));
  }

  async updateDocumentStatus(id: number, status: string, extractedRules?: any[], extractedData?: any): Promise<void> {
    const updateData: any = { 
      status, 
      processedDate: new Date() 
    };
    
    if (extractedRules) {
      updateData.extractedRules = extractedRules;
    }
    
    if (extractedData) {
      updateData.extractedData = extractedData;
    }

    await db.update(documents)
      .set(updateData)
      .where(eq(documents.id, id));
  }

  // Underwriting Rules
  async getUnderwritingRule(id: number): Promise<UnderwritingRule | undefined> {
    const [rule] = await db.select().from(underwritingRules).where(eq(underwritingRules.id, id));
    return rule;
  }

  async createUnderwritingRule(insertRule: InsertUnderwritingRule): Promise<UnderwritingRule> {
    const [rule] = await db
      .insert(underwritingRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async getActiveRules(): Promise<UnderwritingRule[]> {
    return await db.select().from(underwritingRules).where(eq(underwritingRules.isActive, true));
  }

  async getRulesByType(ruleType: string): Promise<UnderwritingRule[]> {
    return await db.select().from(underwritingRules)
      .where(and(eq(underwritingRules.ruleType, ruleType), eq(underwritingRules.isActive, true)));
  }

  // Escalations
  async getEscalation(id: number): Promise<Escalation | undefined> {
    const [escalation] = await db.select().from(escalations).where(eq(escalations.id, id));
    return escalation;
  }

  async createEscalation(insertEscalation: InsertEscalation): Promise<Escalation> {
    const [escalation] = await db
      .insert(escalations)
      .values(insertEscalation)
      .returning();
    return escalation;
  }

  async getPendingEscalations(): Promise<Escalation[]> {
    return await db.select().from(escalations).where(eq(escalations.status, "pending"));
  }

  async updateEscalationStatus(id: number, status: string, assignedTo?: string): Promise<void> {
    const updateData: any = { status };
    
    if (assignedTo) {
      updateData.assignedTo = assignedTo;
    }
    
    if (status === "resolved") {
      updateData.resolvedAt = new Date();
    }

    await db.update(escalations)
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

  async getAnalyticsEventsByBroker(brokerId: string, limit = 100): Promise<AnalyticsEvent[]> {
    return await db.select().from(analyticsEvents)
      .where(eq(analyticsEvents.brokerId, brokerId))
      .orderBy(desc(analyticsEvents.timestamp))
      .limit(limit);
  }

  // Broker Metrics
  async createOrUpdateBrokerMetrics(insertMetrics: InsertBrokerMetrics): Promise<BrokerMetrics> {
    const [metrics] = await db
      .insert(brokerMetrics)
      .values(insertMetrics)
      .onConflictDoUpdate({
        target: [brokerMetrics.brokerId, brokerMetrics.metricDate],
        set: insertMetrics,
      })
      .returning();
    return metrics;
  }

  async getBrokerMetrics(brokerId: string, date?: Date): Promise<BrokerMetrics | undefined> {
    const targetDate = date || new Date();
    const [metrics] = await db.select().from(brokerMetrics)
      .where(and(
        eq(brokerMetrics.brokerId, brokerId),
        eq(brokerMetrics.metricDate, targetDate)
      ));
    return metrics;
  }

  async getAllBrokerMetrics(date?: Date): Promise<BrokerMetrics[]> {
    if (date) {
      return await db.select().from(brokerMetrics)
        .where(eq(brokerMetrics.metricDate, date));
    }
    return await db.select().from(brokerMetrics)
      .orderBy(desc(brokerMetrics.metricDate));
  }
}

export const storage = new DatabaseStorage();

export async function initializeStorage() {
  try {
    // Seed some initial data if needed
    await seedDatabase();
    console.log("Database initialized and seeded successfully");
  } catch (error) {
    console.error("Failed to initialize database:", error);
    console.log("Falling back to in-memory storage...");
  }
}

async function seedDatabase() {
  // Create sample users
  const sampleUsers = [
    {
      id: "broker_1",
      email: "john@example.com",
      firstName: "John",
      lastName: "Smith",
      username: "john_broker",
      password: "password123",
      role: "broker",
      name: "John Smith"
    },
    {
      id: "underwriter_1", 
      email: "sarah@example.com",
      firstName: "Sarah",
      lastName: "Johnson",
      username: "sarah_underwriter",
      password: "password123",
      role: "underwriter",
      name: "Sarah Johnson"
    }
  ];

  // Try to create users (will skip if they exist)
  for (const user of sampleUsers) {
    try {
      await storage.upsertUser(user);
    } catch (error) {
      // User might already exist, continue
    }
  }

  // Create sample policies
  const samplePolicies = [
    {
      policyNumber: "POL-2024-001",
      clientName: "Tech Solutions Ltd",
      policyType: "SME",
      premium: 2500.00,
      coverageAmount: 500000.00,
      startDate: new Date("2024-01-01"),
      endDate: new Date("2024-12-31"),
      isActive: true,
      claimsHistory: [
        { date: "2023-06-15", amount: 15000, type: "Equipment damage" }
      ],
      riskProfile: "medium",
      renewalDate: new Date("2024-11-01")
    },
    {
      policyNumber: "POL-2024-002",
      clientName: "Cozy Corner Restaurant",
      policyType: "restaurant",
      premium: 3200.00,
      coverageAmount: 750000.00,
      startDate: new Date("2024-02-01"),
      endDate: new Date("2025-01-31"),
      isActive: true,
      claimsHistory: [],
      riskProfile: "high",
      renewalDate: new Date("2024-12-01")
    }
  ];

  for (const policy of samplePolicies) {
    try {
      await storage.createPolicy(policy);
    } catch (error) {
      // Policy might already exist
    }
  }

  // Create sample rules
  const sampleRules = [
    {
      ruleType: "discount",
      conditions: {
        claimsHistory: "none",
        renewalStatus: "existing_customer"
      },
      action: {
        discountType: "loyalty",
        percentage: 10
      },
      confidence: 0.9,
      source: "manual",
      sourceDocumentId: null,
      isActive: true
    },
    {
      ruleType: "risk_assessment",
      conditions: {
        previousClaims: "high_frequency",
        businessType: "restaurant"
      },
      action: {
        escalate: true,
        reason: "High risk profile requires manual review"
      },
      confidence: 0.8,
      source: "manual",
      sourceDocumentId: null,
      isActive: true
    }
  ];

  for (const rule of sampleRules) {
    try {
      await storage.createUnderwritingRule(rule);
    } catch (error) {
      // Rule might already exist
    }
  }
}