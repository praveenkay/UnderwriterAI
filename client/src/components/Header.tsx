import { Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z"/>
                </svg>
              </div>
              <span className="text-xl font-semibold text-gray-900">AgentVerse</span>
            </div>
            <nav className="hidden md:flex space-x-6">
              <a href="#dashboard" className="text-primary font-medium border-b-2 border-primary pb-1">
                Dashboard
              </a>
              <a href="#chat" className="text-gray-600 hover:text-gray-900 transition-colors">
                Chat Interface
              </a>
              <a href="#documents" className="text-gray-600 hover:text-gray-900 transition-colors">
                Documents
              </a>
              <a href="#rules" className="text-gray-600 hover:text-gray-900 transition-colors">
                Rules Engine
              </a>
              <a href="#analytics" className="text-gray-600 hover:text-gray-900 transition-colors">
                Analytics
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600" />
              <Badge variant="destructive" className="absolute -top-1 -right-1 w-2 h-2 p-0">
                <span className="sr-only">New notifications</span>
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <span className="text-sm font-medium text-gray-700">Sarah Johnson</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
