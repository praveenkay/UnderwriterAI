import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  MessageSquare, 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  Clock,
  Filter,
  Download,
  Search
} from "lucide-react";

interface ActivityEvent {
  id: number;
  eventType: string;
  brokerName: string;
  timestamp: Date;
  entityType: string;
  entityId: number;
  metadata: any;
  duration?: number;
}

export default function ActivityPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [eventTypeFilter, setEventTypeFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: activities = [], isLoading } = useQuery({
    queryKey: ["/api/activity"],
  });

  const eventTypeIcons = {
    chat_message: MessageSquare,
    decision_made: CheckCircle,
    document_uploaded: FileText,
    escalation_created: AlertTriangle,
    default: Activity
  };

  const eventTypeColors = {
    chat_message: "bg-blue-500",
    decision_made: "bg-green-500", 
    document_uploaded: "bg-purple-500",
    escalation_created: "bg-red-500",
    default: "bg-gray-500"
  };

  const filteredActivities = activities.filter((activity: ActivityEvent) => {
    const matchesSearch = 
      activity.brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.eventType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.entityType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEventType = eventTypeFilter === "all" || activity.eventType === eventTypeFilter;

    const matchesDate = dateFilter === "all" || (() => {
      const activityDate = new Date(activity.timestamp);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - activityDate.getTime()) / (1000 * 60 * 60 * 24));
      
      switch (dateFilter) {
        case "today": return daysDiff === 0;
        case "week": return daysDiff <= 7;
        case "month": return daysDiff <= 30;
        default: return true;
      }
    })();

    return matchesSearch && matchesEventType && matchesDate;
  });

  const handleExportActivities = async () => {
    try {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reportType: "activity_log",
          startDate: dateFilter !== "all" ? getDateFilterStartDate() : undefined,
          endDate: new Date()
        }),
      });

      if (!response.ok) throw new Error("Failed to generate report");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `activity-report-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Export failed:", error);
    }
  };

  const getDateFilterStartDate = () => {
    const now = new Date();
    switch (dateFilter) {
      case "today": 
        return new Date(now.getFullYear(), now.getMonth(), now.getDate());
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      case "month":
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      default:
        return undefined;
    }
  };

  const formatTimestamp = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatEventType = (eventType: string) => {
    return eventType.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getEventIcon = (eventType: string) => {
    const IconComponent = eventTypeIcons[eventType as keyof typeof eventTypeIcons] || eventTypeIcons.default;
    return IconComponent;
  };

  const getEventColor = (eventType: string) => {
    return eventTypeColors[eventType as keyof typeof eventTypeColors] || eventTypeColors.default;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-16 bg-gray-200 rounded"></div>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const uniqueEventTypes = [...new Set(activities.map((a: ActivityEvent) => a.eventType))];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Recent Activity</h1>
          <Badge variant="secondary" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {activities.length} Events
          </Badge>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Event Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueEventTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {formatEventType(type)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">Last 7 Days</SelectItem>
                  <SelectItem value="month">Last 30 Days</SelectItem>
                </SelectContent>
              </Select>

              <Button 
                variant="outline" 
                onClick={handleExportActivities}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <div className="space-y-4">
          {filteredActivities.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No activities found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || eventTypeFilter !== "all" || dateFilter !== "all" 
                    ? "Try adjusting your filters."
                    : "No recent activity to display."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredActivities.map((activity: ActivityEvent) => {
              const IconComponent = getEventIcon(activity.eventType);
              const colorClass = getEventColor(activity.eventType);
              
              return (
                <Card key={activity.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-2 rounded-full ${colorClass} text-white`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-medium text-gray-900 dark:text-white">
                            {formatEventType(activity.eventType)}
                          </h3>
                          <span className="text-sm text-gray-500 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatTimestamp(activity.timestamp)}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          {activity.brokerName} • {activity.entityType}
                        </p>
                        
                        {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                          <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                            <strong>Details:</strong>
                            <div className="mt-1 space-y-1">
                              {Object.entries(activity.metadata).map(([key, value]) => (
                                <div key={key} className="flex justify-between">
                                  <span className="text-gray-500 capitalize">
                                    {key.replace(/([A-Z])/g, ' $1').trim()}:
                                  </span>
                                  <span className="text-gray-700 dark:text-gray-300 font-mono">
                                    {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {activity.duration && (
                          <div className="mt-2">
                            <Badge variant="outline" className="text-xs">
                              Duration: {activity.duration}ms
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}