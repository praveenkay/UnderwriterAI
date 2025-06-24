import { FaissStore } from "@langchain/community/vectorstores/faiss";
import { OpenAIEmbeddings } from "@langchain/openai";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { Document } from "langchain/document";
import fs from "fs";
import path from "path";
import PDFParse from "pdf-parse";

export interface VectorSearchResult {
  content: string;
  metadata: any;
  score: number;
}

export class VectorStoreService {
  private vectorStore: FaissStore | null = null;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private storePath: string;
  private initialized = false;

  constructor() {
    // Initialize embeddings with fallback to OpenAI
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: "text-embedding-3-small",
    });

    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    this.storePath = path.join(process.cwd(), "vector_store");
    
    // Ensure vector store directory exists
    if (!fs.existsSync(this.storePath)) {
      fs.mkdirSync(this.storePath, { recursive: true });
    }
  }

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Try to load existing vector store
      if (fs.existsSync(path.join(this.storePath, "docstore.json"))) {
        console.log("Loading existing vector store...");
        this.vectorStore = await FaissStore.load(this.storePath, this.embeddings);
      } else {
        console.log("Creating new vector store...");
        // Create empty vector store with dummy document
        const dummyDoc = new Document({
          pageContent: "Initial document for vector store initialization",
          metadata: { type: "system", source: "initialization" }
        });
        this.vectorStore = await FaissStore.fromDocuments([dummyDoc], this.embeddings);
        await this.vectorStore.save(this.storePath);
      }
      
      this.initialized = true;
      console.log("Vector store initialized successfully");
    } catch (error) {
      console.error("Failed to initialize vector store:", error);
      // Create fallback empty store
      const dummyDoc = new Document({
        pageContent: "Fallback initialization document",
        metadata: { type: "system", source: "fallback" }
      });
      this.vectorStore = await FaissStore.fromDocuments([dummyDoc], this.embeddings);
      this.initialized = true;
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
      const chunks = await this.textSplitter.splitText(content);
      
      // Create documents with metadata
      const documents = chunks.map((chunk, index) => new Document({
        pageContent: chunk,
        metadata: {
          ...metadata,
          source: filename,
          chunk: index,
          fileType,
          uploadDate: new Date().toISOString(),
          chunkCount: chunks.length
        }
      }));

      // Add documents to vector store
      if (this.vectorStore) {
        await this.vectorStore.addDocuments(documents);
        await this.vectorStore.save(this.storePath);
        
        console.log(`Ingested ${documents.length} chunks from ${filename}`);
        return { chunks: documents.length, success: true };
      } else {
        throw new Error("Vector store not initialized");
      }
      
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
      
      if (!this.vectorStore) {
        throw new Error("Vector store not initialized");
      }

      const results = await this.vectorStore.similaritySearchWithScore(query, limit);
      
      return results
        .filter(([doc, score]) => {
          // Apply filters if provided
          if (filter) {
            return Object.entries(filter).every(([key, value]) => 
              doc.metadata[key] === value
            );
          }
          return true;
        })
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score
        }));
        
    } catch (error) {
      console.error("Error searching vector store:", error);
      return [];
    }
  }

  async searchByMetadata(metadata: any): Promise<VectorSearchResult[]> {
    try {
      await this.initialize();
      
      if (!this.vectorStore) {
        return [];
      }

      // Since Faiss doesn't have direct metadata filtering, we do a broad search
      // and filter results (not ideal but works for small datasets)
      const allResults = await this.vectorStore.similaritySearchWithScore("", 100);
      
      return allResults
        .filter(([doc, score]) => {
          return Object.entries(metadata).every(([key, value]) => 
            doc.metadata[key] === value
          );
        })
        .map(([doc, score]) => ({
          content: doc.pageContent,
          metadata: doc.metadata,
          score: score
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
      
      if (!this.vectorStore) {
        return { totalDocuments: 0, sources: [], lastUpdate: "Never" };
      }

      // Get sample of documents to analyze
      const sampleResults = await this.vectorStore.similaritySearchWithScore("", 50);
      const sources = new Set<string>();
      
      sampleResults.forEach(([doc, score]) => {
        if (doc.metadata.source) {
          sources.add(doc.metadata.source);
        }
      });

      return {
        totalDocuments: sampleResults.length,
        sources: Array.from(sources),
        lastUpdate: new Date().toISOString()
      };
      
    } catch (error) {
      console.error("Error getting document stats:", error);
      return { totalDocuments: 0, sources: [], lastUpdate: "Error" };
    }
  }

  async clearStore(): Promise<void> {
    try {
      // Remove existing store files
      if (fs.existsSync(this.storePath)) {
        fs.rmSync(this.storePath, { recursive: true, force: true });
        fs.mkdirSync(this.storePath, { recursive: true });
      }
      
      // Reset store
      this.vectorStore = null;
      this.initialized = false;
      
      console.log("Vector store cleared");
    } catch (error) {
      console.error("Error clearing vector store:", error);
    }
  }
}

export const vectorStoreService = new VectorStoreService();