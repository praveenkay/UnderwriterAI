import React, { useState } from "react";
import {
  User, LogOut, Settings, MapPin, Phone, Mail, Building, Shield,
  Edit2, Save, X, Palette, Brain, Key, Cpu, CheckCircle, XCircle,
  Globe, Zap, Trash2, Eye, EyeOff, AlertTriangle, Activity, ChevronsUpDown, Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList,
} from "@/components/ui/command";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface EditableProfile { email: string; phone: string; address: string; region: string; }
interface ChatSettings { autoSave: boolean; enableNotifications: boolean; saveHistory: boolean; }
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

const PROVIDER_INFO: Record<string, { label: string; description: string; website: string; keyPlaceholder: string; color: string; borderColor: string; bgColor: string; }> = {
  anthropic: { label: "Anthropic Claude", description: "State-of-the-art language models for reasoning and document analysis.", website: "console.anthropic.com", keyPlaceholder: "sk-ant-api03-...", color: "text-orange-700", borderColor: "border-orange-200", bgColor: "bg-orange-50" },
  openai: { label: "OpenAI GPT", description: "GPT-4o and GPT-4 Turbo, optimised for document processing.", website: "platform.openai.com", keyPlaceholder: "sk-proj-...", color: "text-green-700", borderColor: "border-green-200", bgColor: "bg-green-50" },
  gemini: { label: "Google Gemini", description: "Gemini 2.5 Pro and Flash for analytics and multi-modal processing.", website: "aistudio.google.com", keyPlaceholder: "AIzaSy...", color: "text-blue-700", borderColor: "border-blue-200", bgColor: "bg-blue-50" },
  openrouter: { label: "OpenRouter", description: "Access multiple AI providers through a single API.", website: "openrouter.ai", keyPlaceholder: "sk-or-v1-...", color: "text-purple-700", borderColor: "border-purple-200", bgColor: "bg-purple-50" },
};

