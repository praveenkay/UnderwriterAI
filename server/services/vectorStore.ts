import fs from "fs";
import path from "path";
import PDFParse from "pdf-parse";
import OpenAI from "openai";

export interface VectorSearchResult {
  content: string;
  metadata: any;
  score: number;
}

interface DocumentChunk {
  id: string;
  content: string;
  metadata: any;
  embedding?: number[];
}

export class VectorStoreService {
  private documents: Map<string, DocumentChunk> = new Map();
  private openai: OpenAI | null = null;
  private storePath: string;
  private initialized = false;

  constructor() {
    // Initialize OpenAI client if available
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    this.storePath = path.join(process.cwd(), "vector_store");
    
    // Ensure vector store directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  private splitText(text: string, chunkSize = 1000, overlap = 200): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + chunkSize, text.length);
      const chunk = text.slice(start, end);
      chunks.push(chunk.trim());
      
      if (end === text.length) break;
      start = end - overlap;
    }

    return chunks.filter(chunk => chunk.length > 0);
  }

  private async getEmbedding(text: string): Promise<number[] | null> {
    if (!this.openai) {
      return null;
    }

    try {
      const response = await this.openai.embeddings.create({
        model: "text-embedding-3-small",
        input: text.substring(0, 8000), // Limit input size
      });

      return response.data[0]?.embedding || null;
    } catch (error) {
      console.error("Failed to get embedding:", error);
      return null;
    }
  }

  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load existing documents
      const storeFile = path.join(this.storePath, "documents.json");
      if (fs.existsSync(storeFile)) {
        console.log("Loading existing vector store...");
        const data = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
        this.documents = new Map(data.documents || []);
      }
      
      this.initialized = true;
      console.log("Vector store initialized successfully");
    } catch (error) {
      console.error("Failed to initialize vector store:", error);
      this.initialized = true;
    }
  }

  private async saveStore(): Promise<void> {
    try {
      const storeFile = path.join(this.storePath, "documents.json");
      const data = {
        documents: Array.from(this.documents.entries()),
        lastUpdate: new Date().toISOString()
      };
      fs.writeFileSync(storeFile, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error("Failed to save vector store:", error);
    }
  }

  async ingestDocument(
    filePath: string, 
    filename: string, 
    fileType: string,
    metadata: any = {}
  ): Promise<{ chunks: number; success: boolean; error?: string }> {
    try {
      await this.initialize();
      
      let content = '';
      
      // Extract content based on file type
      if (fileType === 'application/pdf' || filename.endsWith('.pdf')) {
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await PDFParse(pdfBuffer);
        content = pdfData.text;
      } else {
        // Handle text files, CSV, JSON, etc.
        content = fs.readFileSync(filePath, 'utf-8');
      }

      if (!content.trim()) {
        return { chunks: 0, success: false, error: "No content extracted from file" };
      }

      // Split content into chunks
      const chunks = this.splitText(content);
      let processedChunks = 0;
      
      // Process each chunk
      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${filename}_chunk_${i}`;
        
        // Get embedding if OpenAI is available
        const embedding = await this.getEmbedding(chunk);
        
        // Store document chunk
        const docChunk: DocumentChunk = {
          id: chunkId,
          content: chunk,
          metadata: {
            ...metadata,
            source: filename,
            chunk: i,
            fileType,
            uploadDate: new Date().toISOString(),
            chunkCount: chunks.length
          },
          embedding
        };
        
        this.documents.set(chunkId, docChunk);
        processedChunks++;
      }
      
      // Save store
      await this.saveStore();
      
      console.log(`Ingested ${processedChunks} chunks from ${filename}`);
      return { chunks: processedChunks, success: true };
      
    } catch (error) {
      console.error(`Error ingesting document ${filename}:`, error);
      return { 
        chunks: 0, 
        success: false, 
        error: error.message 
      };
    }
  }

  async searchSimilar(
    query: string, 
    limit: number = 5,
    filter?: any
  ): Promise<VectorSearchResult[]> {
    try {
      await this.initialize();
      
      const allDocs = Array.from(this.documents.values());
      if (allDocs.length === 0) {
        return [];
      }

      // If OpenAI is available, use semantic search
      if (this.openai) {
        const queryEmbedding = await this.getEmbedding(query);
        
        if (queryEmbedding) {
          const results = allDocs
            .filter(doc => {
              // Apply filters if provided
              if (filter) {
                return Object.entries(filter).every(([key, value]) => 
                  doc.metadata[key] === value
                );
              }
              return true;
            })
            .map(doc => ({
              content: doc.content,
              metadata: doc.metadata,
              score: doc.embedding ? this.cosineSimilarity(queryEmbedding, doc.embedding) : 0
            }))
            .filter(result => result.score > 0.1) // Minimum similarity threshold
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);

          return results;
        }
      }

      // Fallback to keyword search
      const queryTerms = query.toLowerCase().split(/\s+/);
      
      const results = allDocs
        .filter(doc => {
          // Apply filters if provided
          if (filter) {
            const filterMatch = Object.entries(filter).every(([key, value]) => 
              doc.metadata[key] === value
            );
            if (!filterMatch) return false;
          }
          
          // Check if content contains query terms
          const content = doc.content.toLowerCase();
          return queryTerms.some(term => content.includes(term));
        })
        .map(doc => {
          // Calculate simple keyword score
          const content = doc.content.toLowerCase();
          const matches = queryTerms.filter(term => content.includes(term)).length;
          const score = matches / queryTerms.length;
          
          return {
            content: doc.content,
            metadata: doc.metadata,
            score
          };
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return results;
        
    } catch (error) {
      console.error("Error searching vector store:", error);
      return [];
    }
  }

  async searchByMetadata(metadata: any): Promise<VectorSearchResult[]> {
    try {
      await this.initialize();
      
      const allDocs = Array.from(this.documents.values());
      
      return allDocs
        .filter(doc => {
          return Object.entries(metadata).every(([key, value]) => 
            doc.metadata[key] === value
          );
        })
        .map(doc => ({
          content: doc.content,
          metadata: doc.metadata,
          score: 1.0 // Perfect match for metadata search
        }))
        .slice(0, 20); // Limit results
        
    } catch (error) {
      console.error("Error searching by metadata:", error);
      return [];
    }
  }

  async getDocumentStats(): Promise<{
    totalDocuments: number;
    sources: string[];
    lastUpdate: string;
  }> {
    try {
      await this.initialize();
      
      const allDocs = Array.from(this.documents.values());
      const sources = new Set<string>();
      
      allDocs.forEach(doc => {
        if (doc.metadata.source) {
          sources.add(doc.metadata.source);
        }
      });

      // Get last update from store file
      let lastUpdate = "Never";
      try {
        const storeFile = path.join(this.storePath, "documents.json");
        if (fs.existsSync(storeFile)) {
          const data = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
          lastUpdate = data.lastUpdate || "Never";
        }
      } catch (error) {
        // Ignore file read errors
      }

      return {
        totalDocuments: allDocs.length,
        sources: Array.from(sources),
        lastUpdate
      };
      
    } catch (error) {
      console.error("Error getting document stats:", error);
      return { totalDocuments: 0, sources: [], lastUpdate: "Error" };
    }
  }

  async clearStore(): Promise<void> {
    try {
      // Clear in-memory documents
      this.documents.clear();
      
      // Remove store file
      const storeFile = path.join(this.storePath, "documents.json");
      if (fs.existsSync(storeFile)) {
        fs.unlinkSync(storeFile);
      }
      
      console.log("Vector store cleared");
    } catch (error) {
      console.error("Error clearing vector store:", error);
    }
  }
}

export const vectorStoreService = new VectorStoreService();