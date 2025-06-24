import Header from "../components/Header";
import MetricsCards from "../components/MetricsCards";
import ChatInterface from "../components/ChatInterface";
import DocumentUpload from "../components/DocumentUpload";
import ActivityFeed from "../components/ActivityFeed";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
            AI Underwriting Assistant
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
            Streamline broker interactions with intelligent automation, instant decision-making, 
            and comprehensive policy management for Zurich's SME business insurance.
          </p>
        </div>

        <MetricsCards />
        
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8 mt-12">
          <div className="xl:col-span-3">
            <ChatInterface />
          </div>
          
          <div className="xl:col-span-2 space-y-8">
            <DocumentUpload />
            <ActivityFeed />
          </div>
        </div>
        
        {/* Swiss Design Footer Info */}
        <div className="mt-16 pt-8 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm text-gray-500">
            <div>
              <div className="font-medium text-gray-900 mb-2">Response Time</div>
              <div>Average: 1.2s • Target: &lt;2s</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-2">Automation Rate</div>
              <div>Current: 73% • Goal: 80%</div>
            </div>
            <div>
              <div className="font-medium text-gray-900 mb-2">System Status</div>
              <div className="flex items-center space-x-2">
                <div className="status-dot status-active"></div>
                <span>All systems operational</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
