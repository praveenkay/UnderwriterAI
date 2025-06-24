import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare, 
  FileText, 
  AlertTriangle, 
  CheckCircle,
  Clock,
  Download,
  TrendingUp,
  Users,
  Target
} from "lucide-react";

export default function ActivityDetails() {
  const { data: recentDecisions = [], isLoading: decisionsLoading } = useQuery({
    queryKey: ["/api/decisions/recent"],
  });

  const { data: documents = [], isLoading: documentsLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const { data: escalations = [], isLoading: escalationsLoading } = useQuery({
    queryKey: ["/api/escalations"],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/chat/sessions"],
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'declined':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'escalated':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'pending':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  if (decisionsLoading || documentsLoading || escalationsLoading || sessionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid gap-6 md:grid-cols-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Activity Overview</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Detailed view of all your recent activities and performance metrics
            </p>
          </div>
          
          <Button
            onClick={() => window.open('/api/reports/broker-performance', '_blank')}
            className="flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Export Full Report
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Decisions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {recentDecisions.length}
                  </p>
                </div>
                <Target className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Documents</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {documents.length}
                  </p>
                </div>
                <FileText className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Chat Sessions</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {sessions.length}
                  </p>
                </div>
                <MessageSquare className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Escalations</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {escalations.length}
                  </p>
                </div>
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Recent Decisions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Recent Decisions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {recentDecisions.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No recent decisions found
                  </p>
                ) : (
                  recentDecisions.slice(0, 10).map((decision, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {decision.requestType?.toUpperCase() || 'UNKNOWN'}
                          </span>
                          <Badge className={getDecisionColor(decision.decision)}>
                            {decision.decision}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {decision.decisionReason}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(decision.timestamp)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {((decision.confidence || 0) * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-gray-500">confidence</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Document Processing */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Document Processing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {documents.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No documents found
                  </p>
                ) : (
                  documents.slice(0, 10).map((document) => (
                    <div key={document.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {document.originalFilename}
                          </span>
                          <Badge className={getStatusColor(document.status)}>
                            {document.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 capitalize">
                          {document.fileType.replace('_', ' ')}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(document.uploadDate)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-green-600">
                          {Array.isArray(document.extractedRules) ? document.extractedRules.length : 0}
                        </div>
                        <div className="text-xs text-gray-500">rules</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Chat Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Chat Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {sessions.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">
                    No chat sessions found
                  </p>
                ) : (
                  sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            Session {session.sessionId.slice(-8)}
                          </span>
                          <Badge variant="outline">
                            {session.messageCount} messages
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          {session.topics?.length > 0 ? session.topics.join(', ') : 'General discussion'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Last activity: {formatDate(session.lastActivity)}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(`/api/reports/chat-history/${session.sessionId}`, '_blank')}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Escalations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Escalations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {escalations.length === 0 ? (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                    <p className="text-gray-600 dark:text-gray-400">
                      No escalations - Great work!
                    </p>
                  </div>
                ) : (
                  escalations.map((escalation) => (
                    <div key={escalation.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-gray-900 dark:text-white">
                            {escalation.reason}
                          </span>
                          <Badge className={getStatusColor(escalation.status)}>
                            {escalation.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          Priority: {escalation.priority}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(escalation.createdAt)}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">
                          {escalation.assignedTo || 'Unassigned'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}