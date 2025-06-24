import Header from "../components/Header";
import MetricsCards from "../components/MetricsCards";
import ActivityFeed from "../components/ActivityFeed";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import type { Metrics, UnderwritingDecision } from "../types";

export default function AnalyticsPage() {
  const { data: metrics } = useQuery<Metrics>({
    queryKey: ['/api/metrics'],
  });

  const { data: recentDecisions } = useQuery<UnderwritingDecision[]>({
    queryKey: ['/api/decisions/recent'],
  });

  // Mock data for charts
  const weeklyData = [
    { name: 'Mon', decisions: 45, automation: 78 },
    { name: 'Tue', decisions: 52, automation: 82 },
    { name: 'Wed', decisions: 38, automation: 75 },
    { name: 'Thu', decisions: 61, automation: 85 },
    { name: 'Fri', decisions: 48, automation: 79 },
    { name: 'Sat', decisions: 23, automation: 88 },
    { name: 'Sun', decisions: 19, automation: 92 },
  ];

  const decisionTypeData = [
    { name: 'Renewals', value: 42, color: '#3b82f6' },
    { name: 'Amendments', value: 28, color: '#10b981' },
    { name: 'New Policies', value: 21, color: '#f59e0b' },
    { name: 'Escalations', value: 9, color: '#ef4444' },
  ];

  const responseTimeData = [
    { hour: '09:00', avgTime: 1.2 },
    { hour: '10:00', avgTime: 0.9 },
    { hour: '11:00', avgTime: 1.1 },
    { hour: '12:00', avgTime: 1.4 },
    { hour: '13:00', avgTime: 1.3 },
    { hour: '14:00', avgTime: 1.0 },
    { hour: '15:00', avgTime: 0.8 },
    { hour: '16:00', avgTime: 1.1 },
    { hour: '17:00', avgTime: 1.5 },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
            Analytics Dashboard
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
            Comprehensive insights into AI performance, broker satisfaction, 
            and underwriting decision patterns.
          </p>
        </div>

        <MetricsCards />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <Card className="swiss-card">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Weekly Decision Volume</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="decisions" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="swiss-card">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-gray-900">Decision Types</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={decisionTypeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {decisionTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {decisionTypeData.map((item) => (
                  <div key={item.name} className="flex items-center space-x-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="swiss-card">
              <CardHeader>
                <CardTitle className="text-lg font-medium text-gray-900">Response Time Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={responseTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}s`, 'Avg Response Time']} />
                    <Line 
                      type="monotone" 
                      dataKey="avgTime" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-1">
            <ActivityFeed />
          </div>
        </div>

        {/* Performance Summary */}
        <Card className="swiss-card mt-8">
          <CardHeader>
            <CardTitle className="text-lg font-medium text-gray-900">Performance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{metrics?.totalPolicies || 0}</div>
                <div className="text-sm text-gray-500">Active Policies</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">{metrics?.totalRules || 0}</div>
                <div className="text-sm text-gray-500">Active Rules</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">99.7%</div>
                <div className="text-sm text-gray-500">System Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">2.8k</div>
                <div className="text-sm text-gray-500">Requests/Hour</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}