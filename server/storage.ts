import {
  users, policies, chatMessages, underwritingDecisions, documents, underwritingRules, escalations,
  type User, type InsertUser, type Policy, type InsertPolicy, type ChatMessage, type InsertChatMessage,
  type UnderwritingDecision, type InsertUnderwritingDecision, type Document, type InsertDocument,
  type UnderwritingRule, type InsertUnderwritingRule, type Escalation, type InsertEscalation
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
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

  // Underwriting Decisions
  getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined>;
  createUnderwritingDecision(decision: InsertUnderwritingDecision): Promise<UnderwritingDecision>;
  getDecisionsByPolicy(policyId: number): Promise<UnderwritingDecision[]>;
  getRecentDecisions(limit?: number): Promise<UnderwritingDecision[]>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  getAllDocuments(): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, extractedRules?: any[]): Promise<void>;

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
  createAnalyticsEvent(event: any): Promise<any>;
  getAnalyticsEventsByBroker(brokerId: number, limit?: number): Promise<any[]>;
  
  // Broker Metrics
  createOrUpdateBrokerMetrics(metrics: any): Promise<any>;
  getBrokerMetrics(brokerId: number, date?: Date): Promise<any>;
  getAllBrokerMetrics(date?: Date): Promise<any[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private policies: Map<number, Policy> = new Map();
  private chatMessages: Map<number, ChatMessage> = new Map();
  private underwritingDecisions: Map<number, UnderwritingDecision> = new Map();
  private documents: Map<number, Document> = new Map();
  private underwritingRules: Map<number, UnderwritingRule> = new Map();
  private escalations: Map<number, Escalation> = new Map();
  private currentId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Seed sample policies for demo
    const samplePolicies: Policy[] = [
      {
        id: 1,
        policyNumber: "SME-2024-0892",
        clientName: "ABC Bakery",
        policyType: "SME Restaurant",
        premium: 2400,
        coverageAmount: 500000,
        startDate: new Date("2024-01-01"),
        endDate: new Date("2024-12-31"),
        isActive: true,
        claimsHistory: [],
        riskProfile: "low",
        renewalDate: new Date("2024-12-01")
      },
      {
        id: 2,
        policyNumber: "SME-2024-1234",
        clientName: "City Restaurant",
        policyType: "SME Restaurant",
        premium: 3600,
        coverageAmount: 750000,
        startDate: new Date("2024-01-15"),
        endDate: new Date("2025-01-14"),
        isActive: true,
        claimsHistory: [{ type: "fire", amount: 15000, date: "2023-06-15" }],
        riskProfile: "high",
        renewalDate: new Date("2025-01-01")
      }
    ];

    samplePolicies.forEach(policy => this.policies.set(policy.id, policy));

    // Seed sample rules
    const sampleRules: UnderwritingRule[] = [
      {
        id: 1,
        ruleType: "discount",
        conditions: { claimsHistory: "none_3_years", renewalStatus: "active" },
        action: { discountType: "renewal", percentage: 5 },
        confidence: 95,
        source: "extracted_from_chat",
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 2,
        ruleType: "risk_assessment",
        conditions: { previousClaims: "fire", businessType: "restaurant" },
        action: { escalate: true, reason: "Complex risk factors require manual review" },
        confidence: 90,
        source: "guideline_document",
        isActive: true,
        createdAt: new Date()
      }
    ];

    sampleRules.forEach(rule => this.underwritingRules.set(rule.id, rule));

    this.currentId = 3;
  }

  // Users
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "broker"
    };
    this.users.set(id, user);
    return user;
  }

  // Policies
  async getPolicy(id: number): Promise<Policy | undefined> {
    return this.policies.get(id);
  }

  async getPolicyByNumber(policyNumber: string): Promise<Policy | undefined> {
    return Array.from(this.policies.values()).find(policy => policy.policyNumber === policyNumber);
  }

  async createPolicy(insertPolicy: InsertPolicy): Promise<Policy> {
    const id = this.currentId++;
    const policy: Policy = { 
      ...insertPolicy, 
      id,
      isActive: insertPolicy.isActive ?? true,
      claimsHistory: insertPolicy.claimsHistory || [],
      riskProfile: insertPolicy.riskProfile || "medium",
      renewalDate: insertPolicy.renewalDate || null
    };
    this.policies.set(id, policy);
    return policy;
  }

  async getAllPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  // Chat Messages
  async getChatMessage(id: number): Promise<ChatMessage | undefined> {
    return this.chatMessages.get(id);
  }

  async getChatMessagesBySession(sessionId: string): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values())
      .filter(msg => msg.sessionId === sessionId)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId++;
    const message: ChatMessage = { 
      ...insertMessage, 
      id,
      timestamp: insertMessage.timestamp || new Date(),
      messageType: insertMessage.messageType || "text",
      metadata: insertMessage.metadata || {},
      policyNumber: insertMessage.policyNumber || null,
      brokerId: insertMessage.brokerId || null,
      isArchived: insertMessage.isArchived || false
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values());
  }

  // Underwriting Decisions
  async getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined> {
    return this.underwritingDecisions.get(id);
  }

  async createUnderwritingDecision(insertDecision: InsertUnderwritingDecision): Promise<UnderwritingDecision> {
    const id = this.currentId++;
    const decision: UnderwritingDecision = { 
      ...insertDecision, 
      id,
      timestamp: insertDecision.timestamp || new Date(),
      policyId: insertDecision.policyId || null,
      sessionId: insertDecision.sessionId || null,
      brokerId: insertDecision.brokerId || null,
      rulesApplied: insertDecision.rulesApplied || []
    };
    this.underwritingDecisions.set(id, decision);
    return decision;
  }

  async getDecisionsByPolicy(policyId: number): Promise<UnderwritingDecision[]> {
    return Array.from(this.underwritingDecisions.values())
      .filter(decision => decision.policyId === policyId);
  }

  async getRecentDecisions(limit = 10): Promise<UnderwritingDecision[]> {
    return Array.from(this.underwritingDecisions.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  // Documents
  async getDocument(id: number): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = this.currentId++;
    const document: Document = { 
      ...insertDocument, 
      id,
      uploadDate: insertDocument.uploadDate || new Date(),
      status: insertDocument.status || "pending",
      extractedRules: insertDocument.extractedRules || [],
      content: insertDocument.content || null,
      processedDate: insertDocument.processedDate || null,
      isActive: insertDocument.isActive !== undefined ? insertDocument.isActive : true,
      uploadedBy: insertDocument.uploadedBy || null,
      fileSize: insertDocument.fileSize || null,
      contentHash: insertDocument.contentHash || null
    };
    this.documents.set(id, document);
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async updateDocumentStatus(id: number, status: string, extractedRules?: any[]): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.status = status;
      if (status === "completed") {
        document.processedDate = new Date();
      }
      if (extractedRules) {
        document.extractedRules = extractedRules;
      }
    }
  }

  // Underwriting Rules
  async getUnderwritingRule(id: number): Promise<UnderwritingRule | undefined> {
    return this.underwritingRules.get(id);
  }

  async createUnderwritingRule(insertRule: InsertUnderwritingRule): Promise<UnderwritingRule> {
    const id = this.currentId++;
    const rule: UnderwritingRule = { 
      ...insertRule, 
      id,
      isActive: insertRule.isActive ?? true,
      createdAt: insertRule.createdAt || new Date()
    };
    this.underwritingRules.set(id, rule);
    return rule;
  }

  async getActiveRules(): Promise<UnderwritingRule[]> {
    return Array.from(this.underwritingRules.values()).filter(rule => rule.isActive);
  }

  async getRulesByType(ruleType: string): Promise<UnderwritingRule[]> {
    return Array.from(this.underwritingRules.values()).filter(rule => rule.ruleType === ruleType);
  }

  // Escalations
  async getEscalation(id: number): Promise<Escalation | undefined> {
    return this.escalations.get(id);
  }

  async createEscalation(insertEscalation: InsertEscalation): Promise<Escalation> {
    const id = this.currentId++;
    const escalation: Escalation = { 
      ...insertEscalation, 
      id,
      status: insertEscalation.status || "pending",
      priority: insertEscalation.priority || "medium",
      createdAt: insertEscalation.createdAt || new Date(),
      chatMessageId: insertEscalation.chatMessageId || null,
      assignedTo: insertEscalation.assignedTo || null,
      resolvedAt: insertEscalation.resolvedAt || null,
      brokerId: insertEscalation.brokerId || null,
      assignedToId: insertEscalation.assignedToId || null,
      resolutionNotes: insertEscalation.resolutionNotes || null
    };
    this.escalations.set(id, escalation);
    return escalation;
  }

  async getPendingEscalations(): Promise<Escalation[]> {
    return Array.from(this.escalations.values()).filter(e => e.status === "pending");
  }

  async updateEscalationStatus(id: number, status: string, assignedTo?: string): Promise<void> {
    const escalation = this.escalations.get(id);
    if (escalation) {
      escalation.status = status;
      if (assignedTo) {
        escalation.assignedTo = assignedTo;
      }
      if (status === "resolved") {
        escalation.resolvedAt = new Date();
      }
    }
  }

  // Analytics Events - Memory implementation
  async createAnalyticsEvent(event: any): Promise<any> {
    const newEvent = { id: this.currentId++, ...event, timestamp: event.timestamp || new Date() };
    return newEvent;
  }

  async getAnalyticsEventsByBroker(brokerId: number, limit = 100): Promise<any[]> {
    return [];
  }

  // Broker Metrics - Memory implementation  
  async createOrUpdateBrokerMetrics(metrics: any): Promise<any> {
    const newMetrics = { id: this.currentId++, ...metrics };
    return newMetrics;
  }

  async getBrokerMetrics(brokerId: number, date?: Date): Promise<any> {
    return {
      id: 1,
      brokerId,
      brokerName: "Test Broker",
      metricDate: new Date(),
      totalChats: 5,
      totalDecisions: 4,
      avgResponseTime: 1200,
      avgConfidence: 0.92,
      successfulDecisions: 4,
      escalatedCases: 0,
      documentsUploaded: 1,
      activePolicies: 2
    };
  }

  async getAllBrokerMetrics(date?: Date): Promise<any[]> {
    return [await this.getBrokerMetrics(1)];
  }
}

import { DatabaseStorage } from "./db-storage";
import { seedDatabase } from "./seed-data";
import { initializeSQLiteDatabase } from "./init-sqlite";

// Initialize database with sample data
let isInitialized = false;

export const storage = new DatabaseStorage();

// Initialize and seed database on first use
export async function initializeStorage() {
  if (!isInitialized) {
    try {
      // Initialize SQLite database tables
      initializeSQLiteDatabase();
      
      // Seed with sample data
      await seedDatabase();
      isInitialized = true;
      console.log("Database initialized and seeded successfully");
    } catch (error) {
      console.error("Failed to initialize database:", error);
      // Fall back to in-memory storage if database fails
      console.log("Falling back to in-memory storage...");
      return new MemStorage();
    }
  }
  return storage;
}
