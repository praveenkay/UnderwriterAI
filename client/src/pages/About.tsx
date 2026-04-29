import React, { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Shield, Zap, Users, Database, Brain,
  ChevronRight, Target, Cog, BarChart3, FileText,
  Network, Lock, Key, Globe, Cpu, Activity, CheckCircle,
  ArrowRight, Settings, MessageSquare, Upload, Search
} from "lucide-react";

interface AIStatus {
  currentProvider: string;
  currentProviderKey: string;
  currentModel: string;
  available: string[];
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic Claude",
  openai: "OpenAI GPT",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  anthropic: "Claude Sonnet 4 & Opus 4 — Exceptional reasoning and document understanding",
  openai: "GPT-4o & GPT-4 Turbo — Optimised document processing with intelligent chunking",
  gemini: "Gemini 2.5 Pro & Flash — Analytics and multi-modal intelligence",
  openrouter: "Unified API gateway — Access Claude, GPT-4o, Gemini, and Llama via one key",
};

const PROVIDER_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  anthropic: { bg: "bg-orange-50", text: "text-orange-700", dot: "bg-orange-500" },
  openai: { bg: "bg-green-50", text: "text-green-700", dot: "bg-green-500" },
  gemini: { bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
  openrouter: { bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
};

export default function About() {
  useEffect(() => {
    const headerElement = document.getElementById('header');
    if (headerElement) headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const { data: aiStatus } = useQuery<AIStatus>({ queryKey: ["/api/ai/providers"] });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-blue-100 rounded-xl">
              <BookOpen className="h-7 w-7 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-semibold text-gray-900 tracking-tight">About UnderwriterAI</h1>
              <p className="text-gray-500 text-sm mt-0.5">Intelligent underwriting assistant for SME business operations</p>
            </div>
          </div>
          <p className="text-gray-600 text-base leading-relaxed max-w-3xl">
            UnderwriterAI is a comprehensive multi-agent AI platform that automates routine underwriting decisions,
            provides real-time broker support, and surfaces actionable intelligence from your policy and document library —
            all powered by your choice of AI provider, configurable by administrators.
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="ai">AI Providers</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="control">Control & Safety</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Target className="h-5 w-5 text-blue-600" /> What UnderwriterAI Does
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Designed for insurers and underwriting teams handling SME commercial lines,
                      UnderwriterAI acts as an intelligent layer between brokers and underwriters —
                      handling routine queries automatically while escalating complex cases for human review.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { icon: MessageSquare, label: "Real-time broker chat with AI assistant" },
                        { icon: Upload, label: "Document ingestion and rule extraction" },
                        { icon: Cpu, label: "Automated underwriting decisions" },
                        { icon: BarChart3, label: "Performance analytics and reporting" },
                        { icon: Search, label: "Semantic search across all documents" },
                        { icon: Shield, label: "Role-based access and audit trail" },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-lg">
                          <Icon className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-700">{label}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Activity className="h-4 w-4 text-green-600" /> Live AI Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {aiStatus ? (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                          <span className="text-sm font-medium text-gray-900">
                            {PROVIDER_LABELS[aiStatus.currentProviderKey] || aiStatus.currentProvider}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 pl-4">
                          Model: {aiStatus.currentModel}
                        </p>
                        <Separator className="my-2" />
                        <p className="text-xs text-gray-500">
                          {aiStatus.available.length} provider{aiStatus.available.length !== 1 ? 's' : ''} available
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {aiStatus.available.map(p => (
                            <Badge key={p} variant="outline" className="text-xs">
                              {PROVIDER_LABELS[p] || p}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Loading...</div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-600 to-blue-700 text-white border-0">
                  <CardContent className="pt-5">
                    <div className="text-3xl font-bold mb-1">75%</div>
                    <div className="text-blue-200 text-sm mb-3">Automation Rate</div>
                    <div className="space-y-1.5 text-xs text-blue-100">
                      <div className="flex justify-between"><span>Rule-based response</span><span className="font-medium">&lt;2s</span></div>
                      <div className="flex justify-between"><span>Avg confidence</span><span className="font-medium">85%</span></div>
                      <div className="flex justify-between"><span>Escalation rate</span><span className="font-medium">15%</span></div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-purple-600" /> How It Works
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  {[
                    { step: "1", label: "Broker Query", desc: "Broker submits a request via chat — policy renewal, discount, amendment, or coverage query.", color: "bg-blue-100 text-blue-700" },
                    { step: "2", label: "Rules Engine", desc: "System checks underwriting rules extracted from your policy documents and guidelines.", color: "bg-green-100 text-green-700" },
                    { step: "3", label: "AI Analysis", desc: "If confidence < 80%, the active AI provider analyses context and generates a recommendation.", color: "bg-purple-100 text-purple-700" },
                    { step: "4", label: "Decision", desc: "Approved, declined, or escalated — with full audit trail and reasons logged automatically.", color: "bg-orange-100 text-orange-700" },
                  ].map(({ step, label, desc, color }) => (
                    <div key={step} className="relative">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${color}`}>{step}</div>
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{label}</h4>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI PROVIDERS TAB */}
          <TabsContent value="ai" className="mt-0 space-y-6">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
              <Key className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">Administrator-Controlled Configuration</p>
                <p className="text-sm text-blue-700 mt-0.5">
                  Administrators can add API keys, switch providers, and select from the full live model catalogue directly in{" "}
                  <span className="font-medium">Settings → AI Providers</span> (via the profile menu). The active provider applies to all users instantly.
                  Multiple providers can be configured simultaneously as backups.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {["anthropic", "openai", "gemini", "openrouter"].map(key => {
                const colors = PROVIDER_COLORS[key] || { bg: "bg-gray-50", text: "text-gray-700", dot: "bg-gray-400" };
                const isActive = aiStatus?.currentProviderKey === key;
                const isAvailable = aiStatus?.available.includes(key);
                const models: Record<string, string[]> = {
                  anthropic: ["Claude Opus 4", "Claude Sonnet 4", "Claude Haiku 3.5", "+ more via live API"],
                  openai: ["GPT-4o", "GPT-4o Mini", "GPT-4 Turbo", "o1", "o3-mini", "+ more via live API"],
                  gemini: ["Gemini 2.5 Pro", "Gemini 2.5 Flash", "+ more via live API"],
                  openrouter: ["Claude Sonnet 4", "GPT-4o", "Gemini 2.5 Flash", "Llama 3.3 70B", "+ 300+ models via live API"],
                };
                return (
                  <Card key={key} className={`relative ${isActive ? `ring-2 ring-blue-500` : ""}`}>
                    {isActive && (
                      <div className="absolute -top-2.5 left-4">
                        <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">Active</Badge>
                      </div>
                    )}
                    <CardHeader className={`rounded-t-lg ${colors.bg} pb-3`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${isActive ? "bg-green-500" : isAvailable ? "bg-green-400" : "bg-gray-300"}`} />
                          <CardTitle className={`text-base ${colors.text}`}>{PROVIDER_LABELS[key]}</CardTitle>
                        </div>
                        <Badge variant="outline" className={`text-xs ${isAvailable ? "border-green-300 text-green-700" : "border-gray-200 text-gray-400"}`}>
                          {isAvailable ? "Available" : "Not configured"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-4 space-y-3">
                      <p className="text-sm text-gray-600">{PROVIDER_DESCRIPTIONS[key]}</p>
                      <div>
                        <p className="text-xs font-semibold text-gray-500 mb-1.5">Available Models</p>
                        <div className="flex flex-wrap gap-1.5">
                          {(models[key] || []).map(m => (
                            <Badge key={m} variant="outline" className="text-xs font-normal">
                              <Zap className="h-2.5 w-2.5 mr-1 text-yellow-500" />{m}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      {key === "openrouter" && (
                        <p className="text-xs text-gray-500 bg-gray-50 rounded p-2">
                          <Globe className="h-3 w-3 inline mr-1" />
                          Access multiple providers through a single OpenRouter API key — ideal when you want model flexibility without managing separate keys.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Settings className="h-5 w-5 text-gray-600" /> Managing Providers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { icon: Key, title: "Add API Keys", desc: "Enter API keys for each provider in Settings → AI Providers. Keys are stored securely server-side and never exposed to users." },
                    { icon: Brain, title: "Switch Providers", desc: "Select any configured provider as the active one. Changes apply to all users instantly — no restart required." },
                    { icon: Cpu, title: "Search & Choose Models", desc: "Browse the full live model catalogue from each provider with search, and select the best model for your needs." },
                  ].map(({ icon: Icon, title, desc }) => (
                    <div key={title} className="p-4 bg-gray-50 rounded-lg">
                      <Icon className="h-5 w-5 text-blue-600 mb-2" />
                      <h4 className="font-semibold text-sm text-gray-900 mb-1">{title}</h4>
                      <p className="text-xs text-gray-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FEATURES TAB */}
          <TabsContent value="features" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  icon: Users, color: "text-blue-600", bg: "bg-blue-50",
                  title: "Role-Based Access", items: [
                    "Admin — Full access including AI settings, all data, and user management",
                    "Standard User — Internal underwriting access to chat, documents, rules, and analytics",
                    "External Broker — Chat-only access with AI underwriting assistant",
                  ]
                },
                {
                  icon: MessageSquare, color: "text-green-600", bg: "bg-green-50",
                  title: "Real-time Chat", items: [
                    "WebSocket-powered live AI responses",
                    "Context-aware replies using policy data and document knowledge",
                    "File attachment support for in-chat document analysis",
                    "Full chat history with PDF export",
                  ]
                },
                {
                  icon: FileText, color: "text-purple-600", bg: "bg-purple-50",
                  title: "Document Management", items: [
                    "Ingest PDF, Excel, and text documents",
                    "AI-powered underwriting rule extraction",
                    "Semantic vector search across all documents",
                    "Bulk operations with role-based permissions",
                  ]
                },
                {
                  icon: Cog, color: "text-orange-600", bg: "bg-orange-50",
                  title: "Rules Engine", items: [
                    "Hybrid decision logic: rules-first, AI fallback",
                    "Confidence scoring with automatic escalation < 80%",
                    "Rule creation from documents or manual entry",
                    "Complete decision audit trail",
                  ]
                },
                {
                  icon: BarChart3, color: "text-red-600", bg: "bg-red-50",
                  title: "Analytics", items: [
                    "Broker performance tracking with time filters",
                    "Decision metrics: automation rate, confidence, response time",
                    "Interactive charts and exportable PDF reports",
                    "Real-time activity feed and system health",
                  ]
                },
                {
                  icon: Brain, color: "text-indigo-600", bg: "bg-indigo-50",
                  title: "AI Configuration", items: [
                    "Admin-controlled provider and model selection",
                    "API key management with secure storage",
                    "Multiple providers for redundancy and cost control",
                    "Changes apply immediately to all users",
                  ]
                },
              ].map(({ icon: Icon, color, bg, title, items }) => (
                <Card key={title}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <div className={`p-1.5 rounded-lg ${bg}`}>
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      {title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {items.map(item => (
                        <li key={item} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className={`h-3.5 w-3.5 mt-0.5 flex-shrink-0 ${color}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* ARCHITECTURE TAB */}
          <TabsContent value="architecture" className="mt-0 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: "Frontend", icon: Globe, color: "text-blue-600", bg: "bg-blue-50", items: ["React 18 + TypeScript", "Vite build system", "Tailwind CSS + shadcn/ui", "TanStack Query v5", "Wouter routing", "WebSocket client"] },
                { label: "Backend", icon: Network, color: "text-green-600", bg: "bg-green-50", items: ["Node.js + Express", "TypeScript ESM", "WebSocket server", "Multer file handling", "JWT authentication", "PDF generation (PDFKit)"] },
                { label: "Data Layer", icon: Database, color: "text-purple-600", bg: "bg-purple-50", items: ["SQLite + Drizzle ORM", "Custom vector store", "OpenAI embeddings", "ExcelJS processing", "File system storage", "Migration-ready schema"] },
              ].map(({ label, icon: Icon, color, bg, items }) => (
                <Card key={label}>
                  <CardHeader className={`${bg} rounded-t-lg pb-3`}>
                    <CardTitle className={`flex items-center gap-2 text-base ${color}`}>
                      <Icon className="h-5 w-5" /> {label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4">
                    <ul className="space-y-1.5">
                      {items.map(item => (
                        <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.replace('text-', 'bg-')}`} />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <ArrowRight className="h-5 w-5 text-gray-600" /> Data Flow
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: "Document Processing", flow: "Upload → Validation → AI Extraction → Rule Mining → Vector Embedding → Database" },
                    { label: "Chat Response", flow: "User Message → Context Retrieval → Rules Check → AI Provider → Real-time Response" },
                    { label: "Decision Engine", flow: "Request → Rule Match → Confidence Score → AI Fallback → Decision → Audit Log" },
                    { label: "Provider Switch", flow: "Admin Updates → AIService Reinitialises → All Users Get New Provider → Config Persisted" },
                  ].map(({ label, flow }) => (
                    <div key={label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <Badge variant="outline" className="text-xs whitespace-nowrap mt-0.5">{label}</Badge>
                      <p className="text-sm text-gray-600 font-mono text-xs">{flow}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Search className="h-5 w-5 text-blue-600" />Vector Search</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0" />Custom vector store built for insurance domain</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0" />OpenAI text-embedding-3-small model</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0" />1,000-character chunks with 200-char overlap</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-blue-500 flex-shrink-0" />Cosine similarity search, threshold 0.1</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-600" />Token Management</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-yellow-500 flex-shrink-0" />Automatic content chunking for large documents</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-yellow-500 flex-shrink-0" />Intelligent model selection based on token count</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-yellow-500 flex-shrink-0" />Cost optimisation across providers</div>
                  <div className="flex items-center gap-2"><ChevronRight className="h-4 w-4 text-yellow-500 flex-shrink-0" />Error recovery and retry mechanisms</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* CONTROL & SAFETY TAB */}
          <TabsContent value="control" className="mt-0 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Cog className="h-5 w-5 text-blue-600" /> Decision Control
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-700 mb-1">&gt;80%</div>
                    <div className="text-sm font-medium text-green-800 mb-1">High Confidence</div>
                    <div className="text-xs text-green-600">Automatic approve or decline. No human review needed.</div>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-700 mb-1">60–80%</div>
                    <div className="text-sm font-medium text-yellow-800 mb-1">Medium Confidence</div>
                    <div className="text-xs text-yellow-600">AI recommendation generated. Underwriter review suggested.</div>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-700 mb-1">&lt;60%</div>
                    <div className="text-sm font-medium text-red-800 mb-1">Low Confidence</div>
                    <div className="text-xs text-red-600">Escalated to human underwriter for manual decision.</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Lock className="h-5 w-5 text-red-600" /> Limitations & Risks
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-red-700">AI Risks</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />Hallucination risk — mitigated by confidence scoring and human escalation</li>
                      <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />Context window limits on very large documents</li>
                      <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 flex-shrink-0 text-red-400 mt-0.5" />Provider API outages — configure backup providers for redundancy</li>
                    </ul>
                  </div>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="text-sm font-semibold text-orange-700">Scalability Notes</h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 flex-shrink-0 text-orange-400 mt-0.5" />SQLite → PostgreSQL migration supported via Drizzle ORM</li>
                      <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 flex-shrink-0 text-orange-400 mt-0.5" />Vector store is in-memory — consider external vector DB at scale</li>
                      <li className="flex items-start gap-2"><ChevronRight className="h-4 w-4 flex-shrink-0 text-orange-400 mt-0.5" />File storage is local — use S3 or Azure Blob for production</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5 text-blue-600" /> Security & Privacy
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-blue-50 border border-blue-100 rounded-lg space-y-2">
                    <h4 className="text-sm font-semibold text-blue-800">Data Protection</h4>
                    <ul className="space-y-1 text-sm text-blue-700">
                      <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />JWT-based authentication with role enforcement</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />API keys stored server-side, never sent to browser</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Complete audit trail on all underwriting decisions</li>
                    </ul>
                  </div>
                  <div className="p-3 bg-yellow-50 border border-yellow-100 rounded-lg space-y-2">
                    <h4 className="text-sm font-semibold text-yellow-800">Compliance Notes</h4>
                    <ul className="space-y-1 text-sm text-yellow-700">
                      <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Sensitive insurance data — review AI provider data policies</li>
                      <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Configure data retention periods per your requirements</li>
                      <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />Human oversight is maintained for all critical decisions</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-5 w-5 text-gray-600" /> User Roles & Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { role: "Administrator", color: "bg-blue-600", permissions: ["All system access", "AI provider management", "API key configuration", "User and data oversight", "Analytics and reporting"] },
                    { role: "Standard User", color: "bg-gray-600", permissions: ["Dashboard and analytics", "Chat with AI assistant", "Document management", "Rules management", "PDF report export"] },
                    { role: "External Broker", color: "bg-green-600", permissions: ["Chat with AI assistant", "Policy query support", "Coverage guidance", "Renewal assistance", "Decision summaries"] },
                  ].map(({ role, color, permissions }) => (
                    <div key={role} className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className={`${color} text-white text-sm font-semibold px-4 py-2.5`}>{role}</div>
                      <ul className="p-3 space-y-1.5">
                        {permissions.map(p => (
                          <li key={p} className="flex items-center gap-2 text-xs text-gray-600">
                            <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />{p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
