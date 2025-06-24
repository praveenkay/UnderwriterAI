/**
 * Report Generation Service for PDF exports
 * Generates comprehensive reports for broker activity, chat history, and analytics
 */

import { storage } from "../storage";

export interface ReportGenerationOptions {
  brokerId: string;
  brokerName: string;
  reportType: 'chat_history' | 'activity_log' | 'performance_report' | 'full_report';
  startDate?: Date;
  endDate?: Date;
  sessionId?: string;
}

export async function generateReport(options: ReportGenerationOptions): Promise<string> {
  const { reportType, brokerId, brokerName, startDate, endDate, sessionId } = options;
  
  const reportData = await gatherReportData(options);
  
  switch (reportType) {
    case 'chat_history':
      return generateChatHistoryReport(reportData, options);
    case 'activity_log':
      return generateActivityLogReport(reportData, options);
    case 'performance_report':
      return generatePerformanceReport(reportData, options);
    case 'full_report':
      return generateFullReport(reportData, options);
    default:
      throw new Error(`Unknown report type: ${reportType}`);
  }
}

async function gatherReportData(options: ReportGenerationOptions) {
  const { brokerId, startDate, endDate, sessionId } = options;
  
  // Get chat messages
  let chatMessages;
  if (sessionId) {
    chatMessages = await storage.getChatMessagesBySession(sessionId);
  } else {
    chatMessages = await storage.getAllChatMessages();
    chatMessages = chatMessages.filter(msg => msg.brokerId === brokerId);
    
    if (startDate || endDate) {
      chatMessages = chatMessages.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        if (startDate && msgDate < startDate) return false;
        if (endDate && msgDate > endDate) return false;
        return true;
      });
    }
  }

  // Get analytics events
  const analyticsEvents = await storage.getAnalyticsEventsByBroker(brokerId, 1000);

  // Get underwriting decisions
  const decisions = await storage.getRecentDecisions(100);
  const brokerDecisions = decisions.filter(d => d.brokerId === brokerId);

  // Get documents
  const documents = await storage.getDocumentsByBroker(brokerId);

  // Get escalations
  const escalations = await storage.getPendingEscalations();
  const brokerEscalations = escalations.filter(e => e.brokerId === brokerId);

  // Get broker metrics
  const metrics = await storage.getBrokerMetrics(brokerId);

  return {
    chatMessages,
    analyticsEvents,
    decisions: brokerDecisions,
    documents,
    escalations: brokerEscalations,
    metrics
  };
}

function generateChatHistoryReport(data: any, options: ReportGenerationOptions): string {
  const { brokerName, sessionId } = options;
  const { chatMessages } = data;
  
  let report = `# Chat History Report\n\n`;
  report += `**Broker:** ${brokerName}\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n`;
  
  if (sessionId) {
    report += `**Session ID:** ${sessionId}\n`;
  }
  
  report += `**Total Messages:** ${chatMessages.length}\n\n`;
  
  // Group messages by session
  const sessionGroups = chatMessages.reduce((groups: any, msg: any) => {
    if (!groups[msg.sessionId]) {
      groups[msg.sessionId] = [];
    }
    groups[msg.sessionId].push(msg);
    return groups;
  }, {});

  Object.entries(sessionGroups).forEach(([sessionId, messages]: [string, any]) => {
    report += `## Session: ${sessionId}\n`;
    report += `**Messages:** ${messages.length}\n`;
    report += `**Start Time:** ${new Date(messages[0].timestamp).toLocaleString()}\n`;
    report += `**End Time:** ${new Date(messages[messages.length - 1].timestamp).toLocaleString()}\n\n`;
    
    messages.forEach((msg: any, index: number) => {
      report += `### Message ${index + 1}\n`;
      report += `**Sender:** ${msg.sender}\n`;
      report += `**Time:** ${new Date(msg.timestamp).toLocaleString()}\n`;
      report += `**Type:** ${msg.messageType}\n`;
      
      if (msg.policyNumber) {
        report += `**Policy:** ${msg.policyNumber}\n`;
      }
      
      report += `**Content:**\n${msg.message}\n\n`;
      
      if (msg.attachments && Array.isArray(msg.attachments) && msg.attachments.length > 0) {
        report += `**Attachments:** ${msg.attachments.length} file(s)\n`;
        msg.attachments.forEach((attachment: any, i: number) => {
          report += `- ${attachment.filename || `Attachment ${i + 1}`}\n`;
        });
        report += `\n`;
      }
      
      report += `---\n\n`;
    });
  });

  return report;
}