function ModelCombobox({ models, value, onChange, loading }: {
  models: ModelOption[]; value: string; onChange: (v: string) => void; loading: boolean;
}) {
  const [open, setOpen] = useState(false);
  const selected = models.find(m => m.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="flex-1 h-8 justify-between text-xs font-normal px-2 min-w-0"
        >
          <span className="flex items-center gap-1 truncate">
            <Zap className="h-3 w-3 text-yellow-500 shrink-0" />
            <span className="truncate">{loading ? "Loading…" : (selected?.label || value || "Select model…")}</span>
          </span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50 ml-1" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command>
          <CommandInput placeholder="Search models…" className="h-9 text-xs" />
          <CommandList>
            <CommandEmpty className="text-xs py-4">No models found.</CommandEmpty>
            <CommandGroup>
              {loading ? (
                <div className="py-4 text-center text-xs text-gray-400">Fetching models…</div>
              ) : models.map(m => (
                <CommandItem
                  key={m.id}
                  value={m.label}
                  onSelect={() => { onChange(m.id); setOpen(false); }}
                  className="text-xs gap-2"
                >
                  <Check className={`h-3 w-3 ${value === m.id ? "opacity-100" : "opacity-0"}`} />
                  <Zap className="h-3 w-3 text-yellow-500 shrink-0" />
                  <span className="truncate">{m.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ProviderCard({ providerKey, config, isActive, onSetActive, onSaveKey, onRemoveKey, isSwitching }: {
  providerKey: string; config: AdminAIConfig; isActive: boolean;
  onSetActive: (k: string, m: string) => void;
  onSaveKey: (k: string, apiKey: string) => void;
  onRemoveKey: (k: string) => void;
  isSwitching: boolean;
}) {
  const info = PROVIDER_INFO[providerKey] || { label: providerKey, description: "", website: "", keyPlaceholder: "", color: "text-gray-700", borderColor: "border-gray-200", bgColor: "bg-gray-50" };
  const isConfigured = config.configuredProviders.includes(providerKey);
  const isAvailable = config.available.includes(providerKey);
  const maskedKey = config.maskedKeys[providerKey];
  const staticModels = config.modelCatalog[providerKey] || [];

  const [apiKeyInput, setApiKeyInput] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState(isActive ? config.currentModel : (staticModels[0]?.id || ""));
  const [editingKey, setEditingKey] = useState(false);

  // Fetch live models from provider API — fresh every time
  const { data: liveModelsData, isLoading: modelsLoading } = useQuery<{ models: ModelOption[]; fallback?: boolean }>({
    queryKey: [`/api/admin/ai/models/${providerKey}`],
    staleTime: 0,
    refetchOnMount: "always",
  });

  const models = liveModelsData?.models?.length ? liveModelsData.models : staticModels;

  // Sync selectedModel when live models load
  React.useEffect(() => {
    if (models.length && !selectedModel) {
      setSelectedModel(isActive ? config.currentModel : models[0]?.id);
    }
  }, [models, isActive, config.currentModel]);

  const currentValue = isActive ? config.currentModel : selectedModel;

  return (
    <Card className={`relative transition-all ${isActive ? `ring-2 ring-blue-500` : "border-gray-200"}`}>
      {isActive && (
        <div className="absolute -top-2.5 left-4">
          <Badge className="bg-blue-600 text-white text-xs px-2 py-0.5">Active</Badge>
        </div>
      )}
      <CardHeader className={`pb-2 pt-5 rounded-t-lg ${isActive ? info.bgColor : ""}`}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${info.bgColor}`}>
              <Brain className={`h-4 w-4 ${info.color}`} />
            </div>
            <div>
              <CardTitle className="text-sm">{info.label}</CardTitle>
              <div className="flex items-center gap-1 mt-0.5">
                <Globe className="h-3 w-3 text-gray-400" />
                <span className="text-xs text-gray-400">{info.website}</span>
              </div>
            </div>
          </div>
          {isConfigured ? (
            <Badge variant="outline" className="border-green-300 bg-green-50 text-green-700 text-xs gap-1">
              <CheckCircle className="h-3 w-3" /> Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="border-gray-200 bg-gray-50 text-gray-500 text-xs gap-1">
              <XCircle className="h-3 w-3" /> No Key
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="pt-3 space-y-3">
        {/* API Key */}
        <div>
          <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
            <Key className="h-3 w-3" /> API Key
          </label>
          {isConfigured && !editingKey ? (
            <div className="flex items-center gap-1.5">
              <div className="flex-1 px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded text-xs font-mono text-gray-600 truncate">
                {maskedKey || "••••••••••••••••"}
              </div>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs" onClick={() => setEditingKey(true)}>Update</Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 px-2 text-red-500 hover:text-red-700 hover:border-red-300">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Remove API Key</AlertDialogTitle>
                    <AlertDialogDescription>
                      This removes the {info.label} API key and disables this provider for all users.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={() => onRemoveKey(providerKey)}>Remove</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : (
            <div className="flex gap-1.5">
              <div className="relative flex-1">
                <Input
                  type={showKey ? "text" : "password"}
                  placeholder={info.keyPlaceholder}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="pr-8 font-mono text-xs h-8"
                />
                <button type="button" onClick={() => setShowKey(!showKey)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showKey ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
              <Button size="sm" className="h-8 px-3" disabled={!apiKeyInput.trim()} onClick={() => { onSaveKey(providerKey, apiKeyInput.trim()); setApiKeyInput(""); setEditingKey(false); }}>Save</Button>
              {editingKey && (
                <Button variant="outline" size="sm" className="h-8 px-3" onClick={() => { setEditingKey(false); setApiKeyInput(""); }}>Cancel</Button>
              )}
            </div>
          )}
        </div>

        {/* Model Selection — always show if any models available */}
        {(isAvailable || models.length > 0) && (
          <>
            <Separator />
            <div>
              <label className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                <Cpu className="h-3 w-3" /> Model
                {liveModelsData && !liveModelsData.fallback && (
                  <span className="text-gray-400 font-normal">· {models.length} available</span>
                )}
              </label>
              <div className="flex gap-1.5">
                <ModelCombobox
                  models={models}
                  value={currentValue}
                  onChange={(v) => setSelectedModel(v)}
                  loading={modelsLoading}
                />
                {!isActive && (
                  <Button size="sm" className="h-8 px-3 text-xs shrink-0" disabled={isSwitching || !currentValue}
                    onClick={() => onSetActive(providerKey, currentValue || models[0]?.id)}>
                    Set Active
                  </Button>
                )}
                {isActive && (
                  <Button size="sm" variant="outline" className="h-8 px-3 text-xs shrink-0"
                    disabled={isSwitching || selectedModel === config.currentModel || !selectedModel}
                    onClick={() => onSetActive(providerKey, selectedModel)}>
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

export default function UserProfilePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isAdmin = user?.role === 'admin';

  const [editableFields, setEditableFields] = useState<EditableProfile>({
    email: user?.email || "", phone: user?.phone || "", address: user?.address || "", region: user?.region || "",
  });
  const [settings, setSettings] = useState<ChatSettings>({ autoSave: true, enableNotifications: true, saveHistory: true });

  // Fetch full AI config fresh every time settings opens — admin only
  const { data: config, isLoading: configLoading } = useQuery<AdminAIConfig>({
    queryKey: ["/api/admin/ai/config"],
    enabled: isAdmin && isSettingsOpen,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const switchProviderMutation = useMutation({
    mutationFn: async ({ provider, model }: { provider: string; model: string }) => {
      const res = await apiRequest("POST", "/api/ai/provider", { provider, model });
      return res.json();
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/ai/config"] });
      queryClient.invalidateQueries({ queryKey: ["/api/ai/providers"] });
      toast({ title: "Provider Updated", description: `Now using ${PROVIDER_INFO[vars.provider]?.label || vars.provider}. Applies to all users.` });
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
      toast({ title: "Provider Removed", description: `${PROVIDER_INFO[provider]?.label || provider} API key removed.` });
    },
    onError: () => toast({ title: "Remove Failed", description: "Could not remove provider.", variant: "destructive" }),
  });

  const handleLogout = () => { logout(); setIsOpen(false); };
  const handleSettings = () => { setIsSettingsOpen(true); setIsOpen(false); };
  const handleEdit = () => {
    setIsEditing(true);
    setEditableFields({ email: user?.email || "", phone: user?.phone || "", address: user?.address || "", region: user?.region || "" });
  };
  const handleSave = () => setIsEditing(false);
  const handleCancel = () => {
    setIsEditing(false);
    setEditableFields({ email: user?.email || "", phone: user?.phone || "", address: user?.address || "", region: user?.region || "" });
  };
  const handleFieldChange = (field: keyof EditableProfile, value: string) =>
    setEditableFields(prev => ({ ...prev, [field]: value }));

  if (!user) return null;

  const userName = `${user.firstName} ${user.lastName}`;
  const userTitle = user.title || (
    user.role === 'admin' ? 'System Administrator' :
    user.role === 'standard_user' ? 'Standard User' :
    user.role === 'external_broker' ? 'External Broker' : 'User'
  );

  return (
    <>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg">
            <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
              <User className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-left hidden md:block">
              <div className="text-sm font-medium text-gray-900">{userName}</div>
              <div className="text-xs text-gray-500">{userTitle}</div>
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0 max-h-[70vh]" align="end">
          <div className="p-4 max-h-[65vh] overflow-y-auto">
            {/* Profile Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-full flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{userName}</h3>
                  <p className="text-sm text-gray-600">{userTitle}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">{user.company}</Badge>
                </div>
              </div>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={handleEdit}><Edit2 className="h-4 w-4" /></Button>
              )}
            </div>

            <Separator className="my-3" />

            {/* Profile Details */}
            <div className="space-y-3 mb-4">
              {user.department && (
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div><p className="text-sm font-medium text-gray-900">Department</p><p className="text-sm text-gray-600">{user.department}</p></div>
                </div>
              )}
              {user.joinDate && (
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div><p className="text-sm font-medium text-gray-900">Join Date</p><p className="text-sm text-gray-600">{user.joinDate}</p></div>
                </div>
              )}
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  {isEditing ? <Input value={editableFields.email} onChange={(e) => handleFieldChange('email', e.target.value)} className="mt-1 h-8 text-sm" /> : <p className="text-sm text-gray-600">{user.email}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  {isEditing ? <Input value={editableFields.phone} onChange={(e) => handleFieldChange('phone', e.target.value)} className="mt-1 h-8 text-sm" /> : <p className="text-sm text-gray-600">{user.phone}</p>}
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  {isEditing ? <Textarea value={editableFields.address} onChange={(e) => handleFieldChange('address', e.target.value)} className="mt-1 text-sm" rows={2} /> : <p className="text-sm text-gray-600">{user.address}</p>}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Region</p>
                  {isEditing ? <Input value={editableFields.region} onChange={(e) => handleFieldChange('region', e.target.value)} className="mt-1 h-8 text-sm" /> : <p className="text-sm text-gray-600">{user.region}</p>}
                </div>
              </div>
              {user.specializations && user.specializations.length > 0 && (
                <div className="flex items-start space-x-3">
                  <Shield className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Specializations</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.specializations.map((s, i) => <Badge key={i} variant="outline" className="text-xs">{s}</Badge>)}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="flex space-x-2 mb-3">
                <Button onClick={handleSave} size="sm" className="flex-1"><Save className="h-4 w-4 mr-2" />Save</Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1"><X className="h-4 w-4 mr-2" />Cancel</Button>
              </div>
            )}

            <Separator className="my-3" />

            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start" onClick={handleSettings}>
                <Settings className="h-4 w-4 mr-2" />Settings
              </Button>
              <Button variant="outline" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />Sign Out
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className={`${isAdmin ? "max-w-3xl" : "max-w-lg"} max-h-[90vh] overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />Settings
            </DialogTitle>
          </DialogHeader>

          {isAdmin ? (
            /* Admin: tabbed with AI Providers + General */
            <Tabs defaultValue="ai">
              <TabsList className="w-full">
                <TabsTrigger value="ai" className="flex-1 gap-2"><Brain className="h-4 w-4" /> AI Providers</TabsTrigger>
                <TabsTrigger value="general" className="flex-1 gap-2"><Palette className="h-4 w-4" /> General</TabsTrigger>
              </TabsList>

              <TabsContent value="ai" className="space-y-4 mt-4">
                {configLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />)}
                  </div>
                ) : config ? (
                  <>
                    {/* Status banner */}
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <Activity className="h-4 w-4 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-blue-900">
                          Active: {PROVIDER_INFO[config.currentProviderKey]?.label || config.currentProvider} — {config.modelCatalog[config.currentProviderKey]?.find(m => m.id === config.currentModel)?.label || config.currentModel}
                        </p>
                        <p className="text-xs text-blue-700">{config.available.length} provider{config.available.length !== 1 ? 's' : ''} available · changes apply to all users</p>
                      </div>
                      <Badge className="bg-green-500 text-white text-xs">Live</Badge>
                    </div>

                    {config.available.length === 0 && (
                      <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 flex-shrink-0" />
                        <p className="text-sm text-yellow-800">No providers active. Add an API key below to get started.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-600 space-y-1">
                      <p className="font-semibold text-gray-700 flex items-center gap-1"><Key className="h-3 w-3" /> How API keys work</p>
                      <p>Keys are stored server-side and never exposed to end users. Only masked previews are shown.</p>
                      <p>Switching the active provider applies immediately to all users.</p>
                    </div>
                  </>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">Could not load AI configuration.</p>
                )}
              </TabsContent>

              <TabsContent value="general" className="space-y-6 mt-4">
                <GeneralSettings settings={settings} setSettings={setSettings} />
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                  <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            /* Non-admin: general settings only */
            <div className="space-y-6 mt-2">
              <GeneralSettings settings={settings} setSettings={setSettings} />
              <Separator />
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
                <Button onClick={() => setIsSettingsOpen(false)}>Save Settings</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function GeneralSettings({ settings, setSettings }: { settings: ChatSettings; setSettings: React.Dispatch<React.SetStateAction<ChatSettings>> }) {
  const set = (key: keyof ChatSettings, value: boolean) => setSettings(prev => ({ ...prev, [key]: value }));
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-gray-900">Interface</h3>
        </div>
        <div className="pl-7 flex items-center justify-between">
          <div>
            <Label>Enable notifications</Label>
            <p className="text-xs text-gray-500">Show notifications for important events</p>
          </div>
          <Switch checked={settings.enableNotifications} onCheckedChange={(v) => set('enableNotifications', v)} />
        </div>
      </div>
      <Separator />
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          <h3 className="text-base font-semibold text-gray-900">Privacy & Data</h3>
        </div>
        <div className="pl-7 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Save chat history</Label>
              <p className="text-xs text-gray-500">Store conversations for future reference</p>
            </div>
            <Switch checked={settings.saveHistory} onCheckedChange={(v) => set('saveHistory', v)} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label>Auto-save conversations</Label>
              <p className="text-xs text-gray-500">Automatically save important conversations</p>
            </div>
            <Switch checked={settings.autoSave} onCheckedChange={(v) => set('autoSave', v)} />
          </div>
        </div>
      </div>
    </div>
  );
}
