import { storage } from "../storage";
import { extractRulesFromChatHistory } from "./openai";

export async function processDocument(documentId: number): Promise<void> {
  const document = await storage.getDocument(documentId);
  if (!document) {
    throw new Error("Document not found");
  }

  try {
    await storage.updateDocumentStatus(documentId, "processing");

    let extractedRules: any[] = [];

    switch (document.fileType) {
      case "chat_log":
        extractedRules = await processChatLog(document.content || "");
        break;
      case "guideline":
        extractedRules = await processGuidelineDocument(document.content || "");
        break;
      case "policy":
        extractedRules = await processPolicyDocument(document.content || "");
        break;
      default:
        throw new Error(`Unsupported file type: ${document.fileType}`);
    }

    // Save extracted rules to the rules engine
    for (const rule of extractedRules) {
      await storage.createUnderwritingRule({
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        action: rule.action,
        confidence: rule.confidence,
        source: `document_${documentId}`,
        isActive: true
      });
    }

    await storage.updateDocumentStatus(documentId, "completed", extractedRules);
  } catch (error) {
    console.error(`Document processing failed for ${documentId}:`, error);
    await storage.updateDocumentStatus(documentId, "failed");
    throw error;
  }
}

async function processChatLog(content: string): Promise<any[]> {
  // Split chat content into individual conversations
  const chatSessions = content.split(/\n(?=Broker:|Underwriter:|Agent:)/);
  const cleanedSessions = chatSessions
    .filter(session => session.trim().length > 50) // Filter out very short sessions
    .map(session => session.trim());

  if (cleanedSessions.length === 0) {
    return [];
  }

  return await extractRulesFromChatHistory(cleanedSessions);
}

async function processGuidelineDocument(content: string): Promise<any[]> {
  // For guidelines, we extract structured rules
  // This would be more sophisticated in a real implementation
  const rules: any[] = [];

  // Look for discount patterns
  const discountMatches = content.match(/(\d+)%?\s*(discount|reduction).+?(?:if|when|for)\s+(.+?)(?:\.|$)/gi);
  if (discountMatches) {
    for (const match of discountMatches) {
      const percentMatch = match.match(/(\d+)%/);
      const conditionMatch = match.match(/(?:if|when|for)\s+(.+?)(?:\.|$)/i);
      
      if (percentMatch && conditionMatch) {
        rules.push({
          ruleType: "discount",
          conditions: { description: conditionMatch[1].trim() },
          action: { discountType: "general", percentage: parseInt(percentMatch[1]) },
          confidence: 85,
          source: "guideline_document",
          description: match.trim()
        });
      }
    }
  }

  // Look for coverage limits
  const coverageMatches = content.match(/maximum.+?coverage.+?(\d+(?:,\d+)*)/gi);
  if (coverageMatches) {
    for (const match of coverageMatches) {
      const amountMatch = match.match(/(\d+(?:,\d+)*)/);
      if (amountMatch) {
        rules.push({
          ruleType: "coverage",
          conditions: { requestType: "coverage_increase" },
          action: { maxAmount: parseInt(amountMatch[1].replace(/,/g, "")) },
          confidence: 90,
          source: "guideline_document",
          description: match.trim()
        });
      }
    }
  }

  return rules;
}

async function processPolicyDocument(content: string): Promise<any[]> {
  // Extract policy-specific rules and terms
  const rules: any[] = [];

  // Look for exclusions
  const exclusionMatches = content.match(/excluded?.+?(?:\.|$)/gi);
  if (exclusionMatches) {
    for (const match of exclusionMatches) {
      rules.push({
        ruleType: "coverage",
        conditions: { hasExclusion: true },
        action: { exclude: true, reason: match.trim() },
        confidence: 95,
        source: "policy_document",
        description: `Exclusion: ${match.trim()}`
      });
    }
  }

  return rules;
}

export async function uploadAndProcessDocument(
  filename: string,
  fileType: string,
  content: string
): Promise<number> {
  const document = await storage.createDocument({
    filename,
    fileType,
    content,
    status: "pending"
  });

  // Process asynchronously
  processDocument(document.id).catch(error => {
    console.error(`Background processing failed for document ${document.id}:`, error);
  });

  return document.id;
}
