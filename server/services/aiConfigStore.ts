import fs from 'fs';
import path from 'path';

const CONFIG_PATH = path.join(process.cwd(), 'server', 'data', 'aiConfig.json');

export interface StoredAIConfig {
  currentProvider: string;
  currentModel: string;
  apiKeys: Record<string, string>; // provider key -> api key
}

const DEFAULT_CONFIG: StoredAIConfig = {
  currentProvider: '',
  currentModel: '',
  apiKeys: {},
};

function loadConfig(): StoredAIConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore read errors
  }
  return { ...DEFAULT_CONFIG };
}

function saveConfig(config: StoredAIConfig): void {
  try {
    const dir = path.dirname(CONFIG_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Could not save AI config:', e);
  }
}

class AIConfigStore {
  private config: StoredAIConfig;

  constructor() {
    this.config = loadConfig();
    // Seed initial API keys from environment if not already in store
    const envMap: Record<string, string> = {
      anthropic: process.env.ANTHROPIC_API_KEY || '',
      openai: process.env.OPENAI_API_KEY || '',
      gemini: process.env.GEMINI_API_KEY || '',
      openrouter: process.env.OPENROUTER_API_KEY || '',
    };
    let changed = false;
    for (const [key, val] of Object.entries(envMap)) {
      if (val && !this.config.apiKeys[key]) {
        this.config.apiKeys[key] = val;
        changed = true;
      }
    }
    if (changed) saveConfig(this.config);
  }

  getApiKey(provider: string): string {
    return this.config.apiKeys[provider] || '';
  }

  setApiKey(provider: string, apiKey: string): void {
    this.config.apiKeys[provider] = apiKey;
    saveConfig(this.config);
  }

  removeApiKey(provider: string): void {
    delete this.config.apiKeys[provider];
    saveConfig(this.config);
  }

  hasApiKey(provider: string): boolean {
    return !!this.config.apiKeys[provider];
  }

  getConfiguredProviders(): string[] {
    return Object.entries(this.config.apiKeys)
      .filter(([, v]) => !!v)
      .map(([k]) => k);
  }

  getMaskedKeys(): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [k, v] of Object.entries(this.config.apiKeys)) {
      if (v) {
        masked[k] = v.length > 8
          ? v.substring(0, 4) + '••••••••' + v.slice(-4)
          : '••••••••••••';
      }
    }
    return masked;
  }

  setCurrentProvider(provider: string): void {
    this.config.currentProvider = provider;
    saveConfig(this.config);
  }

  setCurrentModel(model: string): void {
    this.config.currentModel = model;
    saveConfig(this.config);
  }

  getCurrentProvider(): string {
    return this.config.currentProvider;
  }

  getCurrentModel(): string {
    return this.config.currentModel;
  }
}

export const aiConfigStore = new AIConfigStore();
