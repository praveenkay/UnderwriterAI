/**
 * Enhanced document ingestion service for the hackathon
 * Processes various document types and extracts underwriting rules
 */

import OpenAI from "openai";
import { storage } from "../storage";
import { InsertUnderwritingRule } from "@shared/schema";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface DocumentIngestionResult {
  documentId: number;
  extractedRules: number;
  processingTime: number;
  confidence: number;
  status: 'success' | 'partial' | 'failed';
  insights: string[];
  extractedData: {
    policies?: any[];
    quotes?: any[];
    guidelines?: any[];
    logs?: any[];
  };
}

export async function ingestDocument(
  content: string, 
  filename: string, 
  fileType: string,
  brokerId: string,
  brokerName: string
): Promise<DocumentIngestionResult> {
  const startTime = Date.now();
  
  try {
    // Create document record
    const document = await storage.createDocument({
      filename,
      originalFilename: filename,
      fileType,
      uploadedBy: brokerId,
      brokerName,
      content,
      status: "processing",
      extractedRules: [],
      extractedData: {},
      fileSize: content.length,
      contentHash: generateHash(content),
      isActive: true,
      filePath: null,
      mimeType: "text/plain"
    });

    let extractedRules: any[] = [];
    let extractedData: any = {};
    let insights: string[] = [];

    // Process based on file type
    switch (fileType) {
      case 'chat_log':
        const chatResult = await ingestChatLog(content, filename);
        extractedRules = chatResult.extractedRules;
        extractedData = chatResult.extractedData;
        insights = chatResult.insights;
        break;
      
      case 'guideline':
        const guidelineResult = await ingestGuidelineDocument(content, filename);
        extractedRules = guidelineResult.extractedRules;
        extractedData = guidelineResult.extractedData;
        insights = guidelineResult.insights;
        break;
      
      case 'policy':
        const policyResult = await ingestPolicyDocument(content, filename);
        extractedRules = policyResult.extractedRules;
        extractedData = policyResult.extractedData;
        insights = policyResult.insights;
        break;
      
      case 'quote':
        const quoteResult = await ingestQuoteDocument(content, filename);
        extractedRules = quoteResult.extractedRules;
        extractedData = quoteResult.extractedData;
        insights = quoteResult.insights;
        break;
      
      default:
        // Generic processing
        const genericResult = await ingestGenericDocument(content, filename);
        extractedRules = genericResult.extractedRules;
        extractedData = genericResult.extractedData;
        insights = genericResult.insights;
    }

    // Store extracted rules in database
    const storedRules: any[] = [];
    for (const rule of extractedRules) {
      try {
        const storedRule = await storage.createUnderwritingRule({
          ruleType: rule.ruleType,
          conditions: rule.conditions,
          action: rule.action,
          confidence: rule.confidence,
          source: "extracted_from_document",
          sourceDocumentId: document.id,
          isActive: true
        });
        storedRules.push(storedRule);
      } catch (error) {
        console.error("Failed to store rule:", error);
      }
    }

    // Update document status
    await storage.updateDocumentStatus(
      document.id, 
      "completed", 
      storedRules,
      extractedData
    );

    const processingTime = Date.now() - startTime;
    const avgConfidence = extractedRules.length > 0 
      ? extractedRules.reduce((sum, rule) => sum + rule.confidence, 0) / extractedRules.length 
      : 0;

    return {
      documentId: document.id,
      extractedRules: storedRules.length,
      processingTime,
      confidence: avgConfidence,
      status: storedRules.length > 0 ? 'success' : 'partial',
      insights,
      extractedData
    };

  } catch (error) {
    console.error("Document ingestion failed:", error);
    return {
      documentId: 0,
      extractedRules: 0,
      processingTime: Date.now() - startTime,
      confidence: 0,
      status: 'failed',
      insights: [`Failed to process document: ${error.message}`],
      extractedData: {}
    };
  }
}

