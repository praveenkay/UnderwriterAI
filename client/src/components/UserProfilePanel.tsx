import React, { useState } from "react";
import { User, LogOut, Settings, MapPin, Phone, Mail, Building, Shield, Edit2, Save, X, Users, Bot, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";

interface EditableProfile {
  email: string;
  phone: string;
  address: string;
  region: string;
}

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

export default function UserProfilePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isUserManagementOpen, setIsUserManagementOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { user, logout } = useAuth();

  // Initialize editable fields
  const [editableFields, setEditableFields] = useState<EditableProfile>({
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    region: user?.region || "",
  });

  // Initialize chat settings
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

  const handleLogout = () => {
    logout();
    setIsOpen(false);
  };

  const handleSettings = () => {
    setIsSettingsOpen(true);
    setIsOpen(false);
  };

  const handleSettingChange = (key: keyof ChatSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    // Implement save functionality
    console.log("Saving settings:", settings);
    setIsSettingsOpen(false);
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

  const handleEdit = () => {
    setIsEditing(true);
    setEditableFields({
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      region: user?.region || "",
    });
  };

  const handleSave = async () => {
    try {
      // Here you would typically make an API call to update the user profile
      console.log("Saving profile:", editableFields);
      // For now, just simulate success
      setIsEditing(false);
      // In a real app, you'd update the user context with the new data
    } catch (error) {
      console.error("Failed to save profile:", error);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditableFields({
      email: user?.email || "",
      phone: user?.phone || "",
      address: user?.address || "",
      region: user?.region || "",
    });
  };

  const handleFieldChange = (field: keyof EditableProfile, value: string) => {
    setEditableFields(prev => ({ ...prev, [field]: value }));
  };

  const handleUserManagement = () => {
    setIsUserManagementOpen(true);
    setIsOpen(false);
  };

  if (!user) return null;

  const userName = `${user.firstName} ${user.lastName}`;
  const userTitle = user.title || (
    user.role === 'zurich_admin' ? 'Admin User' : 
    user.role === 'zurich_user' ? 'Zurich User' :
    user.role === 'external_broker' ? 'External Broker' : 'User'
  );

  const isAdmin = user.role === 'zurich_admin';

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
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {user.company}
                  </Badge>
                </div>
              </div>
              {!isEditing && (
                <Button variant="ghost" size="sm" onClick={handleEdit}>
                  <Edit2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <Separator className="my-4" />

            {/* Profile Details */}
            <div className="space-y-4 mb-4">
              {/* Non-editable fields */}
              {user.department && (
                <div className="flex items-center space-x-3">
                  <Building className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Department</p>
                    <p className="text-sm text-gray-600">{user.department}</p>
                  </div>
                </div>
              )}

              {user.joinDate && (
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Join Date</p>
                    <p className="text-sm text-gray-600">{user.joinDate}</p>
                  </div>
                </div>
              )}

              {user.licenseNumber && (
                <div className="flex items-center space-x-3">
                  <Shield className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">License Number</p>
                    <p className="text-sm text-gray-600">{user.licenseNumber}</p>
                  </div>
                </div>
              )}

              {/* Editable fields */}
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Email</p>
                  {isEditing ? (
                    <Input
                      value={editableFields.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{user.email}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Phone</p>
                  {isEditing ? (
                    <Input
                      value={editableFields.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{user.phone}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-1" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Address</p>
                  {isEditing ? (
                    <Textarea
                      value={editableFields.address}
                      onChange={(e) => handleFieldChange('address', e.target.value)}
                      className="mt-1"
                      rows={2}
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{user.address}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <MapPin className="h-4 w-4 text-gray-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Region</p>
                  {isEditing ? (
                    <Input
                      value={editableFields.region}
                      onChange={(e) => handleFieldChange('region', e.target.value)}
                      className="mt-1"
                    />
                  ) : (
                    <p className="text-sm text-gray-600">{user.region}</p>
                  )}
                </div>
              </div>

              {/* Specializations */}
              {user.specializations && user.specializations.length > 0 && (
                <div className="flex items-start space-x-3">
                  <Shield className="h-4 w-4 text-gray-400 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Specializations</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {user.specializations.map((spec, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Edit Actions */}
            {isEditing && (
              <div className="flex space-x-2 mb-4">
                <Button onClick={handleSave} size="sm" className="flex-1">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleCancel} variant="outline" size="sm" className="flex-1">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            )}

            <Separator className="my-4" />

            {/* Action Buttons - Consistent for all users */}
            <div className="space-y-2">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={handleSettings}
              >
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* User Management Dialog for Admin */}
      <Dialog open={isUserManagementOpen} onOpenChange={setIsUserManagementOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>User Management</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <div className="text-center text-gray-500 py-8">
              <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium mb-2">User Management System</h3>
              <p className="text-sm">
                Complete user management functionality would be implemented here.
                <br />
                This would include user creation, role assignment, access control, and user activity monitoring.
              </p>
              <div className="mt-6 space-y-2 text-left max-w-md mx-auto">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm">Admin Capabilities:</h4>
                  <ul className="text-xs text-gray-600 mt-1 space-y-1">
                    <li>• Create and manage user accounts</li>
                    <li>• Assign roles and permissions</li>
                    <li>• Monitor user activity and access logs</li>
                    <li>• Configure system-wide settings</li>
                    <li>• Manage external broker access</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Settings Dialog */}
      <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Settings</span>
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Hide entire AI Behavior section for external brokers */}
            {user.role !== 'external_broker' && (
              <>
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
              </>
            )}

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
                <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>
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
    </>
  );
}
