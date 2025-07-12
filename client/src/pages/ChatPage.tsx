import Header from "../components/Header";
import ChatInterface from "../components/ChatInterface";
import { useAuth } from "@/contexts/AuthContext";
import { MessageSquare } from "lucide-react";
import UserProfilePanel from "@/components/UserProfilePanel";
import Footer from "@/components/Footer";

export default function ChatPage() {
  const { user, logout, isExternalBroker } = useAuth();

  // Broker-specific header for external brokers
  if (isExternalBroker) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Broker Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-8">
                <div className="flex items-center">
                  <div className="bg-blue-600 p-2 rounded-lg mr-3">
                    <MessageSquare className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-semibold text-gray-900">Zurich Underwriter</h1>
                    <p className="text-sm text-gray-500">ZURICH AI UNDERWRITING</p>
                  </div>
                </div>
                
                {/* Navigation Links for External Brokers - left aligned */}
                <nav className="flex space-x-8">
                  <a 
                    href="/broker-dashboard" 
                    className="text-gray-600 hover:text-gray-900 font-medium text-sm uppercase tracking-wide pb-4 transition-colors"
                  >
                    DASHBOARD
                  </a>
                  <a 
                    href="/chat" 
                    className="text-blue-600 font-medium text-sm uppercase tracking-wide border-b-2 border-blue-600 pb-4"
                  >
                    CHAT
                  </a>
                </nav>
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                  2
                </div>
                <UserProfilePanel />
              </div>
            </div>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-medium text-gray-900 mb-3">
              Chat with AI Assistant
            </h1>
            <p className="text-gray-600 leading-relaxed">
              Ask me about policies, coverage, underwriting decisions, or any insurance-related questions.
            </p>
          </div>

          <ChatInterface />
        </div>
        
        <Footer />
      </div>
    );
  }

  // Default Zurich user interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
            Chat Interface
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
            Interact directly with the AI underwriting assistant for real-time policy decisions, 
            renewals, and coverage amendments.
          </p>
        </div>

        <div className="max-w-4xl">
          <ChatInterface />
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
