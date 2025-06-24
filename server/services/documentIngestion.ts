import { storage } from "../storage";
import { extractRulesFromChatHistory } from "./openai";

/**
 * Enhanced document ingestion service for the hackathon
 * Processes various document types and extracts underwriting rules
 */

export interface DocumentIngestionResult {
  documentId: number;
  extractedRules: number;
  processingTime: number;
  confidence: number;
  status: 'success' | 'partial' | 'failed';
  insights: string[];
}

export async function ingestChatLog(content: string, filename: string): Promise<DocumentIngestionResult> {
  const startTime = Date.now();
  
  try {
    // Create document record
    const document = await storage.createDocument({
      filename,
      fileType: "chat_log",
      content,
      status: "processing"
    });

    // Parse chat conversations
    const conversations = parseChatConversations(content);
    
    // Extract rules using AI
    const extractedRules = await extractRulesFromChatHistory(conversations);
    
    // Store rules in the rules engine
    const storedRules = [];
    for (const rule of extractedRules) {
      const storedRule = await storage.createUnderwritingRule({
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        action: rule.action,
        confidence: rule.confidence,
        source: `chat_log_${document.id}`,
        isActive: true
      });
      storedRules.push(storedRule);
    }

    // Update document status
    await storage.updateDocumentStatus(document.id, "completed", extractedRules);

    const processingTime = Date.now() - startTime;
    
    return {
      documentId: document.id,
      extractedRules: storedRules.length,
      processingTime,
      confidence: calculateAverageConfidence(extractedRules),
      status: 'success',
      insights: generateInsights(conversations, extractedRules)
    };
  } catch (error) {
    console.error("Chat log ingestion failed:", error);
    return {
      documentId: 0,
      extractedRules: 0,
      processingTime: Date.now() - startTime,
      confidence: 0,
      status: 'failed',
      insights: [`Processing failed: ${(error as Error).message}`]
    };
  }
}

export async function ingestGuidelineDocument(content: string, filename: string): Promise<DocumentIngestionResult> {
  const startTime = Date.now();
  
  try {
    const document = await storage.createDocument({
      filename,
      fileType: "guideline",
      content,
      status: "processing"
    });

    // Extract structured rules from guidelines
    const extractedRules = await extractGuidelineRules(content);
    
    // Store rules
    const storedRules = [];
    for (const rule of extractedRules) {
      const storedRule = await storage.createUnderwritingRule({
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        action: rule.action,
        confidence: rule.confidence,
        source: `guideline_${document.id}`,
        isActive: true
      });
      storedRules.push(storedRule);
    }

    await storage.updateDocumentStatus(document.id, "completed", extractedRules);

    const processingTime = Date.now() - startTime;
    
    return {
      documentId: document.id,
      extractedRules: storedRules.length,
      processingTime,
      confidence: calculateAverageConfidence(extractedRules),
      status: 'success',
      insights: generateGuidelineInsights(extractedRules)
    };
  } catch (error) {
    console.error("Guideline ingestion failed:", error);
    return {
      documentId: 0,
      extractedRules: 0,
      processingTime: Date.now() - startTime,
      confidence: 0,
      status: 'failed',
      insights: [`Processing failed: ${(error as Error).message}`]
    };
  }
}

function parseChatConversations(content: string): string[] {
  // Enhanced parsing for various chat formats
  const conversationMarkers = [
    /^Broker:/m,
    /^Agent:/m,
    /^Underwriter:/m,
    /^\[.*?\]\s*[A-Za-z]+:/m,
    /^\d{4}-\d{2}-\d{2}.*?:/m
  ];

  let conversations: string[] = [];
  
  // Try different parsing strategies
  for (const marker of conversationMarkers) {
    const matches = content.split(marker);
    if (matches.length > 1) {
      conversations = matches
        .filter(conv => conv.trim().length > 100)
        .map(conv => conv.trim())
        .slice(0, 50); // Limit for performance
      break;
    }
  }

  // Fallback: split by double newlines
  if (conversations.length === 0) {
    conversations = content
      .split(/\n\s*\n/)
      .filter(conv => conv.trim().length > 100)
      .slice(0, 30);
  }

  return conversations;
}

