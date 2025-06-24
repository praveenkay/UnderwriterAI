import Header from "../components/Header";
import MetricsCards from "../components/MetricsCards";
import ChatInterface from "../components/ChatInterface";
import DocumentUpload from "../components/DocumentUpload";
import ActivityFeed from "../components/ActivityFeed";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <MetricsCards />
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <ChatInterface />
          
          <div className="space-y-6">
            <DocumentUpload />
            <ActivityFeed />
          </div>
        </div>
      </div>
    </div>
  );
}
