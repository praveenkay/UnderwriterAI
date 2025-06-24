import OpenAI from "openai";
import { tokenManager } from './tokenManager';

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY
});

export interface UnderwritingDecisionRequest {
  policyNumber: string;
  clientName: string;
  requestType: string;
  requestDetails: any;
  policyData?: any;
  riskProfile?: string;
  claimsHistory?: any[];
}

export interface UnderwritingDecisionResponse {
  decision: "approved" | "declined" | "escalated";
  reason: string;
  confidence: number;
  factors: string[];
  escalationReason?: string;
}

export async function processUnderwritingDecision(
  request: UnderwritingDecisionRequest,
  rules: any[]
): Promise<UnderwritingDecisionResponse> {
  const prompt = `
You are an AI underwriting assistant for Zurich Insurance, specialized in SME (Small Medium Enterprise) business insurance.

UNDERWRITING REQUEST:
- Policy Number: ${request.policyNumber}
- Client: ${request.clientName}
- Request Type: ${request.requestType}
- Request Details: ${JSON.stringify(request.requestDetails)}
- Risk Profile: ${request.riskProfile || 'unknown'}
- Claims History: ${JSON.stringify(request.claimsHistory || [])}

ACTIVE UNDERWRITING RULES:
${JSON.stringify(rules, null, 2)}

Based on the request and rules, make an underwriting decision. Consider:
1. Claims history and frequency
2. Risk profile assessment
3. Policy renewal status
4. Coverage amounts and limits
5. Business type and industry risks

DECISION CRITERIA:
- APPROVE: If request meets all rule conditions and risk is acceptable
- DECLINE: If request violates rules or risk is too high
- ESCALATE: If request requires human judgment or involves complex risk factors

Respond with JSON in this exact format:
{
  "decision": "approved|declined|escalated",
  "reason": "Clear explanation of the decision",
  "confidence": 0-100,
  "factors": ["factor1", "factor2", "factor3"],
  "escalationReason": "Required if decision is escalated"
}
`;

  try {
    // Estimate tokens and select optimal model for underwriting decision
    const systemPrompt = "You are an expert underwriting AI for Zurich Insurance. Make precise, rule-based decisions and explain your reasoning clearly.";
    const totalTokens = tokenManager.estimateTokens(prompt + systemPrompt);
    const strategy = tokenManager.selectOptimalModel(totalTokens);
    
    console.log(`Underwriting decision using model: ${strategy.model}`);

    const response = await openai.chat.completions.create({
      model: strategy.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 4096
    });

    const result = JSON.parse(response.choices[0].message.content!);
    
    return {
      decision: result.decision,
      reason: result.reason,
      confidence: Math.max(0, Math.min(100, result.confidence)),
      factors: result.factors || [],
      escalationReason: result.escalationReason
    };
  } catch (error) {
    console.error("OpenAI API error:", error);
    throw new Error("Failed to process underwriting decision: " + (error as Error).message);
  }
}

