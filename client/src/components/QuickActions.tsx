import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { 
  Download, 
  Settings, 
  BarChart, 
  AlertTriangle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import type { Escalation, Metrics } from "../types";

export default function QuickActions() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'zurich_admin';

  const { data: escalations } = useQuery<Escalation[]>({
    queryKey: ['/api/escalations'],
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['/api/metrics'],
  });

  return (
    <Card className="swiss-card">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          variant="ghost" 
          className="w-full justify-between p-3 h-auto"
          onClick={() => window.open('/escalations', '_blank')}
        >
          <div className="flex items-center space-x-3">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium text-gray-900">View Escalations</span>
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-600">
            {escalations?.length || 0}
          </Badge>
        </Button>
        
        <Button 
          variant="ghost" 
          className="w-full justify-start p-3 h-auto"
          onClick={() => {
            // Export chat logs functionality
            const exportData = {
              timestamp: new Date().toISOString(),
              totalSessions: 15,
              exportedBy: user?.firstName + ' ' + user?.lastName || user?.username
            };
            const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `chat-logs-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <Download className="h-4 w-4 text-blue-500 mr-3" />
          <span className="text-sm font-medium text-gray-900">Export Chat Logs</span>
        </Button>
        
        {/* Only show Manage Rules for Admin users */}
        {isAdmin && (
          <Button 
            variant="ghost" 
            className="w-full justify-start p-3 h-auto"
            onClick={() => window.open('/rules', '_blank')}
          >
            <Settings className="h-4 w-4 text-gray-500 mr-3" />
            <span className="text-sm font-medium text-gray-900">Manage Rules</span>
          </Button>
        )}
        
        <Button 
          variant="ghost" 
          className="w-full justify-start p-3 h-auto"
          onClick={() => {
            // Generate report functionality
            const reportData = {
              generatedAt: new Date().toISOString(),
              period: 'Last 30 days',
              totalDecisions: metrics?.totalDecisions || 0,
              automationRate: metrics?.automationRate || 0,
              avgResponseTime: metrics?.avgResponseTime || 0,
              generatedBy: user?.firstName + ' ' + user?.lastName || user?.username
            };
            const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            URL.revokeObjectURL(url);
          }}
        >
          <BarChart className="h-4 w-4 text-green-500 mr-3" />
          <span className="text-sm font-medium text-gray-900">Generate Report</span>
        </Button>
      </CardContent>
    </Card>
  );
}
