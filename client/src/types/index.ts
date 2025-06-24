export interface ChatMessage {
  id: number;
  sessionId: string;
  sender: 'broker' | 'ai' | 'underwriter';
  message: string;
  timestamp: Date;
  messageType: 'text' | 'decision' | 'escalation';
  metadata?: {
    decision?: string;
    confidence?: number;
    factors?: string[];
    responseTime?: number;
  };
}

export interface Policy {
  id: number;
  policyNumber: string;
  clientName: string;
  policyType: string;
  premium: number;
  coverageAmount: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  claimsHistory: any[];
  riskProfile: string;
  renewalDate?: Date;
}

export interface UnderwritingDecision {
  id: number;
  policyId?: number;
  requestType: string;
  requestDetails: any;
  decision: string;
  decisionReason: string;
  confidence: number;
  processedBy: string;
  timestamp: Date;
  responseTime: number;
}

export interface Document {
  id: number;
  filename: string;
  fileType: string;
  uploadDate: Date;
  processedDate?: Date;
  status: string;
  extractedRules: any[];
}

export interface Escalation {
  id: number;
  chatMessageId?: number;
  reason: string;
  priority: string;
  assignedTo?: string;
  status: string;
  createdAt: Date;
  resolvedAt?: Date;
}

export interface Metrics {
  totalPolicies: number;
  totalRules: number;
  automationRate: number;
  avgResponseTime: number;
  avgConfidence: number;
  totalDecisions: number;
  pendingEscalations: number;
  brokerSatisfaction: number;
}