async function extractGuidelineRules(content: string): Promise<any[]> {
  const rules: any[] = [];

  // Extract discount rules
  const discountPatterns = [
    /(\d+)%?\s*discount.+?(?:for|when|if)\s+(.+?)(?:\.|$|;)/gi,
    /discount\s+of\s+up\s+to\s+(\d+)%.+?(?:for|when|if)\s+(.+?)(?:\.|$|;)/gi,
    /maximum\s+discount\s+(\d+)%.+?(?:for|when|if)\s+(.+?)(?:\.|$|;)/gi
  ];

  for (const pattern of discountPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      rules.push({
        ruleType: "discount",
        conditions: { description: match[2]?.trim() || "General conditions" },
        action: { discountType: "percentage", percentage: parseInt(match[1]) },
        confidence: 85,
        source: "guideline_document",
        description: match[0].trim()
      });
    }
  }

  // Extract coverage limits
  const coveragePatterns = [
    /maximum\s+(?:coverage|limit)\s+(?:of\s+)?[\$£€]?([\d,]+)/gi,
    /coverage\s+limit\s+[\$£€]?([\d,]+)/gi,
    /up\s+to\s+[\$£€]?([\d,]+)\s+(?:coverage|protection)/gi
  ];

  for (const pattern of coveragePatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const amount = parseInt(match[1].replace(/,/g, ''));
      rules.push({
        ruleType: "coverage",
        conditions: { requestType: "coverage_increase" },
        action: { maxAmount: amount },
        confidence: 90,
        source: "guideline_document",
        description: match[0].trim()
      });
    }
  }

  // Extract risk assessment rules
  const riskPatterns = [
    /(?:high|elevated)\s+risk.+?(?:for|when|if)\s+(.+?)(?:\.|$|;)/gi,
    /requires?\s+(?:manual\s+)?(?:review|approval).+?(?:for|when|if)\s+(.+?)(?:\.|$|;)/gi,
    /escalate.+?(?:for|when|if)\s+(.+?)(?:\.|$|;)/gi
  ];

  for (const pattern of riskPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      rules.push({
        ruleType: "risk_assessment",
        conditions: { description: match[1]?.trim() || "High risk factors" },
        action: { escalate: true, reason: "Risk assessment required" },
        confidence: 88,
        source: "guideline_document",
        description: match[0].trim()
      });
    }
  }

  return rules;
}

function calculateAverageConfidence(rules: any[]): number {
  if (rules.length === 0) return 0;
  const total = rules.reduce((sum, rule) => sum + (rule.confidence || 0), 0);
  return Math.round(total / rules.length);
}

function generateInsights(conversations: string[], extractedRules: any[]): string[] {
  const insights: string[] = [];
  
  insights.push(`Processed ${conversations.length} conversation segments`);
  insights.push(`Extracted ${extractedRules.length} underwriting rules`);
  
  const ruleTypes = extractedRules.reduce((acc, rule) => {
    acc[rule.ruleType] = (acc[rule.ruleType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  Object.entries(ruleTypes).forEach(([type, count]) => {
    insights.push(`${count} ${type} rules identified`);
  });

  if (extractedRules.length > 10) {
    insights.push("High rule density detected - comprehensive guidelines");
  }

  return insights;
}

function generateGuidelineInsights(extractedRules: any[]): string[] {
  const insights: string[] = [];
  
  insights.push(`Extracted ${extractedRules.length} structured rules`);
  
  const discountRules = extractedRules.filter(r => r.ruleType === "discount");
  const coverageRules = extractedRules.filter(r => r.ruleType === "coverage");
  const riskRules = extractedRules.filter(r => r.ruleType === "risk_assessment");

  if (discountRules.length > 0) {
    const maxDiscount = Math.max(...discountRules.map(r => r.action.percentage || 0));
    insights.push(`Maximum discount allowance: ${maxDiscount}%`);
  }

  if (coverageRules.length > 0) {
    const maxCoverage = Math.max(...coverageRules.map(r => r.action.maxAmount || 0));
    insights.push(`Maximum coverage limit: £${maxCoverage.toLocaleString()}`);
  }

  if (riskRules.length > 0) {
    insights.push(`${riskRules.length} risk escalation triggers defined`);
  }

  return insights;
}

export async function getIngestionMetrics() {
  const documents = await storage.getAllDocuments();
  const completedDocs = documents.filter(d => d.status === "completed");
  const totalRules = completedDocs.reduce((sum, doc) => sum + doc.extractedRules.length, 0);
  
  return {
    totalDocuments: documents.length,
    completedDocuments: completedDocs.length,
    totalExtractedRules: totalRules,
    averageRulesPerDocument: completedDocs.length > 0 ? Math.round(totalRules / completedDocs.length) : 0,
    processingSuccessRate: documents.length > 0 ? Math.round((completedDocs.length / documents.length) * 100) : 0
  };
}