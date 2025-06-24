import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { User, Settings, Save, Mail, Phone, MapPin, Building, Shield } from "lucide-react";

export default function UserProfile() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/user/settings"],
  });

  const updateSettingsMutation = useMutation({
    mutationFn: async (newSettings: any) => {
      return apiRequest("/api/user/settings", {
        method: "POST",
        body: JSON.stringify(newSettings),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user/settings"] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const [formData, setFormData] = useState({
    // Profile data
    firstName: "John",
    lastName: "Smith",
    email: "john.smith@zurich.com",
    phone: "+1 (555) 123-4567",
    department: "Commercial Underwriting",
    location: "New York, NY",
    employeeId: "ZUR001234",
    
    // AI Settings
    aiPersonality: settings?.aiPersonality || "professional",
    autoSaveChats: settings?.autoSaveChats ?? true,
    notificationsEnabled: settings?.notificationsEnabled ?? true,
    dataRetentionDays: settings?.dataRetentionDays || 90,
    privacyLevel: settings?.privacyLevel || "standard",
  });

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveSettings = () => {
    const settingsData = {
      aiPersonality: formData.aiPersonality,
      autoSaveChats: formData.autoSaveChats,
      notificationsEnabled: formData.notificationsEnabled,
      dataRetentionDays: formData.dataRetentionDays,
      privacyLevel: formData.privacyLevel,
    };
    
    updateSettingsMutation.mutate(settingsData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
              <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">User Profile & Settings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Manage your account information and AI assistant preferences
            </p>
          </div>
          <Button 
            onClick={handleSaveSettings}
            disabled={updateSettingsMutation.isPending}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {updateSettingsMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Profile Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="department" className="flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Department
                </Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={(e) => handleInputChange("department", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="location" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Location
                </Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleInputChange("location", e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="employeeId">Employee ID</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  disabled
                  className="bg-gray-100 dark:bg-gray-800"
                />
              </div>
            </CardContent>
          </Card>

          {/* AI Assistant Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                AI Assistant Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="aiPersonality">AI Personality</Label>
                <Select
                  value={formData.aiPersonality}
                  onValueChange={(value) => handleInputChange("aiPersonality", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="friendly">Friendly</SelectItem>
                    <SelectItem value="concise">Concise</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Choose how the AI assistant communicates with you
                </p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoSaveChats">Auto-save Chat History</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically save conversations to database
                  </p>
                </div>
                <Switch
                  id="autoSaveChats"
                  checked={formData.autoSaveChats}
                  onCheckedChange={(checked) => handleInputChange("autoSaveChats", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="notificationsEnabled">Enable Notifications</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive alerts for escalations and updates
                  </p>
                </div>
                <Switch
                  id="notificationsEnabled"
                  checked={formData.notificationsEnabled}
                  onCheckedChange={(checked) => handleInputChange("notificationsEnabled", checked)}
                />
              </div>

              <div>
                <Label htmlFor="dataRetention">Data Retention (Days)</Label>
                <div className="mt-2">
                  <Slider
                    value={[formData.dataRetentionDays]}
                    onValueChange={(value) => handleInputChange("dataRetentionDays", value[0])}
                    max={365}
                    min={30}
                    step={30}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mt-1">
                    <span>30 days</span>
                    <span className="font-medium">{formData.dataRetentionDays} days</span>
                    <span>365 days</span>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="privacyLevel" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Privacy Level
                </Label>
                <Select
                  value={formData.privacyLevel}
                  onValueChange={(value) => handleInputChange("privacyLevel", value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal - Basic data only</SelectItem>
                    <SelectItem value="standard">Standard - Normal analytics</SelectItem>
                    <SelectItem value="full">Full - Complete tracking</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Additional Information */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="notes">Notes & Preferences</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes about your work preferences, special requirements, or other relevant information..."
                className="mt-2"
                rows={4}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}