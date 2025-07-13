import {
  users, policies, chatMessages, underwritingDecisions, documents, underwritingRules, escalations,
  type User, type InsertUser, type Policy, type InsertPolicy, type ChatMessage, type InsertChatMessage,
  type UnderwritingDecision, type InsertUnderwritingDecision, type Document, type InsertDocument,
  type UnderwritingRule, type InsertUnderwritingRule, type Escalation, type InsertEscalation
} from "@shared/schema";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  upsertUser?(user: any): Promise<User>;

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
  deleteChatMessage?(id: number): Promise<void>;

  // Underwriting Decisions
  getUnderwritingDecision(id: number): Promise<UnderwritingDecision | undefined>;
  createUnderwritingDecision(decision: InsertUnderwritingDecision): Promise<UnderwritingDecision>;
  getDecisionsByPolicy(policyId: number): Promise<UnderwritingDecision[]>;
  getRecentDecisions(limit?: number): Promise<UnderwritingDecision[]>;

  // Documents
  getDocument(id: number): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  getAllDocuments(): Promise<Document[]>;
  updateDocumentStatus(id: number, status: string, extractedRules?: any[], metadata?: any): Promise<void>;
  deleteDocument(id: number): Promise<void>;

  // Underwriting Rules
  getUnderwritingRule(id: number): Promise<UnderwritingRule | undefined>;
  createUnderwritingRule(rule: InsertUnderwritingRule): Promise<UnderwritingRule>;
  updateUnderwritingRule(id: number, updates: Partial<UnderwritingRule>): Promise<UnderwritingRule>;
  deleteUnderwritingRule(id: number): Promise<void>;
  getActiveRules(): Promise<UnderwritingRule[]>;
  getAllRules(): Promise<UnderwritingRule[]>;
  getRulesByType(ruleType: string): Promise<UnderwritingRule[]>;
  getRulesByDocument(documentId: number): Promise<UnderwritingRule[]>;

  // Escalations
  getEscalation(id: number): Promise<Escalation | undefined>;
  createEscalation(escalation: InsertEscalation): Promise<Escalation>;
  getPendingEscalations(): Promise<Escalation[]>;
  updateEscalationStatus(id: number, status: string, assignedTo?: string): Promise<void>;

  // Analytics Events
  createAnalyticsEvent(event: any): Promise<any>;
  getAnalyticsEventsByBroker(brokerId: string, limit?: number): Promise<any[]>;
  
  // Broker Metrics
  createOrUpdateBrokerMetrics(metrics: any): Promise<any>;
  getBrokerMetrics(brokerId: string, date?: Date): Promise<any>;
  getAllBrokerMetrics(date?: Date): Promise<any[]>;

  // User Settings
  getUserSettings?(userId: string): Promise<any>;
  createOrUpdateUserSettings?(userId: string, settings: any): Promise<any>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private policies: Map<number, Policy> = new Map();
  private chatMessages: Map<number, ChatMessage> = new Map();
  private underwritingDecisions: Map<number, UnderwritingDecision> = new Map();
  private documents: Map<number, Document> = new Map();
  private underwritingRules: Map<number, UnderwritingRule> = new Map();
  private escalations: Map<number, Escalation> = new Map();
  private userSettings: Map<string, any> = new Map();
  private currentId = 1;
  getUserSettings: any;
  createOrUpdateUserSettings: any;

  constructor() {
    // Only seed data if not using database storage
    if (!(this as any).usingDatabase) {
      this.seedData();
    }
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
        startDate: new Date("2024-01-01").getTime(),
        endDate: new Date("2024-12-31").getTime(),
        isActive: true,
        claimsHistory: "[]",
        riskProfile: "low",
        renewalDate: new Date("2024-12-01").getTime(),
        createdAt: Date.now()
      },
      {
        id: 2,
        policyNumber: "SME-2024-1234",
        clientName: "City Restaurant",
        policyType: "SME Restaurant",
        premium: 3600,
        coverageAmount: 750000,
        startDate: new Date("2024-01-15").getTime(),
        endDate: new Date("2025-01-14").getTime(),
        isActive: true,
        claimsHistory: JSON.stringify([{ type: "fire", amount: 15000, date: "2023-06-15" }]),
        riskProfile: "high",
        renewalDate: new Date("2025-01-01").getTime(),
        createdAt: Date.now()
      }
    ];

    samplePolicies.forEach(policy => this.policies.set(policy.id, policy));

    // Seed sample rules
    const sampleRules: UnderwritingRule[] = [
      {
        id: 1,
        ruleType: "discount",
        conditions: JSON.stringify({ claimsHistory: "none_3_years", renewalStatus: "active" }),
        action: JSON.stringify({ discountType: "renewal", percentage: 5 }),
        confidence: 95,
        source: "extracted_from_chat",
        isActive: true,
        createdAt: Date.now(),
        sourceDocumentId: null
      },
      {
        id: 2,
        ruleType: "risk_assessment",
        conditions: JSON.stringify({ previousClaims: "fire", businessType: "restaurant" }),
        action: JSON.stringify({ escalate: true, reason: "Complex risk factors require manual review" }),
        confidence: 90,
        source: "guideline_document",
        isActive: true,
        createdAt: Date.now(),
        sourceDocumentId: null
      }
    ];

    sampleRules.forEach(rule => this.underwritingRules.set(rule.id, rule));

    this.currentId = 3;
  }

  // Users
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId.toString();
    this.currentId++;
    const user: User = { 
      ...insertUser, 
      id,
      role: insertUser.role || "broker",
      createdAt: Date.now(),
      updatedAt: Date.now(),
      email: insertUser.email || null,
      firstName: insertUser.firstName || null,
      lastName: insertUser.lastName || null,
      profileImageUrl: insertUser.profileImageUrl || null,
      username: insertUser.username || null,
      password: insertUser.password || null
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
      claimsHistory: typeof insertPolicy.claimsHistory === 'string' ? insertPolicy.claimsHistory : JSON.stringify(insertPolicy.claimsHistory || []),
      riskProfile: insertPolicy.riskProfile || "medium",
      renewalDate: insertPolicy.renewalDate || null,
      createdAt: Date.now()
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
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentId++;
    const message: ChatMessage = {
      ...insertMessage,
      id,
      timestamp: Date.now(),
      messageType: insertMessage.messageType || "user",
      metadata: typeof insertMessage.metadata === 'string' ? insertMessage.metadata : JSON.stringify(insertMessage.metadata || {}),
      policyNumber: insertMessage.policyNumber || null,
      brokerId: insertMessage.brokerId || null,
      isArchived: insertMessage.isArchived || false,
      attachments: insertMessage.attachments || null
    };
    this.chatMessages.set(id, message);
    return message;
  }

  async getAllChatMessages(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values());
  }

  async deleteChatMessage(id: number): Promise<void> {
    this.chatMessages.delete(id);
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
      timestamp: Date.now(),
      policyId: insertDecision.policyId || null,
      sessionId: insertDecision.sessionId || null,
      brokerId: insertDecision.brokerId || null,
      rulesApplied: typeof insertDecision.rulesApplied === 'string' ? insertDecision.rulesApplied : JSON.stringify(insertDecision.rulesApplied || [])
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
      .sort((a, b) => b.timestamp - a.timestamp)
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
      uploadDate: Date.now(),
      status: insertDocument.status || "pending",
      extractedRules: typeof insertDocument.extractedRules === 'string' ? insertDocument.extractedRules : JSON.stringify(insertDocument.extractedRules || []),
      content: insertDocument.content || null,
      processedDate: insertDocument.processedDate || null,
      isActive: insertDocument.isActive !== undefined ? insertDocument.isActive : true,
      uploadedBy: insertDocument.uploadedBy || null,
      fileSize: insertDocument.fileSize || null,
      contentHash: insertDocument.contentHash || null,
      filePath: insertDocument.filePath || null,
      extractedData: insertDocument.extractedData || null,
      mimeType: insertDocument.mimeType || null
    };
    this.documents.set(id, document);
    return document;
  }

  async getAllDocuments(): Promise<Document[]> {
    return Array.from(this.documents.values());
  }

  async updateDocumentStatus(id: number, status: string, extractedRules?: any[], metadata?: any): Promise<void> {
    const document = this.documents.get(id);
    if (document) {
      document.status = status;
      if (status === "completed") {
        document.processedDate = Date.now();
      }
      if (extractedRules) {
        document.extractedRules = JSON.stringify(extractedRules);
      }
    }
  }

  async deleteDocument(id: number): Promise<void> {
    this.documents.delete(id);
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
      createdAt: Date.now(),
      sourceDocumentId: insertRule.sourceDocumentId || null
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

  async updateUnderwritingRule(id: number, updates: Partial<UnderwritingRule>): Promise<UnderwritingRule> {
    const rule = this.underwritingRules.get(id);
    if (!rule) {
      throw new Error(`Rule with id ${id} not found`);
    }
    
    const updatedRule = { ...rule, ...updates };
    this.underwritingRules.set(id, updatedRule);
    return updatedRule;
  }

  async deleteUnderwritingRule(id: number): Promise<void> {
    this.underwritingRules.delete(id);
  }

  async getAllRules(): Promise<UnderwritingRule[]> {
    return Array.from(this.underwritingRules.values());
  }

  async getRulesByDocument(documentId: number): Promise<UnderwritingRule[]> {
    return Array.from(this.underwritingRules.values())
      .filter(rule => rule.sourceDocumentId === documentId);
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
      createdAt: Date.now(),
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
        escalation.resolvedAt = Date.now();
      }
    }
  }

  // Analytics Events - Memory implementation
  async createAnalyticsEvent(event: any): Promise<any> {
    const newEvent = { id: this.currentId++, ...event, timestamp: event.timestamp || new Date() };
    return newEvent;
  }

  async getAnalyticsEventsByBroker(brokerId: string, limit = 100): Promise<any[]> {
    return [];
  }

  // Broker Metrics - Memory implementation  
  async createOrUpdateBrokerMetrics(metrics: any): Promise<any> {
    const newMetrics = { id: this.currentId++, ...metrics };
    return newMetrics;
  }

  async getBrokerMetrics(brokerId: string, date?: Date): Promise<any> {
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
    return [await this.getBrokerMetrics("1")];
  }
}

import { DatabaseStorage } from "./db-storage";
import { seedDatabase } from "./seed-data";
import { initializeSQLiteDatabase } from "./init-sqlite";

// Initialize database with sample data
let isInitialized = false;

export const storage = new MemStorage();

// Initialize and seed database on first use
export async function initializeStorage() {
  if (!isInitialized) {
    try {
      // Try database storage first
      const { DatabaseStorage } = await import("./db-storage");
      const dbStorage = new DatabaseStorage();
      
      // Test connection - DON'T seed automatically since it's handled in index.ts
      await dbStorage.getAllDocuments();
      
      // Replace in-memory storage with database storage
      Object.setPrototypeOf(storage, DatabaseStorage.prototype);
      Object.assign(storage, dbStorage);
      
      isInitialized = true;
      console.log("Database storage initialized successfully");
      return storage;
    } catch (error) {
      console.error("Database initialization failed:", error);
      console.log("Using in-memory storage as fallback");
      return storage;
    }
  }
  return storage;
}
