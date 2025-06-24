import React, { useState } from "react";
import { Settings, Bot, MessageSquare, Shield, Bell, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";

interface ChatSettings {
  autoSave: boolean;
  enableNotifications: boolean;
  responseSpeed: number;
  confidenceThreshold: number;
  aiPersonality: string;
  theme: string;
  autoEscalate: boolean;
  saveHistory: boolean;
}

export default function ChatSettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<ChatSettings>({
    autoSave: true,
    enableNotifications: true,
    responseSpeed: 75,
    confidenceThreshold: 85,
    aiPersonality: "professional",
    theme: "auto",
    autoEscalate: true,
    saveHistory: true
  });

  const handleSettingChange = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Implement save functionality
    console.log("Saving settings:", settings);
    setIsOpen(false);
  };

  const resetSettings = () => {
    setSettings({
      autoSave: true,
      enableNotifications: true,
      responseSpeed: 75,
      confidenceThreshold: 85,
      aiPersonality: "professional",
      theme: "auto",
      autoEscalate: true,
      saveHistory: true
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-1" />
          Settings
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Chat Assistant Settings</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* AI Behavior Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bot className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-900">AI Behavior</h3>
            </div>
            
            <div className="space-y-4 pl-7">
              <div className="space-y-2">
                <Label htmlFor="personality">AI Personality</Label>
                <Select 
                  value={settings.aiPersonality} 
                  onValueChange={(value) => handleSettingChange('aiPersonality', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="formal">Formal</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confidence">Confidence Threshold: {settings.confidenceThreshold}%</Label>
                <Slider
                  value={[settings.confidenceThreshold]}
                  onValueChange={(value) => handleSettingChange('confidenceThreshold', value[0])}
                  max={100}
                  min={50}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Minimum confidence level before escalating to human review
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="speed">Response Speed: {settings.responseSpeed}%</Label>
                <Slider
                  value={[settings.responseSpeed]}
                  onValueChange={(value) => handleSettingChange('responseSpeed', value[0])}
                  max={100}
                  min={25}
                  step={25}
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  Faster responses may have lower accuracy
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-escalate">Auto-escalate complex queries</Label>
                  <p className="text-xs text-gray-500">
                    Automatically escalate queries that exceed complexity threshold
                  </p>
                </div>
                <Switch
                  id="auto-escalate"
                  checked={settings.autoEscalate}
                  onCheckedChange={(checked) => handleSettingChange('autoEscalate', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Interface Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-900">Interface</h3>
            </div>
            
            <div className="space-y-4 pl-7">
              <div className="space-y-2">
                <Label htmlFor="theme">Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value) => handleSettingChange('theme', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notifications">Enable notifications</Label>
                  <p className="text-xs text-gray-500">
                    Show desktop notifications for important events
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => handleSettingChange('enableNotifications', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Privacy & Data Settings */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-medium text-gray-900">Privacy & Data</h3>
            </div>
            
            <div className="space-y-4 pl-7">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="save-history">Save chat history</Label>
                  <p className="text-xs text-gray-500">
                    Store conversations for future reference and learning
                  </p>
                </div>
                <Switch
                  id="save-history"
                  checked={settings.saveHistory}
                  onCheckedChange={(checked) => handleSettingChange('saveHistory', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="auto-save">Auto-save conversations</Label>
                  <p className="text-xs text-gray-500">
                    Automatically save important conversations and decisions
                  </p>
                </div>
                <Switch
                  id="auto-save"
                  checked={settings.autoSave}
                  onCheckedChange={(checked) => handleSettingChange('autoSave', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button variant="outline" onClick={resetSettings}>
              Reset to Defaults
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveSettings}>
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}