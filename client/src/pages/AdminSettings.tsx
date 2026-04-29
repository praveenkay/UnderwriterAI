import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Brain, Key, CheckCircle, XCircle, Zap, Eye, EyeOff, Trash2,
  Shield, Settings, ChevronRight, Globe, Cpu, Activity, AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface ModelOption { id: string; label: string; }

interface AdminAIConfig {
  currentProvider: string;
  currentProviderKey: string;
  currentModel: string;
  available: string[];
  modelCatalog: Record<string, ModelOption[]>;
  maskedKeys: Record<string, string>;
  configuredProviders: string[];
  allProviders: string[];
}

const PROVIDER_INFO: Record<string, {
  label: string;
  description: string;
  website: string;
  keyPlaceholder: string;
  keyPrefix: string;
  color: string;
  borderColor: string;
  bgColor: string;
}> = {
  anthropic: {
    label: "Anthropic Claude",
    description: "State-of-the-art language models including Claude Sonnet 4 and Opus 4. Excellent for reasoning and document analysis.",
    website: "console.anthropic.com",
    keyPlaceholder: "sk-ant-api03-...",
    keyPrefix: "sk-ant-",
    color: "text-orange-700",
    borderColor: "border-orange-200",
    bgColor: "bg-orange-50",
  },
  openai: {
    label: "OpenAI GPT",
    description: "GPT-4o and GPT-4 Turbo models. Optimised for document processing with intelligent token chunking.",
    website: "platform.openai.com",
    keyPlaceholder: "sk-proj-...",
    keyPrefix: "sk-",
    color: "text-green-700",
    borderColor: "border-green-200",
    bgColor: "bg-green-50",
  },
  gemini: {
    label: "Google Gemini",
    description: "Gemini 2.5 Pro and Flash models. Excellent for analytics and multi-modal processing.",
    website: "aistudio.google.com",
    keyPlaceholder: "AIzaSy...",
    keyPrefix: "AIza",
    color: "text-blue-700",
    borderColor: "border-blue-200",
    bgColor: "bg-blue-50",
  },
  openrouter: {
    label: "OpenRouter",
    description: "Access multiple AI providers through a single API. Includes Claude, GPT-4o, Gemini, and Llama models.",
    website: "openrouter.ai",
    keyPlaceholder: "sk-or-v1-...",
    keyPrefix: "sk-or-",
    color: "text-purple-700",
    borderColor: "border-purple-200",
    bgColor: "bg-purple-50",
  },
};

