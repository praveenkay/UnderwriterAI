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

    // If content is too large for any model, use chunking with the highest capacity model
    const chunkModel = 'gpt-3.5-turbo'; // Use gpt-3.5-turbo for massive documents
    const chunkLimits = MODEL_LIMITS[chunkModel];
    // Very small chunk size for extremely large documents (10K tokens max per chunk)
    const chunkSize = Math.min(10000, Math.floor((chunkLimits.contextWindow - systemPromptTokens - outputBuffer) * 0.1));
    
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
    console.log(`Chunking content: ${content.length} chars, max tokens per chunk: ${maxChunkTokens}`);
    
    // For extremely large content, use character-based chunking first
    if (content.length > 500000) {
      return this.chunkByCharacters(content, maxChunkTokens);
    }
    
    // Try sentence-based chunking first
    const sentences = content.split(/[.!?\n]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';
    let currentTokens = 0;

    for (const sentence of sentences) {
      const sentenceTokens = this.estimateTokens(sentence.trim());
      
      // If single sentence is too large, split it further
      if (sentenceTokens > maxChunkTokens) {
        if (currentChunk.trim()) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
          currentTokens = 0;
        }
        
        // Split oversized sentence by words
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          const wordTokens = this.estimateTokens(wordChunk + ' ' + word);
          if (wordTokens > maxChunkTokens && wordChunk) {
            chunks.push(wordChunk.trim());
            wordChunk = word;
          } else {
            wordChunk += (wordChunk ? ' ' : '') + word;
          }
        }
        if (wordChunk.trim()) {
          chunks.push(wordChunk.trim());
        }
        continue;
      }
      
      if (currentTokens + sentenceTokens > maxChunkTokens && currentChunk) {
        chunks.push(currentChunk.trim());
        currentChunk = sentence.trim();
        currentTokens = sentenceTokens;
      } else {
        currentChunk += (currentChunk ? '. ' : '') + sentence.trim();
        currentTokens += sentenceTokens;
      }
    }

    if (currentChunk.trim()) {
      chunks.push(currentChunk.trim());
    }

    console.log(`Created ${chunks.length} chunks from content`);
    return chunks.filter(chunk => chunk.trim().length > 0);
  }

  /**
   * Chunk content by character count for extremely large documents
   */
  private chunkByCharacters(content: string, maxChunkTokens: number): string[] {
    // Very conservative estimate: 2 chars per token for safety
    const maxCharsPerChunk = Math.min(maxChunkTokens * 2, 20000); // Max 20K chars per chunk
    const chunks: string[] = [];
    
    for (let i = 0; i < content.length; i += maxCharsPerChunk) {
      let chunk = content.slice(i, i + maxCharsPerChunk);
      
      // Try to break at word boundaries
      if (i + maxCharsPerChunk < content.length) {
        const lastSpaceIndex = chunk.lastIndexOf(' ');
        const lastNewlineIndex = chunk.lastIndexOf('\n');
        const breakIndex = Math.max(lastSpaceIndex, lastNewlineIndex);
        
        if (breakIndex > maxCharsPerChunk * 0.7) {
          chunk = chunk.slice(0, breakIndex);
          i = i + breakIndex; // Adjust position
        }
      }
      
      if (chunk.trim().length > 0) {
        chunks.push(chunk.trim());
      }
    }
    
    console.log(`Character-based chunking created ${chunks.length} chunks (avg ${Math.round(content.length / chunks.length)} chars each)`);
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