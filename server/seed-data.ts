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
  const now = Date.now();
  
  const [brokerUser] = await db.insert(users).values({
    id: "broker1",
    username: "broker1",
    password: "password123",
    firstName: "Sarah",
    lastName: "Johnson",
    name: "Sarah Johnson",
    role: "broker",
    createdAt: now,
    updatedAt: now,
  }).returning();

  const [underwriterUser] = await db.insert(users).values({
    id: "underwriter1",
    username: "underwriter1",
    password: "password123",
    firstName: "Michael",
    lastName: "Chen",
    name: "Michael Chen",
    role: "underwriter",
    createdAt: now,
    updatedAt: now,
  }).returning();

  // Seed policies
  const [policy1] = await db.insert(policies).values({
    policyNumber: "SME-2024-0892",
    clientName: "ABC Bakery Ltd",
    policyType: "Business Insurance",
    premium: 2400.00,
    coverageAmount: 500000.00,
    startDate: new Date("2024-01-01").getTime(),
    endDate: new Date("2024-12-31").getTime(),
    isActive: true,
    claimsHistory: "[]",
    riskProfile: "low",
    renewalDate: new Date("2024-12-01").getTime(),
    createdAt: now,
  }).returning();

  const [policy2] = await db.insert(policies).values({
    policyNumber: "SME-2024-1234",
    clientName: "City Restaurant Group",
    policyType: "Restaurant Insurance",
    premium: 4800.00,
    coverageAmount: 750000.00,
    startDate: new Date("2024-03-01").getTime(),
    endDate: new Date("2025-02-28").getTime(),
    isActive: true,
    claimsHistory: JSON.stringify([
      {
        id: 1,
        date: "2023-06-15",
        amount: 15000,
        type: "Fire damage",
        status: "Settled"
      }
    ]),
    riskProfile: "medium",
    renewalDate: new Date("2025-01-01").getTime(),
    createdAt: now,
  }).returning();

  // Seed underwriting rules
  await db.insert(underwritingRules).values({
    ruleType: "renewal_discount",
    conditions: JSON.stringify({
      yearsWithCompany: { min: 3 },
      claimsInPeriod: { max: 0, period: "3years" }
    }),
    action: JSON.stringify({ type: "approve_discount", percentage: 5 }),
    confidence: 0.9,
    source: "manual",
    isActive: true,
    sourceDocumentId: null,
    createdAt: now
  });

  await db.insert(underwritingRules).values({
    ruleType: "coverage_increase",
    conditions: JSON.stringify({
      riskProfile: "low",
      increasePercentage: { max: 25 }
    }),
    action: JSON.stringify({ type: "auto_approve" }),
    confidence: 0.85,
    source: "manual",
    isActive: true,
    sourceDocumentId: null,
    createdAt: now
  });

  await db.insert(underwritingRules).values({
    ruleType: "escalation",
    conditions: JSON.stringify({
      coverageAmount: { min: 800000 },
      hasRecentClaims: true
    }),
    action: JSON.stringify({ type: "escalate_to_senior" }),
    confidence: 0.95,
    source: "manual",
    isActive: true,
    sourceDocumentId: null,
    createdAt: now
  });

  // Seed sample chat messages
  const sessionId = `session_${Date.now()}`;
  await db.insert(chatMessages).values({
    sessionId,
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    sender: "broker",
    message: "Hi, I need to apply a 5% renewal discount for ABC Bakery, policy SME-2024-0892. They've been with us for 3 years with no claims.",
    messageType: "text",
    policyNumber: "SME-2024-0892",
    timestamp: now - 300000, // 5 minutes ago
  });

  await db.insert(chatMessages).values({
    sessionId,
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    sender: "ai",
    message: "I've reviewed ABC Bakery's policy (SME-2024-0892). They qualify for the 5% renewal discount based on:\\n\\n• 3+ years as a client with clean claims history\\n• Low risk profile maintained\\n• Policy in good standing\\n\\n**Decision: APPROVED** ✓\\n\\nThe 5% discount has been applied. New premium: £2,280 (reduced from £2,400).",
    messageType: "decision",
    policyNumber: "SME-2024-0892",
    timestamp: now - 280000, // 4 min 40 sec ago
    metadata: JSON.stringify({
      decision: "approved",
      confidence: 0.95,
      factors: ["3+ year client", "No claims history", "Low risk profile"],
      responseTime: 1200
    })
  });

  // Seed sample underwriting decision
  await db.insert(underwritingDecisions).values({
    policyId: policy1.id,
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    sessionId,
    requestType: "renewal_discount",
    requestDetails: JSON.stringify({
      discountPercentage: 5,
      reason: "3+ year client with no claims",
      policyNumber: "SME-2024-0892"
    }),
    decision: "approved",
    decisionReason: "Client meets criteria for 5% renewal discount: 3+ years with company, no claims in period",
    confidence: 0.95,
    processedBy: "AI",
    timestamp: now - 280000,
    responseTime: 1200,
    rulesApplied: JSON.stringify([{ ruleId: 1, ruleName: "renewal_discount", confidence: 0.9 }])
  });

  // Seed sample document
  await db.insert(documents).values({
    filename: "underwriting-guidelines-sample.txt",
    originalFilename: "Zurich_SME_Guidelines_2024.txt",
    fileType: "guideline",
    uploadedBy: brokerUser.id,
    brokerName: brokerUser.name,
    uploadDate: now - 600000,
    processedDate: now - 500000,
    status: "completed",
    fileSize: 15000,
    contentHash: "abc123def456",
    isActive: true,
    extractedRules: JSON.stringify([
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
    ]),
    extractedData: "{}"
  });

  // Seed analytics events
  await db.insert(analyticsEvents).values({
    eventType: "chat_message",
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    sessionId,
    entityType: "chat",
    timestamp: now - 300000,
    metadata: JSON.stringify({ messageType: "text" }),
    duration: 0
  });

  await db.insert(analyticsEvents).values({
    eventType: "decision_made",
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    sessionId,
    entityType: "policy",
    entityId: policy1.id,
    timestamp: now - 280000,
    metadata: JSON.stringify({ decision: "approved", confidence: 0.95 }),
    duration: 1200
  });

  await db.insert(analyticsEvents).values({
    eventType: "document_uploaded",
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    entityType: "document",
    entityId: 1,
    timestamp: now - 600000,
    metadata: JSON.stringify({ fileType: "guideline", status: "completed" }),
    duration: 5000
  });

  // Seed broker metrics
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Start of day
  
  await db.insert(brokerMetrics).values({
    brokerId: brokerUser.id,
    brokerName: brokerUser.name,
    metricDate: today.getTime(),
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