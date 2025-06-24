import { db } from "./db";
import { 
  users, 
  policies, 
  underwritingRules, 
  chatMessages, 
  underwritingDecisions,
  documents 
} from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database with sample data...");

  // Clear existing data
  await db.delete(underwritingDecisions);
  await db.delete(chatMessages);
  await db.delete(documents);
  await db.delete(underwritingRules);
  await db.delete(policies);
  await db.delete(users);

  // Seed users
  const [brokerUser] = await db.insert(users).values({
    username: "broker1",
    email: "broker@zurich.com",
    fullName: "Sarah Johnson",
    role: "broker",
    isActive: true,
  }).returning();

  const [underwriterUser] = await db.insert(users).values({
    username: "underwriter1",
    email: "underwriter@zurich.com",
    fullName: "Michael Chen",
    role: "underwriter",
    isActive: true,
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
    riskProfile: "Low",
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
    riskProfile: "Medium",
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
      action: "approve_discount",
      priority: 1,
      isActive: true,
      description: "5% discount for 3+ year clients with no claims"
    },
    {
      ruleType: "coverage_increase",
      conditions: {
        riskProfile: "Low",
        increasePercentage: { max: 25 }
      },
      action: "auto_approve",
      priority: 2,
      isActive: true,
      description: "Auto-approve coverage increases up to 25% for low-risk clients"
    },
    {
      ruleType: "escalation",
      conditions: {
        coverageAmount: { min: 800000 },
        hasRecentClaims: true
      },
      action: "escalate_to_senior",
      priority: 3,
      isActive: true,
      description: "Escalate high coverage requests for clients with recent claims"
    }
  ]);

  // Seed sample chat messages
  const sessionId = `session_${Date.now()}`;
  await db.insert(chatMessages).values([
    {
      sessionId,
      sender: "broker",
      message: "Hi, I need to apply a 5% renewal discount for ABC Bakery, policy SME-2024-0892. They've been with us for 3 years with no claims.",
      messageType: "text",
      timestamp: new Date(Date.now() - 300000), // 5 minutes ago
    },
    {
      sessionId,
      sender: "ai",
      message: "I've reviewed ABC Bakery's policy (SME-2024-0892). They qualify for the 5% renewal discount based on:\n\n• 3+ years as a client with clean claims history\n• Low risk profile maintained\n• Policy in good standing\n\n**Decision: APPROVED** ✓\n\nThe 5% discount has been applied. New premium: £2,280 (reduced from £2,400).",
      messageType: "decision",
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
  });

  // Seed sample document
  await db.insert(documents).values({
    filename: "underwriting-guidelines-sample.txt",
    fileType: "guideline",
    status: "completed",
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

  console.log("Database seeded successfully!");
}