function ProviderCard({
  providerKey,
  config,
  isActive,
  onSetActive,
  onSaveKey,
  onRemoveKey,
  isSwitching,
}: {
  providerKey: string;
  config: AdminAIConfig;
  isActive: boolean;
  onSetActive: (key: string, model: string) => void;
  onSaveKey: (key: string, apiKey: string) => void;
  onRemoveKey: (key: string) => void;
  isSwitching: boolean;
}) {
  const info = PROVIDER_INFO[providerKey] || {
    label: providerKey, description: "", website: "", keyPlaceholder: "", keyPrefix: "", color: "text-gray-700", borderColor: "border-gray-200", bgColor: "bg-gray-50"
  };
  const isConfigured = config.configuredProviders.includes(providerKey);
  const isAvailable = config.available.includes(providerKey);
  const maskedKey = config.maskedKeys[providerKey];
  const models = config.modelCatalog[providerKey] || [];
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(
    isActive ? config.currentModel : (models[0]?.id || "")
  );
  const [editingKey, setEditingKey] = useState(false);

  return (
    <Card className={`relative transition-all duration-200 ${isActive ? `ring-2 ring-blue-500 ${info.borderColor}` : "border-gray-200"}`}>
      {isActive && (
        <div className="absolute -top-2.5 left-4">
          <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">Active Provider</Badge>
        </div>
      )}
      <CardHeader className={`pb-3 rounded-t-lg ${isActive ? info.bgColor : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${info.bgColor}`}>
              <Brain className={`h-5 w-5 ${info.color}`} />
            </div>
            <div>
              <CardTitle className="text-base">{info.label}</CardTitle>
              <div className="flex items-center gap-1 mt-0.5">
                <Globe className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">{info.website}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isConfigured ? (
              <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-xs gap-1">
                <CheckCircle className="h-3 w-3" /> Configured
              </Badge>
            ) : (
              <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500 text-xs gap-1">
                <XCircle className="h-3 w-3" /> Not Set
              </Badge>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-2">{info.description}</p>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        {/* API Key Section */}
        <div>
          <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
            <Key className="h-3.5 w-3.5" /> API Key
          </label>
          {isConfigured && !editingKey ? (
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono text-gray-600">
                {maskedKey || "••••••••••••••••"}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3"
                onClick={() => setEditingKey(true)}
              >
                Update
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9 px-3 text-red-500 hover:text-red-700 hover:border-red-300">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove API Key</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the {info.label} API key and disable this provider. If it's currently active, the system will switch to another provider.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onRemoveKey(providerKey)}>
                      Remove
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    type={showKey ? "text" : "password"}
                    placeholder={info.keyPlaceholder}
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    className="pr-9 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  size="sm"
                  className="h-9"
                  disabled={!apiKeyInput.trim()}
                  onClick={() => {
                    onSaveKey(providerKey, apiKeyInput.trim());
                    setApiKeyInput("");
                    setEditingKey(false);
                  }}
                >
                  Save
                </Button>
                {editingKey && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9"
                    onClick={() => { setEditingKey(false); setApiKeyInput(""); }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Model Selection */}
        {isAvailable && models.length > 0 && (
          <>
            <Separator />
            <div>
              <label className="text-xs font-semibold text-gray-700 mb-1.5 block flex items-center gap-1">
                <Cpu className="h-3.5 w-3.5" /> Model
              </label>
              <div className="flex gap-2">
                <Select
                  value={isActive ? config.currentModel : selectedModel}
                  onValueChange={setSelectedModel}
                >
                  <SelectTrigger className="flex-1 h-9 text-sm">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-sm">
                        <div className="flex items-center gap-2">
                          <Zap className="h-3 w-3 text-yellow-500" />
                          {m.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isActive && (
                  <Button
                    size="sm"
                    className="h-9"
                    disabled={isSwitching}
                    onClick={() => onSetActive(providerKey, selectedModel || models[0]?.id)}
                  >
                    Set Active
                  </Button>
                )}
                {isActive && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9"
                    disabled={isSwitching || selectedModel === config.currentModel}
                    onClick={() => onSetActive(providerKey, selectedModel)}
                  >
                    Apply
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Redirect non-admins
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-6 text-center">
            <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">Access Restricted</h2>
            <p className="text-gray-500 text-sm mb-4">Admin settings are only accessible to administrators.</p>
            <Link href="/"><Button>Back to Dashboard</Button></Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { data: config, isLoading } = useQuery<AdminAIConfig>({
    queryKey: ["/api/admin/ai/config"],
  });

  const switchProviderMutation = useMutation({
    mutationFn: async ({ provider, model }: { provider: string; model: string }) => {
      const res = await apiRequest("POST", "/api/ai/provider", { provider, model });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/providers"] });
      toast({ title: "Active Provider Updated", description: `Now using ${PROVIDER_INFO[vars.provider]?.label || vars.provider}. Applies to all users.` });
    },
    onError: () => toast({ title: "Switch Failed", description: "Could not switch provider.", variant: "destructive" }),
  });

  const saveKeyMutation = useMutation({
    mutationFn: async ({ provider, apiKey }: { provider: string; apiKey: string }) => {
      const res = await apiRequest("POST", "/api/admin/ai/key", { provider, apiKey });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/providers"] });
      toast({ title: "API Key Saved", description: `${PROVIDER_INFO[vars.provider]?.label || vars.provider} is now available.` });
    },
    onError: () => toast({ title: "Save Failed", description: "Invalid API key or provider error.", variant: "destructive" }),
  });

  const removeKeyMutation = useMutation({
    mutationFn: async (provider: string) => {
      const res = await apiRequest("DELETE", `/api/admin/ai/key/${provider}`);
      return res.json();
    },
    onSuccess: (_, provider) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/providers"] });
      toast({ title: "Provider Removed", description: `${PROVIDER_INFO[provider]?.label || provider} API key has been removed.` });
    },
    onError: () => toast({ title: "Remove Failed", description: "Could not remove provider.", variant: "destructive" }),
  });

  if (isLoading || !config) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <Header />
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4" />
            <div className="grid grid-cols-2 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-64 bg-gray-200 rounded-xl" />)}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />

      <div className="max-w-7xl mx-auto px-8 py-10">
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
            <Link href="/"><span className="hover:text-gray-900 cursor-pointer">Dashboard</span></Link>
            <ChevronRight className="h-3.5 w-3.5" />
            <span className="text-gray-900 font-medium">Admin Settings</span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-xl">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <h1 className="text-2xl font-semibold text-gray-900">Admin Settings</h1>
          </div>
          <p className="text-gray-500">
            Configure AI providers, manage API keys, and control system-wide settings.
            Changes apply immediately to all users.
          </p>
        </div>

        {/* Status Banner */}
        <div className="flex items-center gap-3 p-4 mb-8 bg-blue-50 border border-blue-200 rounded-xl">
          <Activity className="h-5 w-5 text-blue-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-blue-900">
              Active: {PROVIDER_INFO[config.currentProviderKey]?.label || config.currentProvider}
              {" — "}
              {config.modelCatalog[config.currentProviderKey]?.find(m => m.id === config.currentModel)?.label || config.currentModel}
            </p>
            <p className="text-xs text-blue-700">
              {config.available.length} provider{config.available.length !== 1 ? 's' : ''} available · Changes apply to all users immediately
            </p>
          </div>
          <Badge className="bg-green-500 text-white text-xs">Live</Badge>
        </div>

        <Tabs defaultValue="providers">
          <TabsList className="mb-6">
            <TabsTrigger value="providers" className="gap-2">
              <Brain className="h-4 w-4" /> AI Providers
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" /> Security Notes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="providers">
            {config.available.length === 0 && (
              <div className="flex items-center gap-3 p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0" />
                <p className="text-sm text-yellow-800">
                  No AI providers are currently active. Add an API key below to get started.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {config.allProviders.map((key) => (
                <ProviderCard
                  key={key}
                  providerKey={key}
                  config={config}
                  isActive={config.currentProviderKey === key}
                  onSetActive={(provider, model) => switchProviderMutation.mutate({ provider, model })}
                  onSaveKey={(provider, apiKey) => saveKeyMutation.mutate({ provider, apiKey })}
                  onRemoveKey={(provider) => removeKeyMutation.mutate(provider)}
                  isSwitching={switchProviderMutation.isPending}
                />
              ))}
            </div>

            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                <Key className="h-4 w-4" /> How API Keys Work
              </h3>
              <ul className="text-xs text-gray-600 space-y-1.5">
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" /> API keys are stored securely and used server-side — never exposed to end users.</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" /> Keys set here persist across sessions. They can also be pre-configured as environment variables.</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" /> Switching the active provider applies immediately — all users will use the new provider.</li>
                <li className="flex items-start gap-2"><ChevronRight className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-gray-400" /> At least one provider must be active at all times.</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="security">
            <div className="space-y-6 max-w-3xl">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Shield className="h-5 w-5 text-blue-600" /> API Key Security
                  </CardTitle>
                  <CardDescription>Best practices for managing your AI provider credentials.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2 text-sm">What we do to protect your keys</h4>
                    <ul className="text-sm text-green-700 space-y-1.5">
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> Keys are stored server-side and never sent to the browser</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> Only masked previews (first 4 / last 4 characters) are displayed</li>
                      <li className="flex items-start gap-2"><CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0" /> API calls are made from the server, not the client</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h4 className="font-medium text-yellow-800 mb-2 text-sm">Recommendations</h4>
                    <ul className="text-sm text-yellow-700 space-y-1.5">
                      <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" /> For production use, set keys as environment variables rather than through this UI</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" /> Rotate API keys regularly and monitor usage in your provider dashboards</li>
                      <li className="flex items-start gap-2"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" /> Use provider-specific API key restrictions where available</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Activity className="h-5 w-5 text-purple-600" /> Access Control
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-sm text-gray-600">
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 flex-shrink-0" />
                      <div><span className="font-medium text-gray-900">Administrator</span> — Full access to AI settings, API key management, and provider switching.</div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div><span className="font-medium text-gray-900">Standard User</span> — Uses the active provider/model configured by the administrator.</div>
                    </div>
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-gray-400 rounded-full mt-1.5 flex-shrink-0" />
                      <div><span className="font-medium text-gray-900">External Broker</span> — Chat access only. No visibility into AI configuration.</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Footer />
    </div>
  );
}
