import React, { useEffect } from "react";
import Header from "../components/Header";
import MetricsCards from "../components/MetricsCards";
import ChatInterface from "../components/ChatInterface";
import QuickActions from "../components/QuickActions";
import Footer from "../components/Footer";

export default function Dashboard() {
  useEffect(() => {
    // Scroll to header when page loads
    const headerElement = document.getElementById('header');
    if (headerElement) {
      headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
            Underwriter Dashboard
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
            AI-powered underwriting assistant for SME business insurance. View analytics, 
            manage documents, and engage with the AI assistant below.
          </p>
        </div>

        <MetricsCards />
        
        {/* AI Chat Assistant and Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8 mb-8">
          <div className="lg:col-span-2">
            <ChatInterface />
          </div>
          <div className="lg:col-span-1">
            <QuickActions />
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
