import { useState } from "react";
import { User, LogOut, Settings, MapPin, Phone, Mail, Building, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

interface BrokerProfile {
  name: string;
  title: string;
  category: string;
  brokerCode: string;
  email: string;
  phone: string;
  address: string;
  licenseNumber: string;
  joinDate: string;
  region: string;
  specializations: string[];
}

const brokerProfile: BrokerProfile = {
  name: "Sarah Johnson",
  title: "Senior Broker",
  category: "Commercial Lines Specialist",
  brokerCode: "SJ-4829",
  email: "sarah.johnson@zurich.com",
  phone: "+44 20 7123 4567",
  address: "25 Fenchurch Street, London EC3M 3BE",
  licenseNumber: "UK-BRK-789123",
  joinDate: "March 2019",
  region: "London & South East",
  specializations: ["SME Insurance", "Commercial Property", "Liability"]
};

export default function UserProfilePanel() {
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    // Implement logout logic
    console.log("Logging out...");
    setIsOpen(false);
  };

  const handleSettings = () => {
    // Navigate to settings
    console.log("Opening settings...");
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" className="flex items-center space-x-3 p-2 hover:bg-gray-100 rounded-lg">
          <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
            <User className="h-4 w-4 text-gray-600" />
          </div>
          <div className="text-left hidden md:block">
            <div className="text-sm font-medium text-gray-900">{brokerProfile.name}</div>
            <div className="text-xs text-gray-500">{brokerProfile.title}</div>
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4">
          {/* Profile Header */}
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-blue-600/10 rounded-full flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{brokerProfile.name}</h3>
              <p className="text-sm text-gray-600">{brokerProfile.title}</p>
              <Badge variant="secondary" className="mt-1 text-xs">
                {brokerProfile.category}
              </Badge>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Profile Details */}
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Shield className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Broker Code</p>
                <p className="text-sm text-gray-600">{brokerProfile.brokerCode}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Mail className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email</p>
                <p className="text-sm text-gray-600">{brokerProfile.email}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Phone</p>
                <p className="text-sm text-gray-600">{brokerProfile.phone}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Office Address</p>
                <p className="text-sm text-gray-600">{brokerProfile.address}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Building className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-900">Region</p>
                <p className="text-sm text-gray-600">{brokerProfile.region}</p>
              </div>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Specializations */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-900 mb-2">Specializations</p>
            <div className="flex flex-wrap gap-2">
              {brokerProfile.specializations.map((spec, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {spec}
                </Badge>
              ))}
            </div>
          </div>

          <Separator className="my-4" />

          {/* License & Join Date */}
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">License Number</span>
              <span className="text-sm font-medium text-gray-900">{brokerProfile.licenseNumber}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Joined</span>
              <span className="text-sm font-medium text-gray-900">{brokerProfile.joinDate}</span>
            </div>
          </div>

          <Separator className="my-4" />

          {/* Action Buttons */}
          <div className="flex flex-col space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start" 
              onClick={handleSettings}
            >
              <Settings className="h-4 w-4 mr-2" />
              Account Settings
            </Button>
            <Button 
              variant="ghost" 
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
  );
}