async function ingestChatLog(content: string, filename: string) {
  const prompt = `
    Analyze this chat log from an insurance broker conversation and extract:
    1. Underwriting rules and decisions patterns
    2. Common client scenarios and responses
    3. Risk assessment criteria mentioned
    4. Pricing and discount patterns
    
    Return JSON with:
    {
      "extractedRules": [
        {
          "ruleType": "discount|coverage|risk_assessment",
          "conditions": {...},
          "action": {...},
          "confidence": 0.0-1.0,
          "description": "..."
        }
      ],
      "extractedData": {
        "conversations": [...],
        "decisions": [...],
        "commonScenarios": [...]
      },
      "insights": ["Key insight 1", "Key insight 2", ...]
    }
    
    Chat Log:
    ${content}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

async function ingestGuidelineDocument(content: string, filename: string) {
  const prompt = `
    Analyze this underwriting guidelines document and extract:
    1. Specific underwriting rules and criteria
    2. Risk assessment guidelines
    3. Approval/decline decision trees
    4. Pricing and premium calculation rules
    
    Return JSON with:
    {
      "extractedRules": [
        {
          "ruleType": "discount|coverage|risk_assessment|pricing",
          "conditions": {...},
          "action": {...},
          "confidence": 0.0-1.0,
          "description": "..."
        }
      ],
      "extractedData": {
        "guidelines": [...],
        "riskFactors": [...],
        "decisionCriteria": [...]
      },
      "insights": ["Key guideline 1", "Key guideline 2", ...]
    }
    
    Guidelines Document:
    ${content}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

async function ingestPolicyDocument(content: string, filename: string) {
  const prompt = `
    Analyze this insurance policy document and extract:
    1. Coverage details and limits
    2. Premium calculation factors
    3. Risk profile indicators
    4. Claims history patterns
    
    Return JSON with:
    {
      "extractedRules": [
        {
          "ruleType": "coverage|pricing|risk_assessment",
          "conditions": {...},
          "action": {...},
          "confidence": 0.0-1.0,
          "description": "..."
        }
      ],
      "extractedData": {
        "policies": [...],
        "coverageDetails": [...],
        "riskFactors": [...]
      },
      "insights": ["Policy insight 1", "Policy insight 2", ...]
    }
    
    Policy Document:
    ${content}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

async function ingestQuoteDocument(content: string, filename: string) {
  const prompt = `
    Analyze this insurance quote document and extract:
    1. Pricing rules and factors
    2. Discount criteria and calculations
    3. Risk assessment elements
    4. Coverage recommendations
    
    Return JSON with:
    {
      "extractedRules": [
        {
          "ruleType": "pricing|discount|coverage",
          "conditions": {...},
          "action": {...},
          "confidence": 0.0-1.0,
          "description": "..."
        }
      ],
      "extractedData": {
        "quotes": [...],
        "pricingFactors": [...],
        "discountCriteria": [...]
      },
      "insights": ["Quote insight 1", "Quote insight 2", ...]
    }
    
    Quote Document:
    ${content}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

async function ingestGenericDocument(content: string, filename: string) {
  const prompt = `
    Analyze this insurance-related document and extract any relevant:
    1. Business rules or policies
    2. Decision criteria
    3. Risk factors or guidelines
    4. Process instructions
    
    Return JSON with:
    {
      "extractedRules": [
        {
          "ruleType": "general|process|risk_assessment",
          "conditions": {...},
          "action": {...},
          "confidence": 0.0-1.0,
          "description": "..."
        }
      ],
      "extractedData": {
        "content": [...],
        "keyPoints": [...],
        "procedures": [...]
      },
      "insights": ["Document insight 1", "Document insight 2", ...]
    }
    
    Document Content:
    ${content}
  `;

  const response = await openai.chat.completions.create({
    model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });

  return JSON.parse(response.choices[0].message.content || "{}");
}

function generateHash(content: string): string {
  // Simple hash function - in production use crypto.createHash
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString();
}

export async function getIngestionMetrics() {
  const documents = await storage.getAllDocuments();
  const totalDocuments = documents.length;
  const processedDocuments = documents.filter(doc => doc.status === 'completed').length;
  const failedDocuments = documents.filter(doc => doc.status === 'failed').length;
  
  const extractedRulesCount = documents.reduce((sum, doc) => 
    sum + (Array.isArray(doc.extractedRules) ? doc.extractedRules.length : 0), 0);

  return {
    totalDocuments,
    processedDocuments,
    failedDocuments,
    extractedRulesCount,
    processingRate: totalDocuments > 0 ? (processedDocuments / totalDocuments) * 100 : 0
  };
}