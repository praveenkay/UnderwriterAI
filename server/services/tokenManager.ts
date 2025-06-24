import { encoding_for_model } from 'tiktoken';

// Token limits for different OpenAI models
export const MODEL_LIMITS = {
  'gpt-4o': { 
    maxTokens: 450000,
    contextWindow: 128000,
    maxOutputTokens: 16384
  },
  'gpt-4o-mini': { 
    maxTokens: 2000000,
    contextWindow: 128000,
    maxOutputTokens: 16384
  },
  'gpt-4-turbo': { 
    maxTokens: 450000,
    contextWindow: 128000,
    maxOutputTokens: 4096
  },
  'gpt-3.5-turbo': { 
    maxTokens: 1000000,
    contextWindow: 16385,
    maxOutputTokens: 4096
  }
};

export class TokenManager {
  private encoding: any;
  
  constructor() {
    try {
      this.encoding = encoding_for_model('gpt-4o');
    } catch (error) {
      console.warn('Failed to load tiktoken encoding, using fallback estimation');
      this.encoding = null;
    }
  }

  /**
   * Estimate token count for text
   */
  estimateTokens(text: string): number {
    if (this.encoding) {
      try {
        return this.encoding.encode(text).length;
      } catch (error) {
        console.warn('Tiktoken encoding failed, using fallback estimation');
      }
    }
    
    // Fallback estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Select the best model for given content size
   */
  selectOptimalModel(contentTokens: number, systemPromptTokens: number = 500): {
    model: string;
    shouldChunk: boolean;
    chunkSize?: number;
  } {
    const totalInputTokens = contentTokens + systemPromptTokens;
    const outputBuffer = 8192; // Reserve tokens for output
    
    console.log(`Token analysis: Content=${contentTokens}, System=${systemPromptTokens}, Total=${totalInputTokens}`);

    // Try models in order of preference
    const modelPriority = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'];
    
    for (const model of modelPriority) {
      const limits = MODEL_LIMITS[model];
      const maxUsableTokens = Math.min(limits.maxTokens - outputBuffer, limits.contextWindow - outputBuffer);
      
      if (totalInputTokens <= maxUsableTokens) {
        console.log(`Selected model: ${model} (fits within ${maxUsableTokens} tokens)`);
        return { model, shouldChunk: false };
      }
    }

    // If content is too large for any model, use chunking with gpt-4o-mini
    const chunkModel = 'gpt-4o-mini';
    const chunkLimits = MODEL_LIMITS[chunkModel];
    const chunkSize = Math.floor((chunkLimits.contextWindow - systemPromptTokens - outputBuffer) * 0.8);
    
    console.log(`Content too large, using chunking with ${chunkModel} (chunk size: ${chunkSize} tokens)`);
    return { 
      model: chunkModel, 
      shouldChunk: true, 
      chunkSize 
    };
  }

  /**
   * Split content into chunks based on token limits
   */
  chunkContent(content: string, maxChunkTokens: number): string[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence);
      
      if (currentTokens + sentenceTokens > maxChunkTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence;
        currentTokens = sentenceTokens;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence;
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  /**
   * Get model info for display
   */
  getModelInfo(model: string) {
    return MODEL_LIMITS[model] || MODEL_LIMITS['gpt-4o'];
  }
}

export const tokenManager = new TokenManager();