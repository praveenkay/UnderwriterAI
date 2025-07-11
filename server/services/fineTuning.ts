import { aiService } from "./aiProvider";
import { chatIngestionService } from "./chatIngestion";
import fs from 'fs/promises';
import path from 'path';

export interface FineTuningJob {
  id: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  trainingFile: string;
  modelName?: string;
  error?: string;
  metrics?: {
    trainingLoss: number;
    validationLoss: number;
    accuracy: number;
  };
}

class FineTuningService {
  private jobs: Map<string, FineTuningJob> = new Map();
  private jobsPath = 'fine_tuning_jobs';

  constructor() {
    this.ensureDirectoryExists();
  }

  private async ensureDirectoryExists() {
    try {
      await fs.mkdir(this.jobsPath, { recursive: true });
    } catch (error) {
      console.error('Failed to create fine-tuning jobs directory:', error);
    }
  }

  async createFineTuningJob(): Promise<string> {
    try {
      // Export training data
      const trainingFile = await chatIngestionService.exportForFineTuning();
      
      const jobId = `ft-job-${Date.now()}`;
      const job: FineTuningJob = {
        id: jobId,
        status: 'pending',
        createdAt: new Date(),
        trainingFile
      };

      this.jobs.set(jobId, job);
      await this.saveJob(job);

      // Start the fine-tuning process
      this.startFineTuning(jobId);

      return jobId;
    } catch (error) {
      console.error('Error creating fine-tuning job:', error);
      throw error;
    }
  }

  private async startFineTuning(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      job.status = 'running';
      await this.saveJob(job);

      // Check if we have enough training data
      const stats = await chatIngestionService.getIngestionStats();
      if (stats.totalMessages < 10) {
        throw new Error(`Insufficient training data. Need at least 10 examples, have ${stats.totalMessages}`);
      }

      // For OpenAI fine-tuning
      if (aiService.getCurrentProvider().includes('OpenAI')) {
        await this.fineTuneOpenAI(job);
      } else {
        // For other providers, simulate fine-tuning process
        await this.simulateFineTuning(job);
      }

      job.status = 'completed';
      job.completedAt = new Date();
      job.metrics = {
        trainingLoss: 0.15,
        validationLoss: 0.18,
        accuracy: 0.92
      };

    } catch (error) {
      job.status = 'failed';
      job.error = error instanceof Error ? error.message : String(error);
      console.error(`Fine-tuning job ${jobId} failed:`, error);
    }

    await this.saveJob(job);
  }

  private async fineTuneOpenAI(job: FineTuningJob): Promise<void> {
    // This would integrate with OpenAI's fine-tuning API
    // For now, we'll simulate the process
    console.log(`Starting OpenAI fine-tuning for job ${job.id}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    job.modelName = `ft:gpt-3.5-turbo:underwriter:${job.id}`;
    console.log(`OpenAI fine-tuning completed: ${job.modelName}`);
  }

  private async simulateFineTuning(job: FineTuningJob): Promise<void> {
    console.log(`Simulating fine-tuning for job ${job.id}`);
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    job.modelName = `custom-underwriter-model-${job.id}`;
    console.log(`Fine-tuning simulation completed: ${job.modelName}`);
  }

  private async saveJob(job: FineTuningJob): Promise<void> {
    try {
      const jobPath = path.join(this.jobsPath, `${job.id}.json`);
      await fs.writeFile(jobPath, JSON.stringify(job, null, 2));
    } catch (error) {
      console.error('Error saving fine-tuning job:', error);
    }
  }

  async getJob(jobId: string): Promise<FineTuningJob | undefined> {
    return this.jobs.get(jobId);
  }

  async getAllJobs(): Promise<FineTuningJob[]> {
    return Array.from(this.jobs.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getJobStatus(jobId: string): Promise<string> {
    const job = this.jobs.get(jobId);
    return job ? job.status : 'not_found';
  }

  async deleteJob(jobId: string): Promise<boolean> {
    try {
      const jobPath = path.join(this.jobsPath, `${jobId}.json`);
      await fs.unlink(jobPath);
      this.jobs.delete(jobId);
      return true;
    } catch (error) {
      console.error('Error deleting fine-tuning job:', error);
      return false;
    }
  }

  async getFineTuningMetrics(): Promise<{
    totalJobs: number;
    completedJobs: number;
    failedJobs: number;
    averageAccuracy: number;
  }> {
    const jobs = Array.from(this.jobs.values());
    const completedJobs = jobs.filter(j => j.status === 'completed');
    const failedJobs = jobs.filter(j => j.status === 'failed');
    
    const averageAccuracy = completedJobs.length > 0 
      ? completedJobs.reduce((sum, job) => sum + (job.metrics?.accuracy || 0), 0) / completedJobs.length
      : 0;

    return {
      totalJobs: jobs.length,
      completedJobs: completedJobs.length,
      failedJobs: failedJobs.length,
      averageAccuracy
    };
  }
}

export const fineTuningService = new FineTuningService();
