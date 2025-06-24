import { storage } from "../storage";
import { processUnderwritingDecision, type UnderwritingDecisionRequest } from "./openai";

export interface RuleEngineResult {
  decision: "approved" | "declined" | "escalated";
  reason: string;
  confidence: number;
  factors: string[];
  matchedRules: any[];
  escalationReason?: string;
}

export async function evaluateUnderwritingRequest(
  request: UnderwritingDecisionRequest
): Promise<RuleEngineResult> {
  // Get active rules from storage
  const allRules = await storage.getActiveRules();
  const relevantRules = allRules.filter(rule => 
    rule.ruleType === request.requestType || 
    rule.ruleType === "risk_assessment" ||
    rule.ruleType === "escalation"
  );

  // Get policy data if policy number provided
  let policyData = null;
  if (request.policyNumber) {
    policyData = await storage.getPolicyByNumber(request.policyNumber);
  }

  // Apply rule-based logic first
  const ruleBasedResult = await applyRuleBasedLogic(request, relevantRules, policyData);
  
  // If rule-based logic doesn't provide a clear decision, use AI
  if (ruleBasedResult.confidence < 80) {
    const aiResult = await processUnderwritingDecision(
      { ...request, policyData },
      relevantRules
    );
    
    return {
      decision: aiResult.decision,
      reason: aiResult.reason,
      confidence: aiResult.confidence,
      factors: aiResult.factors,
      matchedRules: ruleBasedResult.matchedRules,
      escalationReason: aiResult.escalationReason
    };
  }

  return ruleBasedResult;
}

async function applyRuleBasedLogic(
  request: UnderwritingDecisionRequest,
  rules: any[],
  policyData: any
): Promise<RuleEngineResult> {
  const matchedRules: any[] = [];
  let decision: "approved" | "declined" | "escalated" = "approved";
  let reason = "Request meets standard criteria";
  let confidence = 60;
  let factors: string[] = [];

  // Check for automatic escalation rules
  for (const rule of rules) {
    if (rule.ruleType === "escalation" && evaluateRuleConditions(rule.conditions, request, policyData)) {
      matchedRules.push(rule);
      decision = "escalated";
      reason = rule.action.reason || "Request requires human review";
      confidence = rule.confidence;
      factors.push("Automatic escalation rule matched");
      
      return {
        decision,
        reason,
        confidence,
        factors,
        matchedRules,
        escalationReason: reason
      };
    }
  }

  // Check discount rules
  if (request.requestType === "discount") {
    for (const rule of rules) {
      if (rule.ruleType === "discount" && evaluateRuleConditions(rule.conditions, request, policyData)) {
        matchedRules.push(rule);
        
        // Check if requested discount is within allowed range
        const requestedPercentage = request.requestDetails.percentage || 0;
        const maxAllowed = rule.action.percentage || 0;
        
        if (requestedPercentage <= maxAllowed) {
          decision = "approved";
          reason = `${requestedPercentage}% discount approved based on rule: ${rule.ruleType}`;
          confidence = rule.confidence;
          factors.push(`Clean claims history: ${policyData?.claimsHistory?.length === 0 ? 'Yes' : 'No'}`);
          factors.push(`Renewal status: ${policyData?.isActive ? 'Active' : 'Inactive'}`);
        } else {
          decision = "declined";
          reason = `Requested discount ${requestedPercentage}% exceeds maximum allowed ${maxAllowed}%`;
          confidence = 90;
          factors.push(`Maximum discount allowed: ${maxAllowed}%`);
        }
        break;
      }
    }
  }

  // Check coverage rules
  if (request.requestType === "coverage_change") {
    for (const rule of rules) {
      if (rule.ruleType === "coverage" && evaluateRuleConditions(rule.conditions, request, policyData)) {
        matchedRules.push(rule);
        
        const requestedAmount = request.requestDetails.newCoverageAmount || 0;
        const maxAllowed = rule.action.maxAmount || Infinity;
        
        if (requestedAmount <= maxAllowed) {
          decision = "approved";
          reason = `Coverage change approved within limits`;
          confidence = rule.confidence;
          factors.push(`New coverage amount: ${requestedAmount}`);
          factors.push(`Maximum allowed: ${maxAllowed}`);
        } else {
          decision = "declined";
          reason = `Requested coverage exceeds maximum limit`;
          confidence = 90;
          factors.push(`Exceeds maximum limit by: ${requestedAmount - maxAllowed}`);
        }
        break;
      }
    }
  }

  // Risk assessment
  if (policyData?.riskProfile === "high" || (policyData?.claimsHistory?.length || 0) > 0) {
    factors.push(`Risk profile: ${policyData?.riskProfile || 'unknown'}`);
    factors.push(`Claims history: ${policyData?.claimsHistory?.length || 0} claims`);
    
    if (policyData?.riskProfile === "high" && decision === "approved") {
      decision = "escalated";
      reason = "High risk profile requires manual review";
      confidence = 85;
    }
  }

  return {
    decision,
    reason,
    confidence,
    factors,
    matchedRules
  };
}

function evaluateRuleConditions(conditions: any, request: UnderwritingDecisionRequest, policyData: any): boolean {
  // Simple rule condition evaluation
  if (conditions.claimsHistory === "none_3_years") {
    return (policyData?.claimsHistory?.length || 0) === 0;
  }
  
  if (conditions.renewalStatus === "active") {
    return policyData?.isActive === true;
  }
  
  if (conditions.previousClaims && policyData?.claimsHistory) {
    return policyData.claimsHistory.some((claim: any) => 
      claim.type === conditions.previousClaims
    );
  }
  
  if (conditions.businessType && policyData?.policyType) {
    return policyData.policyType.toLowerCase().includes(conditions.businessType.toLowerCase());
  }
  
  return true; // Default to true for unknown conditions
}

export async function getEngineMetrics() {
  const totalRules = (await storage.getActiveRules()).length;
  const recentDecisions = await storage.getRecentDecisions(100);
  
  const automationRate = recentDecisions.filter(d => d.processedBy === "ai").length / Math.max(recentDecisions.length, 1);
  const avgResponseTime = recentDecisions.reduce((sum, d) => sum + d.responseTime, 0) / Math.max(recentDecisions.length, 1);
  const avgConfidence = recentDecisions.reduce((sum, d) => sum + d.confidence, 0) / Math.max(recentDecisions.length, 1);
  
  return {
    totalRules,
    automationRate: Math.round(automationRate * 100),
    avgResponseTime: Math.round(avgResponseTime),
    avgConfidence: Math.round(avgConfidence),
    totalDecisions: recentDecisions.length
  };
}
