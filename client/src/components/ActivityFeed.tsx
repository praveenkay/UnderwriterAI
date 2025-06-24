import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ExternalLink, 
  Download, 
  Settings, 
  BarChart, 
  AlertTriangle,
  Clock
} from "lucide-react";
import type { UnderwritingDecision, Escalation, Metrics } from "../types";

export default function ActivityFeed() {
  const [selectedPeriod, setSelectedPeriod] = useState("7");
  
  const { data: recentDecisions } = useQuery<UnderwritingDecision[]>({
    queryKey: ['/api/decisions/recent'],
  });

  const { data: escalations } = useQuery<Escalation[]>({
    queryKey: ['/api/escalations'],
  });

  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['/api/metrics'],
  });

  // Mock data for different time periods
  const getMetricsForPeriod = (days: string) => {
    const baseMetrics = metrics;
    if (!baseMetrics) return null;
    
    const multipliers = {
      "7": 1,
      "30": 1.2,
      "90": 1.5
    };
    
    const multiplier = multipliers[days as keyof typeof multipliers] || 1;
    
    return {
      ...baseMetrics,
      automationRate: Math.min(95, Math.round(baseMetrics.automationRate * multiplier)),
      avgResponseTime: Math.round(baseMetrics.avgResponseTime / multiplier),
      brokerSatisfaction: Math.min(5, baseMetrics.brokerSatisfaction * multiplier),
      totalDecisions: Math.round(baseMetrics.totalDecisions * multiplier)
    };
  };

  const periodMetrics = getMetricsForPeriod(selectedPeriod);

  const formatTimeAgo = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes} minutes ago`;
    if (minutes < 1440) return `${Math.floor(minutes / 60)} hours ago`;
    return `${Math.floor(minutes / 1440)} days ago`;
  };

  return (
    <div className="space-y-6">
      {/* Rules Engine Status */}
      <Card className="swiss-card">
        <CardHeader>
          <CardTitle className="text-lg font-medium text-gray-900">System Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Active Rules</span>
            <span className="text-sm font-medium text-gray-900">
              {metrics?.totalRules || 0}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Confidence Level</span>
            <span className="text-sm font-medium text-green-600">
              {metrics?.avgConfidence || 0}%
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Last Updated</span>
            <span className="text-sm text-gray-500">2 hours ago</span>
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Rule Updates</h4>
            <div className="space-y-2">
              <div className="text-xs text-gray-600">
                <span className="font-medium text-green-600">Added:</span> SME Renewal Discount (5-10%)
              </div>
              <div className="text-xs text-gray-600">
                <span className="font-medium text-blue-600">Modified:</span> Fire Risk Coverage Limits
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
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
                exportedBy: 'Sarah Johnson'
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
          
          <Button 
            variant="ghost" 
            className="w-full justify-start p-3 h-auto"
            onClick={() => window.open('/rules', '_blank')}
          >
            <Settings className="h-4 w-4 text-gray-500 mr-3" />
            <span className="text-sm font-medium text-gray-900">Manage Rules</span>
          </Button>
          
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
                avgResponseTime: metrics?.avgResponseTime || 0
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

      {/* Recent Activity */}
      <Card className="swiss-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Recent Activity</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-primary hover:text-primary/80"
              onClick={() => window.open('/activity', '_blank')}
            >
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentDecisions && recentDecisions.length > 0 ? (
              recentDecisions.slice(0, 4).map((decision) => (
                <div key={decision.id} className="flex items-start space-x-4">
                  <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                    decision.decision === 'approved' ? 'bg-green-500' :
                    decision.decision === 'escalated' ? 'bg-orange-500' : 'bg-red-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">
                        {decision.requestType === 'discount' ? 'Discount request' : decision.requestType}
                      </span> - {decision.decision}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatTimeAgo(new Date(decision.timestamp))} • 
                      Response time: {(decision.responseTime / 1000).toFixed(1)}s
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <Clock className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Performance Analytics */}
      <Card className="swiss-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-medium text-gray-900">Performance Analytics</CardTitle>
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7 days</SelectItem>
                <SelectItem value="30">Last 30 days</SelectItem>
                <SelectItem value="90">Last 90 days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Automation Success Rate</span>
              <span className="text-sm font-medium text-gray-900">
                {periodMetrics?.automationRate || 0}%
              </span>
            </div>
            <Progress value={periodMetrics?.automationRate || 0} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Average Response Time</span>
              <span className="text-sm font-medium text-gray-900">
                {periodMetrics ? (periodMetrics.avgResponseTime / 1000).toFixed(1) : 0}s
              </span>
            </div>
            <Progress value={Math.min(100, 100 - (periodMetrics?.avgResponseTime || 1000) / 50)} className="h-2" />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Broker Satisfaction</span>
              <span className="text-sm font-medium text-gray-900">
                {periodMetrics?.brokerSatisfaction || 0}/5
              </span>
            </div>
            <Progress value={(periodMetrics?.brokerSatisfaction || 0) * 20} className="h-2" />
          </div>
          
          <div className="pt-4 border-t border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Top Decision Categories</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Renewal Discounts</span>
                <span className="text-sm font-medium text-gray-900">42%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Coverage Amendments</span>
                <span className="text-sm font-medium text-gray-900">28%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Policy Queries</span>
                <span className="text-sm font-medium text-gray-900">21%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Escalations</span>
                <span className="text-sm font-medium text-gray-900">9%</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
