import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { storage } from '../storage';

export interface ReportData {
  title: string;
  dateRange: { start: Date; end: Date };
  brokerId: string;
  brokerName: string;
  chatSessions?: any[];
  decisions?: any[];
  documents?: any[];
  analytics?: any;
}

export async function generateChatHistoryPDF(sessionId: string, brokerId: string): Promise<Buffer> {
  const messages = await storage.getChatMessagesBySession(sessionId);
  const broker = await storage.getUser(brokerId);
  
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Chat History Report', { align: 'center' });
    doc.moveDown();
    
    // Session Info
    doc.fontSize(14).text(`Session ID: ${sessionId}`);
    doc.text(`Broker: ${broker?.name || 'Unknown'}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.text(`Total Messages: ${messages.length}`);
    doc.moveDown();

    // Messages
    messages.forEach((message, index) => {
      const timestamp = new Date(message.timestamp).toLocaleString();
      const sender = message.sender.toUpperCase();
      
      doc.fontSize(12)
         .fillColor('#333333')
         .text(`${index + 1}. [${timestamp}] ${sender}:`, { continued: false });
      
      doc.fontSize(11)
         .fillColor('#000000')
         .text(message.message, { indent: 20 });
      
      if (message.attachments && Array.isArray(message.attachments) && message.attachments.length > 0) {
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Attachments: ${message.attachments.length} file(s)`, { indent: 20 });
      }
      
      doc.moveDown(0.5);
      
      // Add page break if needed
      if (doc.y > 700) {
        doc.addPage();
      }
    });

    doc.end();
  });
}

export async function generateBrokerReportPDF(reportData: ReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text(reportData.title, { align: 'center' });
    doc.moveDown();
    
    // Report Info
    doc.fontSize(14).text(`Broker: ${reportData.brokerName}`);
    doc.text(`Period: ${reportData.dateRange.start.toLocaleDateString()} - ${reportData.dateRange.end.toLocaleDateString()}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Analytics Summary
    if (reportData.analytics) {
      doc.fontSize(16).text('Performance Summary', { underline: true });
      doc.moveDown();
      
      const analytics = reportData.analytics;
      doc.fontSize(12)
         .text(`Total Chat Sessions: ${analytics.totalChats || 0}`)
         .text(`Total Decisions Made: ${analytics.totalDecisions || 0}`)
         .text(`Average Response Time: ${analytics.avgResponseTime || 0}ms`)
         .text(`Average Confidence: ${((analytics.avgConfidence || 0) * 100).toFixed(1)}%`)
         .text(`Successful Decisions: ${analytics.successfulDecisions || 0}`)
         .text(`Escalated Cases: ${analytics.escalatedCases || 0}`)
         .text(`Documents Uploaded: ${analytics.documentsUploaded || 0}`);
      
      doc.moveDown();
    }

    // Recent Decisions
    if (reportData.decisions && reportData.decisions.length > 0) {
      doc.fontSize(16).text('Recent Decisions', { underline: true });
      doc.moveDown();
      
      reportData.decisions.slice(0, 10).forEach((decision, index) => {
        const timestamp = new Date(decision.timestamp).toLocaleString();
        
        doc.fontSize(12)
           .text(`${index + 1}. ${decision.requestType.toUpperCase()} - ${decision.decision.toUpperCase()}`);
        
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Time: ${timestamp} | Confidence: ${(decision.confidence * 100).toFixed(1)}%`)
           .text(`Reason: ${decision.decisionReason}`)
           .fillColor('#000000');
        
        doc.moveDown(0.5);
      });
      
      doc.moveDown();
    }

    // Document Processing
    if (reportData.documents && reportData.documents.length > 0) {
      if (doc.y > 600) doc.addPage();
      
      doc.fontSize(16).text('Processed Documents', { underline: true });
      doc.moveDown();
      
      reportData.documents.forEach((document, index) => {
        const uploadDate = new Date(document.uploadDate).toLocaleString();
        
        doc.fontSize(12)
           .text(`${index + 1}. ${document.originalFilename}`);
        
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Type: ${document.fileType} | Status: ${document.status} | Size: ${formatBytes(document.fileSize)}`)
           .text(`Uploaded: ${uploadDate}`)
           .text(`Rules Extracted: ${Array.isArray(document.extractedRules) ? document.extractedRules.length : 0}`)
           .fillColor('#000000');
        
        doc.moveDown(0.5);
      });
    }

    // Chat Sessions Summary
    if (reportData.chatSessions && reportData.chatSessions.length > 0) {
      if (doc.y > 600) doc.addPage();
      
      doc.fontSize(16).text('Chat Sessions', { underline: true });
      doc.moveDown();
      
      reportData.chatSessions.slice(0, 10).forEach((session, index) => {
        doc.fontSize(12)
           .text(`${index + 1}. Session ${session.sessionId}`);
        
        doc.fontSize(10)
           .fillColor('#666666')
           .text(`Messages: ${session.messageCount} | Last Activity: ${new Date(session.lastActivity).toLocaleString()}`)
           .text(`Topics: ${session.topics.join(', ')}`)
           .fillColor('#000000');
        
        doc.moveDown(0.5);
      });
    }

    // Footer
    doc.fontSize(8)
       .fillColor('#888888')
       .text('Generated by UnderwriterAI - Intelligent Underwriting Assistant', { align: 'center' });

    doc.end();
  });
}

export async function generateDocumentListPDF(documents: any[], brokerName: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks: Buffer[] = [];
    
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Header
    doc.fontSize(20).text('Document Library Report', { align: 'center' });
    doc.moveDown();
    
    // Report Info
    doc.fontSize(14).text(`Broker: ${brokerName}`);
    doc.text(`Total Documents: ${documents.length}`);
    doc.text(`Generated: ${new Date().toLocaleString()}`);
    doc.moveDown();

    // Documents
    documents.forEach((document, index) => {
      const uploadDate = new Date(document.uploadDate).toLocaleString();
      const processedDate = document.processedDate 
        ? new Date(document.processedDate).toLocaleString() 
        : 'Not processed';
      
      doc.fontSize(12)
         .text(`${index + 1}. ${document.originalFilename}`);
      
      doc.fontSize(10)
         .fillColor('#666666')
         .text(`Type: ${document.fileType} | Status: ${document.status}`)
         .text(`Size: ${formatBytes(document.fileSize)} | Hash: ${document.contentHash?.substring(0, 8)}...`)
         .text(`Uploaded: ${uploadDate}`)
         .text(`Processed: ${processedDate}`)
         .text(`Rules Extracted: ${Array.isArray(document.extractedRules) ? document.extractedRules.length : 0}`)
         .fillColor('#000000');
      
      if (document.extractedRules && Array.isArray(document.extractedRules) && document.extractedRules.length > 0) {
        doc.fontSize(9)
           .fillColor('#444444')
           .text('Sample Rules:', { indent: 20 });
        
        document.extractedRules.slice(0, 3).forEach((rule: any, ruleIndex: number) => {
          doc.text(`• ${rule.description || rule.ruleType}: ${rule.action?.type || 'Unknown action'}`, { indent: 30 });
        });
        
        doc.fillColor('#000000');
      }
      
      doc.moveDown();
      
      // Add page break if needed
      if (doc.y > 650) {
        doc.addPage();
      }
    });

    doc.end();
  });
}

function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}