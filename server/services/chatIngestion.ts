import { storage } from "../storage";
import type { ChatMessage } from "@shared/schema";
import fs from 'fs/promises';
import path from 'path';

export interface ChatIngestionData {
  messageId: number;
  sessionId: string;
  userMessage: string;
  aiResponse: string;
  timestamp: Date;
  context: {
    brokerId?: string;
    brokerName?: string;
    policyNumber?: string;
  };
}

class ChatIngestionService {
  private ingestionBuffer: ChatIngestionData[] = [];
  private trainingDataPath = 'training_data';

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.trainingDataPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create training data directory:', error);
    }
  }

  async ingestChatMessage(message: ChatMessage): Promise<void> {
    try {
      // Only process broker messages for training data
      if (message.sender !== 'broker') {
        return;
      }

      // Find the corresponding AI response
      const sessionMessages = await storage.getChatMessagesBySession(message.sessionId);
      const messageIndex = sessionMessages.findIndex(m => m.id === message.id);
      const aiResponse = sessionMessages[messageIndex + 1];

      if (aiResponse && aiResponse.sender === 'ai') {
        const ingestionData: ChatIngestionData = {
          messageId: message.id,
          sessionId: message.sessionId,
          userMessage: message.message,
          aiResponse: aiResponse.message,
          timestamp: new Date(message.timestamp),
          context: {
            brokerId: message.brokerId || undefined,
            brokerName: message.brokerName,
            policyNumber: this.extractPolicyNumber(message.message)
          }
        };

        this.ingestionBuffer.push(ingestionData);

        // Save to file when buffer reaches threshold
        if (this.ingestionBuffer.length >= 5) {
          await this.saveTrainingData();
        }
      }
    } catch (error) {
      console.error('Error ingesting chat message:', error);
    }
  }

  private extractPolicyNumber(message: string): string | undefined {
    const policyMatch = message.match(/(?:policy|pol)[\s#]*([A-Z0-9-]+)/i);
    return policyMatch ? policyMatch[1] : undefined;
  }

  private async saveTrainingData(): Promise<void> {
    if (this.ingestionBuffer.length === 0) return;

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `chat_training_${timestamp}.json`;
      const filepath = path.join(this.trainingDataPath, filename);

      await fs.writeFile(filepath, JSON.stringify(this.ingestionBuffer, null, 2));
      console.log(`Saved ${this.ingestionBuffer.length} chat interactions to ${filename}`);
      
      this.ingestionBuffer = [];
    } catch (error) {
      console.error('Error saving training data:', error);
    }
  }

  async exportForFineTuning(): Promise<string> {
    try {
      // Read all training data files
      const files = await fs.readdir(this.trainingDataPath);
      const trainingFiles = files.filter(f => f.startsWith('chat_training_') && f.endsWith('.json'));
      
      let allData: ChatIngestionData[] = [];
      
      for (const file of trainingFiles) {
        const content = await fs.readFile(path.join(this.trainingDataPath, file), 'utf-8');
        const data = JSON.parse(content);
        allData = allData.concat(data);
      }

      // Convert to JSONL format for fine-tuning
      const jsonlData = allData.map(item => JSON.stringify({
        messages: [
          { role: 'user', content: item.userMessage },
          { role: 'assistant', content: item.aiResponse }
        ]
      })).join('\n');

      const exportPath = path.join(this.trainingDataPath, `fine_tuning_data_${Date.now()}.jsonl`);
      await fs.writeFile(exportPath, jsonlData);
      
      console.log(`Exported ${allData.length} training examples to ${exportPath}`);
      return exportPath;
    } catch (error) {
      console.error('Error exporting training data:', error);
      throw error;
    }
  }

  async getIngestionStats(): Promise<{totalMessages: number, sessionsCount: number}> {
    try {
      const files = await fs.readdir(this.trainingDataPath);
      const trainingFiles = files.filter(f => f.startsWith('chat_training_') && f.endsWith('.json'));
      
      let totalMessages = 0;
      const sessions = new Set<string>();
      
      for (const file of trainingFiles) {
        const content = await fs.readFile(path.join(this.trainingDataPath, file), 'utf-8');
        const data = JSON.parse(content);
        totalMessages += data.length;
        data.forEach((item: ChatIngestionData) => sessions.add(item.sessionId));
      }

      return {
        totalMessages,
        sessionsCount: sessions.size
      };
    } catch (error) {
      console.error('Error getting ingestion stats:', error);
      return { totalMessages: 0, sessionsCount: 0 };
    }
  }
}

export const chatIngestionService = new ChatIngestionService();
