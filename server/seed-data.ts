import { db } from "./db";
import { 
  users, 
  policies, 
  underwritingRules, 
  chatMessages, 
  underwritingDecisions,
  documents,
  analyticsEvents,
  brokerMetrics
} from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database with sample data...");

  // Clear existing data
  await db.delete(brokerMetrics);
  await db.delete(analyticsEvents);
  await db.delete(underwritingDecisions);
  await db.delete(chatMessages);
  await db.delete(documents);
  await db.delete(underwritingRules);
  await db.delete(policies);
  await db.delete(users);

  // Seed users
  const [brokerUser] = await db.insert(users).values({
    username: "broker1",
    password: "password123",
    name: "Sarah Johnson",
    role: "broker",
  }).returning();

  const [underwriterUser] = await db.insert(users).values({
    username: "underwriter1",
    password: "password123",
    name: "Michael Chen",
    role: "underwriter",
  }).returning();

  // Seed policies
  const [policy1] = await db.insert(policies).values({
    policyNumber: "SME-2024-0892",
    clientName: "ABC Bakery Ltd",
    policyType: "Business Insurance",
    premium: 2400.00,
    coverageAmount: 500000.00,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-12-31"),
    isActive: true,
    claimsHistory: [],
    riskProfile: "low",
    renewalDate: new Date("2024-12-01"),
  }).returning();

  const [policy2] = await db.insert(policies).values({
    policyNumber: "SME-2024-1234",
    clientName: "City Restaurant Group",
    policyType: "Restaurant Insurance",
    premium: 4800.00,
    coverageAmount: 750000.00,
    startDate: new Date("2024-03-01"),
    endDate: new Date("2025-02-28"),
    isActive: true,
    claimsHistory: [
      {
        id: 1,
        date: "2023-06-15",
        amount: 15000,
        type: "Fire damage",
        status: "Settled"
      }
    ],
    riskProfile: "medium",
    renewalDate: new Date("2025-01-01"),
  }).returning();

  // Seed underwriting rules
  await db.insert(underwritingRules).values([
    {
      ruleType: "renewal_discount",
      conditions: {
        yearsWithCompany: { min: 3 },
        claimsInPeriod: { max: 0, period: "3years" }
      },
      action: { type: "approve_discount", percentage: 5 },
      priority: 1,
      isActive: true,
      confidence: 0.9,
      source: "manual"
    },
    {
      ruleType: "coverage_increase",
      conditions: {
        riskProfile: "low",
        increasePercentage: { max: 25 }
      },
      action: { type: "auto_approve" },
      priority: 2,
      isActive: true,
      confidence: 0.85,
      source: "manual"
    },
    {
      ruleType: "escalation",
      conditions: {
        coverageAmount: { min: 800000 },
        hasRecentClaims: true
      },
      action: { type: "escalate_to_senior" },
      priority: 3,
      isActive: true,
      confidence: 0.95,
      source: "manual"
    }
  ]);

  // Seed sample chat messages
  const sessionId = `session_${Date.now()}`;
  await db.insert(chatMessages).values([
    {
      sessionId,
      brokerId: brokerUser.id,
      brokerName: brokerUser.name,
      sender: "broker",
      message: "Hi, I need to apply a 5% renewal discount for ABC Bakery, policy SME-2024-0892. They've been with us for 3 years with no claims.",
      messageType: "text",
      policyNumber: "SME-2024-0892",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      sessionId,
      brokerId: brokerUser.id,
      brokerName: brokerUser.name,
      sender: "ai",
      message: "I've reviewed ABC Bakery's policy (SME-2024-0892). They qualify for the 5% renewal discount based on:\n\n• 3+ years as a client with clean claims history\n• Low risk profile maintained\n• Policy in good standing\n\n**Decision: APPROVED** ✓\n\nThe 5% discount has been applied. New premium: £2,280 (reduced from £2,400).",
      messageType: "decision",
      policyNumber: "SME-2024-0892",
      timestamp: new Date(Date.now() - 280000), // 4 min 40 sec ago
      metadata: {
        decision: "approved",
        confidence: 0.95,
        factors: ["3+ year client", "No claims history", "Low risk profile"],
        responseTime: 1200
      }
    }
  ]);

  // Seed sample underwriting decision
  await db.insert(underwritingDecisions).values({
    policyId: policy1.id,
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    sessionId,
    requestType: "renewal_discount",
    requestDetails: {
      discountPercentage: 5,
      reason: "3+ year client with no claims",
      policyNumber: "SME-2024-0892"
    },
    decision: "approved",
    decisionReason: "Client meets criteria for 5% renewal discount: 3+ years with company, no claims in period",
    confidence: 0.95,
    processedBy: "AI",
    responseTime: 1200,
    rulesApplied: [{ ruleId: 1, ruleName: "renewal_discount", confidence: 0.9 }]
  });

  // Seed sample document
  await db.insert(documents).values({
    filename: "underwriting-guidelines-sample.txt",
    originalFilename: "Zurich_SME_Guidelines_2024.txt",
    fileType: "guideline",
    uploadedBy: brokerUser.id,
    brokerName: brokerUser.name,
    status: "completed",
    fileSize: 15000,
    contentHash: "abc123def456",
    extractedRules: [
      {
        type: "renewal_discount",
        confidence: 0.9,
        rule: "5% discount for 3+ year clients with no claims"
      },
      {
        type: "coverage_limit",
        confidence: 0.85,
        rule: "Restaurant maximum coverage £750k without risk assessment"
      }
    ]
  });

  // Seed analytics events
  const now = new Date();
  await db.insert(analyticsEvents).values([
    {
      eventType: "chat_message",
      brokerId: brokerUser.id,
      brokerName: brokerUser.name,
      sessionId,
      entityType: "chat",
      timestamp: new Date(now.getTime() - 300000),
      metadata: { messageType: "text" },
      duration: 0
    },
    {
      eventType: "decision_made",
      brokerId: brokerUser.id,
      brokerName: brokerUser.name,
      sessionId,
      entityType: "policy",
      entityId: policy1.id,
      timestamp: new Date(now.getTime() - 280000),
      metadata: { decision: "approved", confidence: 0.95 },
      duration: 1200
    },
    {
      eventType: "document_uploaded",
      brokerId: brokerUser.id,
      brokerName: brokerUser.name,
      entityType: "document",
      entityId: 1,
      timestamp: new Date(now.getTime() - 600000),
      metadata: { fileType: "guideline", status: "completed" },
      duration: 5000
    }
  ]);

  // Seed broker metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day
  
  await db.insert(brokerMetrics).values({
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    metricDate: today,
    totalChats: 5,
    totalDecisions: 4,
    avgResponseTime: 1350,
    avgConfidence: 0.92,
    successfulDecisions: 4,
    escalatedCases: 0,
    documentsUploaded: 1,
    activePolicies: 2
  });

  console.log("Database seeded successfully!");
}