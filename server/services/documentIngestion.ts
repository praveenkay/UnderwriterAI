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

/**
 * Chat Session Ingestion for LLM Fine-tuning
 * Processes chat sessions to create training data and improve AI responses
 */

export interface ChatIngestionResult {
  sessionId: string;
  trainingExamples: number;
  qualityScore: number;
  processingTime: number;
  status: 'success' | 'partial' | 'failed';
  insights: string[];
  fineTuningData?: any[];
}

/**
 * Extracts rules from guideline document content.
 */
async function extractGuidelineRules(content: string): Promise<any[]> {
  const rules: any[] = [];

  // Extract discount rules
  const discountPatterns = [
    /discount\s+of\s+up\s+to\s+(\d+)%/gi,
    /maximum\s+discount\s+allowed\s+is\s+(\d+)%/gi,
    /up\s+to\s+(\d+)%\s+discount/gi
  ];

  for (const pattern of discountPatterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      rules.push({
        ruleType: "discount",
        conditions: { requestType: "discount" },
        action: { percentage: parseInt(match[1]) },
        confidence: 85,
        source: "guideline_document",
        description: match[0].trim()
      });
    }
  }

  // Extract coverage rules
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

/**
 * Chat Session Ingestion for LLM Fine-tuning
 * Processes chat sessions to create training data and improve AI responses
 */

export interface ChatIngestionResult {
  sessionId: string;
  trainingExamples: number;
  qualityScore: number;
  processingTime: number;
  status: 'success' | 'partial' | 'failed';
  insights: string[];
  fineTuningData?: any[];
}

export async function ingestChatSessionForFineTuning(sessionId: string): Promise<ChatIngestionResult> {
  const startTime = Date.now();
  
  try {
    console.log(`Starting chat ingestion for session: ${sessionId}`);
    
    // Get all messages from the session
    const messages = await storage.getChatMessagesBySession(sessionId);
    
    if (messages.length < 2) {
      return {
        sessionId,
        trainingExamples: 0,
        qualityScore: 0,
        processingTime: Date.now() - startTime,
        status: 'failed',
        insights: ['Insufficient messages for training data generation']
      };
    }

    // Process messages into training examples
    const trainingExamples = await generateTrainingExamples(messages);
    
    // Calculate quality score based on conversation characteristics
    const qualityScore = calculateConversationQuality(messages, trainingExamples);
    
    // Store training data for fine-tuning
    await storeFineTuningData(sessionId, trainingExamples);
    
    // Extract patterns and insights
    const insights = generateChatInsights(messages, trainingExamples);
    
    // Update session metadata with ingestion info
    await updateSessionIngestionMetadata(sessionId, {
      ingestedAt: new Date().toISOString(),
      trainingExamples: trainingExamples.length,
      qualityScore,
      status: 'ingested'
    });

    console.log(`Chat ingestion completed for session ${sessionId}: ${trainingExamples.length} training examples`);
    
    return {
      sessionId,
      trainingExamples: trainingExamples.length,
      qualityScore,
      processingTime: Date.now() - startTime,
      status: 'success',
      insights,
      fineTuningData: trainingExamples
    };
  } catch (error) {
    console.error(`Chat ingestion failed for session ${sessionId}:`, error);
    return {
      sessionId,
      trainingExamples: 0,
      qualityScore: 0,
      processingTime: Date.now() - startTime,
      status: 'failed',
      insights: [`Processing failed: ${(error as Error).message}`]
    };
  }
}

async function generateTrainingExamples(messages: any[]): Promise<any[]> {
  const trainingExamples: any[] = [];
  
  // Group messages into conversation pairs (user -> AI)
  for (let i = 0; i < messages.length - 1; i++) {
    const userMessage = messages[i];
    const aiMessage = messages[i + 1];
    
    // Only process broker -> AI pairs
    if (userMessage.sender === 'broker' && aiMessage.sender === 'ai') {
      const example = {
        id: `${userMessage.sessionId}_${userMessage.id}_${aiMessage.id}`,
        input: {
          message: userMessage.message,
          context: {
            sessionId: userMessage.sessionId,
            brokerName: userMessage.brokerName,
            timestamp: userMessage.timestamp,
            messageType: userMessage.messageType || 'text',
            attachments: userMessage.attachments ? JSON.parse(userMessage.attachments) : []
          }
        },
        output: {
          message: aiMessage.message,
          messageType: aiMessage.messageType || 'text',
          metadata: aiMessage.metadata ? JSON.parse(aiMessage.metadata) : {},
          confidence: aiMessage.metadata ? JSON.parse(aiMessage.metadata).confidence : null,
          decision: aiMessage.metadata ? JSON.parse(aiMessage.metadata).decision : null
        },
        quality_indicators: {
          response_length: aiMessage.message.length,
          contains_decision: aiMessage.messageType === 'decision',
          has_confidence_score: !!(aiMessage.metadata && JSON.parse(aiMessage.metadata).confidence),
          structured_response: aiMessage.message.includes('**') || aiMessage.message.includes('•'),
          policy_reference: /policy|pol[\s#]*[A-Z0-9-]+/i.test(userMessage.message)
        },
        training_category: categorizeTrainingExample(userMessage.message, aiMessage.message)
      };
      
      trainingExamples.push(example);
    }
  }
  
  return trainingExamples;
}

