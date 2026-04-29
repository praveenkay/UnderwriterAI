import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Brain, CheckCircle, ChevronDown, Zap, Settings } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "wouter";

interface ModelOption {
  id: string;
  label: string;
}

interface AIStatus {
  currentProvider: string;
  currentProviderKey: string;
  currentModel: string;
  available: string[];
  modelCatalog: Record<string, ModelOption[]>;
}

const PROVIDER_LABELS: Record<string, string> = {
  anthropic: "Anthropic",
  openai: "OpenAI",
  gemini: "Google Gemini",
  openrouter: "OpenRouter",
};

export default function AIProviderPanel() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [selectedModel, setSelectedModel] = useState<string>("");

  const isAdmin = user?.role === 'admin';

  const { data: status, isLoading } = useQuery<AIStatus>({
    queryKey: ["/api/ai/providers"],
    refetchInterval: false,
    enabled: isAdmin,
  });

  useEffect(() => {
    if (status && !selectedProvider) {
      setSelectedProvider(status.currentProviderKey);
      setSelectedModel(status.currentModel);
    }
  }, [status, selectedProvider]);

  const switchMutation = useMutation({
    mutationFn: async ({ provider, model }: { provider: string; model: string }) => {
      const res = await apiRequest("POST", "/api/ai/provider", { provider, model });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/providers"] });
      toast({
        title: "AI Provider Updated",
        description: `Switched to ${PROVIDER_LABELS[selectedProvider] || selectedProvider} — ${getModelLabel(selectedProvider, selectedModel)}`,
      });
      setIsOpen(false);
    },
    onError: () => {
      toast({
        title: "Switch Failed",
        description: "Could not switch provider. Ensure the API key is configured.",
        variant: "destructive",
      });
    },
  });

  // Admin-only after all hooks
  if (!isAdmin) return null;

  const getModelLabel = (providerKey: string, modelId: string): string => {
    const models = status?.modelCatalog[providerKey] || [];
    return models.find((m) => m.id === modelId)?.label || modelId;
  };

  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    const models = status?.modelCatalog[provider] || [];
    if (models.length > 0) setSelectedModel(models[0].id);
  };

  const handleApply = () => {
    if (selectedProvider && selectedModel) {
      switchMutation.mutate({ provider: selectedProvider, model: selectedModel });
    }
  };

  const hasChanges =
    status &&
    (selectedProvider !== status.currentProviderKey || selectedModel !== status.currentModel);

  if (isLoading || !status) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100">
        <Brain className="h-4 w-4 text-gray-400 animate-pulse" />
      </div>
    );
  }

  const currentModels = status.modelCatalog[selectedProvider] || [];

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          className="flex items-center gap-2 px-3 py-1.5 h-auto hover:bg-gray-100 rounded-lg"
        >
          <Brain className="h-4 w-4 text-blue-600" />
          <div className="hidden md:flex flex-col items-start">
            <span className="text-xs font-medium text-gray-700 leading-tight">
              {PROVIDER_LABELS[status.currentProviderKey] || status.currentProvider}
            </span>
            <span className="text-xs text-gray-400 leading-tight truncate max-w-[120px]">
              {getModelLabel(status.currentProviderKey, status.currentModel)}
            </span>
          </div>
          <ChevronDown className="h-3 w-3 text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-sm text-gray-900">AI Provider</span>
            </div>
            <Link href="/admin" onClick={() => setIsOpen(false)}>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs gap-1 text-gray-500 hover:text-gray-900">
                <Settings className="h-3 w-3" />
                Full Settings
              </Button>
            </Link>
          </div>
          <p className="text-xs text-gray-500 mb-4">
            Select provider and model — applies to all users.
          </p>

          <div className="flex items-center gap-2 mb-4 p-2 bg-gray-50 rounded-lg">
            <CheckCircle className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
            <span className="text-xs text-gray-600">
              Active:{" "}
              <span className="font-medium text-gray-900">
                {PROVIDER_LABELS[status.currentProviderKey] || status.currentProvider}
              </span>{" "}
              /{" "}
              <span className="font-medium text-gray-900">
                {getModelLabel(status.currentProviderKey, status.currentModel)}
              </span>
            </span>
          </div>

          <Separator className="mb-4" />

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Provider</label>
              <div className="grid grid-cols-2 gap-2">
                {status.available.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleProviderChange(key)}
                    className={`text-xs px-3 py-2 rounded-lg border text-left transition-all ${
                      selectedProvider === key
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <div className="font-medium">{PROVIDER_LABELS[key] || key}</div>
                    <div className="text-xs opacity-70 mt-0.5">
                      {(status.modelCatalog[key] || []).length} models
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger className="h-9 text-sm">
                  <SelectValue placeholder="Select model" />
                </SelectTrigger>
                <SelectContent>
                  {currentModels.map((model) => (
                    <SelectItem key={model.id} value={model.id} className="text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="h-3 w-3 text-yellow-500" />
                        {model.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => {
                if (status) {
                  setSelectedProvider(status.currentProviderKey);
                  setSelectedModel(status.currentModel);
                }
                setIsOpen(false);
              }}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={handleApply}
              disabled={!hasChanges || switchMutation.isPending}
            >
              {switchMutation.isPending ? "Switching..." : "Apply"}
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
