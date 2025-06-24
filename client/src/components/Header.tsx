import { Bell, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function Header() {
  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-50 backdrop-blur-md bg-white/95">
      <div className="max-w-7xl mx-auto px-8 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-12">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-sm">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
              </div>
              <div>
                <span className="text-xl-swiss text-gray-900">AgentVerse</span>
                <div className="text-xs text-gray-500 font-medium tracking-wide">ZURICH AI UNDERWRITING</div>
              </div>
            </div>
            <nav className="hidden lg:flex space-x-8">
              <a href="#dashboard" className="text-primary font-medium text-sm tracking-wide border-b-2 border-primary pb-2">
                DASHBOARD
              </a>
              <a href="#chat" className="text-gray-500 hover:text-gray-900 transition-colors text-sm tracking-wide pb-2">
                CHAT
              </a>
              <a href="#documents" className="text-gray-500 hover:text-gray-900 transition-colors text-sm tracking-wide pb-2">
                DOCUMENTS
              </a>
              <a href="#analytics" className="text-gray-500 hover:text-gray-900 transition-colors text-sm tracking-wide pb-2">
                ANALYTICS
              </a>
            </nav>
          </div>
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Bell className="h-5 w-5 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors" />
              <div className="status-dot status-error absolute -top-1 -right-1"></div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-gray-600" />
              </div>
              <div className="text-left">
                <div className="text-sm font-medium text-gray-900">Sarah Johnson</div>
                <div className="text-xs text-gray-500">Senior Broker</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