function generateActivityLogReport(data: any, options: ReportGenerationOptions): string {
  const { brokerName } = options;
  const { analyticsEvents, decisions, documents, escalations } = data;
  
  let report = `# Activity Log Report\n\n`;
  report += `**Broker:** ${brokerName}\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  // Recent Activity Summary
  report += `## Activity Summary\n`;
  report += `- **Analytics Events:** ${analyticsEvents.length}\n`;
  report += `- **Underwriting Decisions:** ${decisions.length}\n`;
  report += `- **Documents Uploaded:** ${documents.length}\n`;
  report += `- **Escalations Created:** ${escalations.length}\n\n`;
  
  // Underwriting Decisions
  if (decisions.length > 0) {
    report += `## Recent Underwriting Decisions\n\n`;
    decisions.forEach((decision: any, index: number) => {
      report += `### Decision ${index + 1}\n`;
      report += `**Time:** ${new Date(decision.timestamp).toLocaleString()}\n`;
      report += `**Request Type:** ${decision.requestType}\n`;
      report += `**Decision:** ${decision.decision}\n`;
      report += `**Confidence:** ${(decision.confidence * 100).toFixed(1)}%\n`;
      report += `**Reason:** ${decision.decisionReason}\n`;
      report += `**Response Time:** ${decision.responseTime}ms\n`;
      
      if (decision.sessionId) {
        report += `**Session:** ${decision.sessionId}\n`;
      }
      
      report += `**Details:** ${JSON.stringify(decision.requestDetails, null, 2)}\n\n`;
    });
  }
  
  // Document Uploads
  if (documents.length > 0) {
    report += `## Document Uploads\n\n`;
    documents.forEach((doc: any, index: number) => {
      report += `### Document ${index + 1}\n`;
      report += `**Filename:** ${doc.originalFilename}\n`;
      report += `**Type:** ${doc.fileType}\n`;
      report += `**Upload Date:** ${new Date(doc.uploadDate).toLocaleString()}\n`;
      report += `**Status:** ${doc.status}\n`;
      
      if (doc.processedDate) {
        report += `**Processed:** ${new Date(doc.processedDate).toLocaleString()}\n`;
      }
      
      if (doc.extractedRules && Array.isArray(doc.extractedRules)) {
        report += `**Extracted Rules:** ${doc.extractedRules.length}\n`;
      }
      
      report += `**File Size:** ${doc.fileSize ? (doc.fileSize / 1024).toFixed(1) + ' KB' : 'Unknown'}\n\n`;
    });
  }
  
  // Escalations
  if (escalations.length > 0) {
    report += `## Escalations\n\n`;
    escalations.forEach((escalation: any, index: number) => {
      report += `### Escalation ${index + 1}\n`;
      report += `**Created:** ${new Date(escalation.createdAt).toLocaleString()}\n`;
      report += `**Priority:** ${escalation.priority}\n`;
      report += `**Status:** ${escalation.status}\n`;
      report += `**Reason:** ${escalation.reason}\n`;
      
      if (escalation.assignedTo) {
        report += `**Assigned To:** ${escalation.assignedTo}\n`;
      }
      
      if (escalation.resolvedAt) {
        report += `**Resolved:** ${new Date(escalation.resolvedAt).toLocaleString()}\n`;
      }
      
      if (escalation.resolutionNotes) {
        report += `**Resolution Notes:** ${escalation.resolutionNotes}\n`;
      }
      
      report += `\n`;
    });
  }

  return report;
}

