import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, FileText } from 'lucide-react';
import UserProfilePanel from '@/components/UserProfilePanel';
import Footer from '@/components/Footer';

export default function BrokerDashboard() {
  const { user, logout } = useAuth();

  const { data: policies = [] } = useQuery({
    queryKey: ['/api/policies'],
    queryFn: async () => {
      const response = await fetch('/api/policies');
      if (!response.ok) throw new Error('Failed to fetch policies');
      return response.json();
    },
  });

  const { data: chatSessions = [] } = useQuery({
    queryKey: ['/api/chat/sessions'],
    queryFn: async () => {
      const response = await fetch('/api/chat/sessions');
      if (!response.ok) throw new Error('Failed to fetch chat sessions');
      return response.json();
    },
  });

  const activePolicies = policies.filter((p: any) => p.isActive);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
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
                  className="text-blue-600 font-medium text-sm uppercase tracking-wide border-b-2 border-blue-600 pb-4"
                >
                  DASHBOARD
                </a>
                <a 
                  href="/chat" 
                  className="text-gray-600 hover:text-gray-900 font-medium text-sm uppercase tracking-wide pb-4 transition-colors"
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Policies</p>
                  <p className="text-2xl font-bold text-gray-900">{activePolicies.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Chat Sessions</p>
                  <p className="text-2xl font-bold text-gray-900">{chatSessions.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Premium</p>
                  <p className="text-2xl font-bold text-gray-900">
                    £{activePolicies.reduce((sum: number, p: any) => sum + p.premium, 0).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
          <Button onClick={() => window.location.href = '/chat'} className="flex items-center">
            <MessageSquare className="h-4 w-4 mr-2" />
            Start New Chat
          </Button>
        </div>

        {/* Policies */}
        <Card>
          <CardHeader>
            <CardTitle>My Policies</CardTitle>
            <CardDescription>Your current insurance policies</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activePolicies.map((policy: any) => (
                <div key={policy.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <h3 className="font-medium text-gray-900">{policy.policyNumber}</h3>
                    <p className="text-sm text-gray-500">{policy.clientName}</p>
                    <p className="text-xs text-gray-400">{policy.policyType}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">£{policy.premium.toLocaleString()}</p>
                    <Badge variant="default">Active</Badge>
                  </div>
                </div>
              ))}
              {activePolicies.length === 0 && (
                <p className="text-center text-gray-500 py-8">No active policies found</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Footer />
    </div>
  );
}
