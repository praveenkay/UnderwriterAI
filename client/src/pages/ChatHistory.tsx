import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  MessageSquare, 
  Download, 
  Search, 
  Calendar, 
  Clock, 
  User,
  FileText,
  Filter
} from "lucide-react";

interface ChatSession {
  id: string;
  sessionId: string;
  startTime: Date;
  messageCount: number;
  lastActivity: Date;
  topics: string[];
  summary: string;
  messages: any[];
}

export default function ChatHistory() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ["/api/chat/sessions"],
  });

  const filteredSessions = sessions.filter((session: ChatSession) =>
    session.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase())) ||
    session.sessionId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportSession = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/chat/sessions/${sessionId}/export`, {
        method: "POST",
      });

      if (!response.ok) throw new Error("Failed to export chat session");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `chat-session-${sessionId}-${new Date().toISOString().split('T')[0]}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export Successful",
        description: "Chat session has been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export chat session. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatTime = (timestamp: Date) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}h ${remainingMinutes}m`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-12 bg-gray-200 rounded"></div>
            <div className="grid gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Chat History</h1>
          <Badge variant="secondary" className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            {sessions.length} Sessions
          </Badge>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search sessions by summary, topics, or session ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sessions List */}
        <div className="grid gap-4">
          {filteredSessions.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No chat sessions found
                </h3>
                <p className="text-gray-500">
                  {searchTerm ? "Try adjusting your search terms." : "Start a conversation to see your chat history here."}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredSessions.map((session: ChatSession) => (
              <Card key={session.sessionId} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-blue-500" />
                        Session {session.sessionId.slice(-8)}
                      </CardTitle>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {session.summary}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleExportSession(session.sessionId)}
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </Button>
                      <Button
                        size="sm"
                        variant={selectedSession === session.sessionId ? "default" : "outline"}
                        onClick={() => setSelectedSession(
                          selectedSession === session.sessionId ? null : session.sessionId
                        )}
                      >
                        {selectedSession === session.sessionId ? "Hide" : "View"}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Calendar className="w-4 h-4" />
                      {formatTime(session.startTime)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <Clock className="w-4 h-4" />
                      {formatDuration(session.startTime, session.lastActivity)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <MessageSquare className="w-4 h-4" />
                      {session.messageCount} messages
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <User className="w-4 h-4" />
                      Active
                    </div>
                  </div>

                  {/* Topics */}
                  {session.topics.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Topics:</p>
                      <div className="flex flex-wrap gap-2">
                        {session.topics.map((topic, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Expanded Messages */}
                  {selectedSession === session.sessionId && session.messages && (
                    <div className="mt-4 border-t pt-4 space-y-3 max-h-96 overflow-y-auto">
                      <h4 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Messages ({session.messages.length})
                      </h4>
                      {session.messages.map((message: any, index: number) => (
                        <div key={index} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {message.sender}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatTime(message.timestamp)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {message.message}
                          </p>
                          {message.attachments && message.attachments.length > 0 && (
                            <div className="mt-2">
                              <p className="text-xs text-gray-500">
                                📎 {message.attachments.length} attachment(s)
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}