function generatePerformanceReport(data: any, options: ReportGenerationOptions): string {
  const { brokerName } = options;
  const { metrics, decisions, analyticsEvents, chatMessages } = data;
  
  let report = `# Performance Report\n\n`;
  report += `**Broker:** ${brokerName}\n`;
  report += `**Generated:** ${new Date().toLocaleString()}\n\n`;
  
  // Key Metrics
  if (metrics) {
    report += `## Key Performance Metrics\n`;
    report += `- **Total Chats:** ${metrics.totalChats}\n`;
    report += `- **Total Decisions:** ${metrics.totalDecisions}\n`;
    report += `- **Average Response Time:** ${metrics.avgResponseTime}ms\n`;
    report += `- **Average Confidence:** ${(metrics.avgConfidence * 100).toFixed(1)}%\n`;
    report += `- **Successful Decisions:** ${metrics.successfulDecisions}\n`;
    report += `- **Escalated Cases:** ${metrics.escalatedCases}\n`;
    report += `- **Documents Uploaded:** ${metrics.documentsUploaded}\n`;
    report += `- **Active Policies:** ${metrics.activePolicies}\n\n`;
  }
  
  // Decision Analysis
  if (decisions.length > 0) {
    const approvedCount = decisions.filter((d: any) => d.decision === 'approved').length;
    const declinedCount = decisions.filter((d: any) => d.decision === 'declined').length;
    const escalatedCount = decisions.filter((d: any) => d.decision === 'escalated').length;
    
    const avgConfidence = decisions.reduce((sum: number, d: any) => sum + d.confidence, 0) / decisions.length;
    const avgResponseTime = decisions.reduce((sum: number, d: any) => sum + d.responseTime, 0) / decisions.length;
    
    report += `## Decision Analysis\n`;
    report += `- **Total Decisions:** ${decisions.length}\n`;
    report += `- **Approved:** ${approvedCount} (${(approvedCount/decisions.length*100).toFixed(1)}%)\n`;
    report += `- **Declined:** ${declinedCount} (${(declinedCount/decisions.length*100).toFixed(1)}%)\n`;
    report += `- **Escalated:** ${escalatedCount} (${(escalatedCount/decisions.length*100).toFixed(1)}%)\n`;
    report += `- **Average Confidence:** ${(avgConfidence * 100).toFixed(1)}%\n`;
    report += `- **Average Response Time:** ${avgResponseTime.toFixed(0)}ms\n\n`;
  }
  
  // Chat Activity
  if (chatMessages.length > 0) {
    const sessions = [...new Set(chatMessages.map((msg: any) => msg.sessionId))];
    const avgMessagesPerSession = chatMessages.length / sessions.length;
    
    report += `## Chat Activity\n`;
    report += `- **Total Messages:** ${chatMessages.length}\n`;
    report += `- **Chat Sessions:** ${sessions.length}\n`;
    report += `- **Average Messages per Session:** ${avgMessagesPerSession.toFixed(1)}\n\n`;
  }

  return report;
}

function generateFullReport(data: any, options: ReportGenerationOptions): string {
  let report = `# Comprehensive Broker Report\n\n`;
  
  // Generate all sections
  report += generatePerformanceReport(data, options);
  report += `\n---\n\n`;
  report += generateActivityLogReport(data, options);
  report += `\n---\n\n`;
  report += generateChatHistoryReport(data, options);
  
  return report;
}

export async function exportChatSession(sessionId: string): Promise<string> {
  const messages = await storage.getChatMessagesBySession(sessionId);
  
  if (messages.length === 0) {
    throw new Error(`No messages found for session: ${sessionId}`);
  }
  
  const brokerName = messages[0].brokerName || 'Unknown Broker';
  
  return generateChatHistoryReport(
    { chatMessages: messages },
    {
      brokerId: messages[0].brokerId || '',
      brokerName,
      reportType: 'chat_history',
      sessionId
    }
  );
}