export async function extractRulesFromChatHistory(chatHistory: string[]): Promise<any[]> {
  const systemPrompt = "You are an expert at analyzing insurance underwriting conversations and extracting business rules and decision patterns.";
  const chatContent = chatHistory.join('\n\n---\n\n');
  
  const prompt = `
Analyze the following chat history between brokers and underwriters to extract underwriting rules and decision patterns.

CHAT HISTORY:
${chatContent}

Extract underwriting rules in the following categories:
1. Discount Rules (renewal discounts, loyalty discounts, etc.)
2. Coverage Rules (limits, exclusions, amendments)
3. Risk Assessment Rules (industry-specific, claims-based)
4. Escalation Rules (when to escalate to human underwriter)

For each rule, determine:
- Conditions that trigger the rule
- Actions to take
- Confidence level (0-100)
- Source context from the chat

Respond with JSON array in this format:
[
  {
    "ruleType": "discount|coverage|risk_assessment|escalation",
    "conditions": {"key": "value"},
    "action": {"actionType": "value"},
    "confidence": 0-100,
    "source": "extracted_from_chat",
    "description": "Human readable rule description"
  }
]
`;

  try {
    // Estimate tokens and select optimal model
    const contentTokens = tokenManager.estimateTokens(prompt);
    const systemTokens = tokenManager.estimateTokens(systemPrompt);
    const strategy = tokenManager.selectOptimalModel(contentTokens, systemTokens);
    
    console.log(`Chat history rule extraction using strategy:`, strategy);

    let allRules: any[] = [];

    if (strategy.shouldChunk) {
      // Process in chunks for large chat histories
      const chunks = tokenManager.chunkContent(chatContent, strategy.chunkSize!);
      console.log(`Processing ${chunks.length} chunks for chat history rule extraction`);

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        
        // Double-check chunk size before sending - be very conservative
        const chunkTokens = tokenManager.estimateTokens(chunk);
        const maxAllowedTokens = Math.min(10000, MODEL_LIMITS[strategy.model].contextWindow - systemTokens - 4096);
        
        if (chunkTokens > maxAllowedTokens) {
          console.log(`Chunk ${i + 1} still too large (${chunkTokens} tokens), splitting further...`);
          const subChunks = tokenManager.chunkContent(chunk, maxAllowedTokens);
          
          for (const subChunk of subChunks) {
            const subChunkPrompt = `Analyze this chat history segment and extract underwriting rules:\n\n${subChunk}`;
            
            try {
              const response = await openai.chat.completions.create({
                model: strategy.model,
                messages: [
                  { role: "system", content: systemPrompt },
                  { role: "user", content: subChunkPrompt }
                ],
                response_format: { type: "json_object" },
                temperature: 0.2,
                max_tokens: 2048
              });

              const result = JSON.parse(response.choices[0].message.content!);
              const subChunkRules = result.rules || [];
              allRules.push(...subChunkRules);
              
              console.log(`Extracted ${subChunkRules.length} rules from sub-chunk`);
              
              // Delay between sub-chunks
              await new Promise(resolve => setTimeout(resolve, 200));
            } catch (subError) {
              console.error(`Error processing sub-chunk:`, subError.message);
            }
          }
        } else {
          const chunkPrompt = `Analyze this chat history segment (${i + 1}/${chunks.length}) and extract underwriting rules:\n\n${chunk}`;
          
          try {
            const response = await openai.chat.completions.create({
              model: strategy.model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: chunkPrompt }
              ],
              response_format: { type: "json_object" },
              temperature: 0.2,
              max_tokens: 4096
            });

            const result = JSON.parse(response.choices[0].message.content!);
            const chunkRules = result.rules || [];
            allRules.push(...chunkRules);
            
            console.log(`Extracted ${chunkRules.length} rules from chat chunk ${i + 1}`);
          } catch (chunkError) {
            console.error(`Error processing chunk ${i + 1}:`, chunkError.message);
          }
        }

        // Delay between chunks
        if (i < chunks.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Deduplicate rules
      allRules = deduplicateRules(allRules);
      console.log(`Final chat history result: ${allRules.length} unique rules after deduplication`);
    } else {
      const response = await openai.chat.completions.create({
        model: strategy.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 8192
      });

      const result = JSON.parse(response.choices[0].message.content!);
      allRules = result.rules || [];
    }

    return allRules;
  } catch (error) {
    console.error("Rule extraction error:", error);
    throw new Error("Failed to extract rules from chat history: " + (error as Error).message);
  }
}

/**
 * Remove duplicate rules based on similarity
 */
function deduplicateRules(rules: any[]): any[] {
  const uniqueRules: any[] = [];
  
  for (const rule of rules) {
    const isDuplicate = uniqueRules.some(existing => 
      existing.ruleType === rule.ruleType &&
      JSON.stringify(existing.conditions) === JSON.stringify(rule.conditions) &&
      JSON.stringify(existing.action) === JSON.stringify(rule.action)
    );
    
    if (!isDuplicate) {
      uniqueRules.push(rule);
    }
  }
  
  return uniqueRules;
}

export async function generateChatResponse(
  message: string,
  context: {
    policyData?: any;
    chatHistory?: any[];
    rules?: any[];
  }
): Promise<string> {
  const prompt = `
You are an AI underwriting assistant for Zurich Insurance. A broker has sent you this message:

"${message}"

CONTEXT:
- Policy Data: ${JSON.stringify(context.policyData || {})}
- Recent Chat History: ${JSON.stringify(context.chatHistory || [])}
- Active Rules: ${JSON.stringify(context.rules || [])}

Respond as a helpful, professional underwriting assistant. If the message is:
1. A policy inquiry - Provide relevant policy information
2. A request for approval - Make a decision based on rules and explain reasoning
3. A general question - Answer based on underwriting knowledge
4. Complex/unclear - Ask for clarification

Keep responses concise, professional, and actionable. Always explain your reasoning when making decisions.
`;

  try {
    // Estimate tokens and select optimal model for chat response
    const systemPrompt = "You are a professional AI underwriting assistant for Zurich Insurance. Be helpful, accurate, and explain your decision-making process.";
    const totalTokens = tokenManager.estimateTokens(prompt + systemPrompt);
    const strategy = tokenManager.selectOptimalModel(totalTokens);
    
    console.log(`Chat response using model: ${strategy.model}`);

    const response = await openai.chat.completions.create({
      model: strategy.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 2048
    });

    return response.choices[0].message.content || "I apologize, but I couldn't process your request. Please try again.";
  } catch (error) {
    console.error("Chat response error:", error);
    throw new Error("Failed to generate chat response: " + (error as Error).message);
  }
}
