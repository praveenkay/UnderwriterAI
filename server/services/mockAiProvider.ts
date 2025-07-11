// Mock AI Provider for testing and demo purposes
export interface MockRule {
  ruleType: string;
  conditions: any;
  action: any;
  confidence: number;
  description: string;
}

export class MockAIService {
  name = 'Mock AI Service';

  async extractDocumentRules(content: string, fileType: string): Promise<MockRule[]> {
    console.log(`Mock AI: Extracting rules from ${fileType} document`);
    
    const rules: MockRule[] = [];
    const lines = content.toLowerCase().split('\n');
    
    // Simple rule extraction based on patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Look for "if...then" patterns
      if (line.includes('if ') && line.includes('then ')) {
        const parts = line.split('then ');
        if (parts.length === 2) {
          const condition = parts[0].replace('if ', '').trim();
          const action = parts[1].trim();
          
          rules.push({
            ruleType: this.determineRuleType(condition, action),
            conditions: { description: condition },
            action: { description: action },
            confidence: 0.85,
            description: `Rule: ${condition} → ${action}`
          });
        }
      }
      
      // Look for coverage limits
      if (line.includes('coverage') && (line.includes('$') || line.includes('limit'))) {
        rules.push({
          ruleType: 'coverage',
          conditions: { type: 'coverage_limit' },
          action: { description: line },
          confidence: 0.75,
          description: `Coverage rule: ${line}`
        });
      }
      
      // Look for age-related rules
      if (line.includes('age') && (line.includes('>') || line.includes('<') || line.includes('years'))) {
        rules.push({
          ruleType: 'eligibility',
          conditions: { field: 'age', description: line },
          action: { type: 'age_based_rule' },
          confidence: 0.80,
          description: `Age-based rule: ${line}`
        });
      }
      
      // Look for discount rules
      if (line.includes('discount') || line.includes('%')) {
        rules.push({
          ruleType: 'discount',
          conditions: { description: line },
          action: { type: 'apply_discount' },
          confidence: 0.70,
          description: `Discount rule: ${line}`
        });
      }
      
      // Look for escalation rules
      if (line.includes('escalate') || line.includes('manual review') || line.includes('specialist')) {
        rules.push({
          ruleType: 'escalation',
          conditions: { description: line },
          action: { type: 'escalate' },
          confidence: 0.90,
          description: `Escalation rule: ${line}`
        });
      }
      
      // Look for requirement rules
      if (line.includes('require') || line.includes('must')) {
        rules.push({
          ruleType: 'requirement',
          conditions: { description: line },
          action: { type: 'require_action' },
          confidence: 0.75,
          description: `Requirement rule: ${line}`
        });
      }
    }
    
    // Add some default rules if none found
    if (rules.length === 0) {
      rules.push({
        ruleType: 'general',
        conditions: { document_type: fileType },
        action: { type: 'document_processed' },
        confidence: 0.50,
        description: `Document processed: ${fileType}`
      });
    }
    
    console.log(`Mock AI: Extracted ${rules.length} rules`);
    return rules;
  }

  private determineRuleType(condition: string, action: string): string {
    if (action.includes('discount') || action.includes('%')) return 'discount';
    if (action.includes('escalate') || action.includes('review')) return 'escalation';
    if (action.includes('require') || action.includes('inspection')) return 'requirement';
    if (action.includes('decline') || action.includes('reject')) return 'decline';
    if (action.includes('approve')) return 'approval';
    if (condition.includes('coverage') || action.includes('coverage')) return 'coverage';
    if (condition.includes('age') || condition.includes('driver')) return 'eligibility';
    return 'general';
  }

  async generateChatResponse(message: string, context: any): Promise<string> {
    // Simple mock chat response
    if (message.toLowerCase().includes('policy')) {
      return "I can help you with policy-related questions. What specific information do you need?";
    }
    if (message.toLowerCase().includes('discount')) {
      return "Based on the current rules, I can evaluate discount eligibility. Please provide the policy details.";
    }
    if (message.toLowerCase().includes('coverage')) {
      return "I can assist with coverage recommendations based on our underwriting guidelines.";
    }
    return "I'm here to help with underwriting decisions and policy questions. How can I assist you today?";
  }
}

export const mockAiService = new MockAIService();
