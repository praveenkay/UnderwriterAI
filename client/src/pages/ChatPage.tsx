import Header from "../components/Header";
import ChatInterface from "../components/ChatInterface";

export default function ChatPage() {
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
    </div>
  );
}