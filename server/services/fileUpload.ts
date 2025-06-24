import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { aiService } from './aiProvider';
import { storage } from '../storage';

const uploadDir = './uploads';

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storageConfig = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
    'text/plain',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/csv',
    'application/json'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only TXT, PDF, DOC, DOCX, CSV, and JSON files are allowed.'), false);
  }
};

export const upload = multer({
  storage: storageConfig,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});

export interface FileProcessingResult {
  documentId: number;
  extractedRules: number;
  processingTime: number;
  confidence: number;
  status: 'success' | 'partial' | 'failed';
  insights: string[];
}

export async function processUploadedFile(
  file: Express.Multer.File,
  brokerId: string,
  brokerName: string,
  fileType: string
): Promise<FileProcessingResult> {
  const startTime = Date.now();
  
  try {
    // Read file content
    const content = await readFileContent(file);
    
    // Generate content hash for deduplication
    const contentHash = crypto.createHash('md5').update(content).digest('hex');
    
    // Create document record
    const document = await storage.createDocument({
      filename: file.filename,
      originalFilename: file.originalname,
      fileType,
      uploadedBy: brokerId,
      brokerName,
      status: 'processing',
      content,
      fileSize: file.size,
      contentHash,
      filePath: file.path,
      mimeType: file.mimetype,
      extractedRules: [],
      extractedData: {}
    });

    // Extract rules using AI
    const extractedRules = await aiService.extractDocumentRules(content, fileType);
    
    // Store extracted rules in database
    const rulePromises = extractedRules.map(rule => 
      storage.createUnderwritingRule({
        ruleType: rule.ruleType,
        conditions: rule.conditions,
        action: rule.action,
        confidence: rule.confidence,
        source: `extracted_from_${fileType}`,
        sourceDocumentId: document.id
      })
    );
    
    await Promise.all(rulePromises);
    
    // Update document status
    await storage.updateDocumentStatus(document.id, 'completed', extractedRules);
    
    const processingTime = Date.now() - startTime;
    const avgConfidence = extractedRules.length > 0 
      ? extractedRules.reduce((sum, rule) => sum + rule.confidence, 0) / extractedRules.length
      : 0;

    const insights = generateInsights(fileType, extractedRules, content);

    return {
      documentId: document.id,
      extractedRules: extractedRules.length,
      processingTime,
      confidence: avgConfidence,
      status: extractedRules.length > 0 ? 'success' : 'partial',
      insights
    };

  } catch (error) {
    console.error('Error processing file:', error);
    
    // Update document status to failed if document was created
    try {
      const document = await storage.createDocument({
        filename: file.filename,
        originalFilename: file.originalname,
        fileType,
        uploadedBy: brokerId,
        brokerName,
        status: 'failed',
        content: '',
        fileSize: file.size,
        contentHash: '',
        filePath: file.path,
        mimeType: file.mimetype,
        extractedRules: [],
        extractedData: { error: error.message }
      });
    } catch (dbError) {
      console.error('Error creating failed document record:', dbError);
    }

    return {
      documentId: 0,
      extractedRules: 0,
      processingTime: Date.now() - startTime,
      confidence: 0,
      status: 'failed',
      insights: [`Processing failed: ${error.message}`]
    };
  }
}

async function readFileContent(file: Express.Multer.File): Promise<string> {
  const ext = path.extname(file.originalname).toLowerCase();
  
  switch (ext) {
    case '.txt':
    case '.csv':
    case '.json':
      return fs.readFileSync(file.path, 'utf-8');
    
    case '.pdf':
      // For PDF files, we'd need a PDF parser like pdf-parse
      // For now, return a placeholder - in production you'd implement PDF parsing
      return `PDF file: ${file.originalname} - Content extraction would require PDF parsing library`;
    
    case '.doc':
    case '.docx':
      // For Word documents, we'd need a library like mammoth
      // For now, return a placeholder - in production you'd implement Word parsing
      return `Word document: ${file.originalname} - Content extraction would require Word parsing library`;
    
    default:
      return fs.readFileSync(file.path, 'utf-8');
  }
}

function generateInsights(fileType: string, extractedRules: any[], content: string): string[] {
  const insights: string[] = [];
  
  if (extractedRules.length > 0) {
    insights.push(`Successfully extracted ${extractedRules.length} underwriting rules`);
    
    const ruleTypes = extractedRules.map(r => r.ruleType);
    const uniqueTypes = [...new Set(ruleTypes)];
    insights.push(`Rule types found: ${uniqueTypes.join(', ')}`);
    
    const highConfidenceRules = extractedRules.filter(r => r.confidence > 0.8);
    if (highConfidenceRules.length > 0) {
      insights.push(`${highConfidenceRules.length} high-confidence rules identified`);
    }
  }
  
  switch (fileType) {
    case 'chat_log':
      insights.push('Chat log processed for conversation patterns and decision history');
      break;
    case 'guideline':
      insights.push('Guideline document analyzed for policy rules and procedures');
      break;
    case 'policy':
      insights.push('Policy document processed for coverage terms and conditions');
      break;
    case 'quote':
      insights.push('Quote document analyzed for pricing and risk factors');
      break;
  }
  
  if (content.length > 10000) {
    insights.push('Large document processed successfully');
  }
  
  return insights;
}

export async function deleteUploadedFile(filePath: string): Promise<void> {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
}