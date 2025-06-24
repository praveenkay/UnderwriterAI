import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { History, Search, Calendar, Download, Trash2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import type { ChatMessage } from "../types";

interface ChatSession {
  id: string;
  sessionId: string;
  startTime: Date;
  messageCount: number;
  lastActivity: Date;
  topics: string[];
  summary: string;
}

const mockChatSessions: ChatSession[] = [
  {
    id: "1",
    sessionId: "session_1750773617632",
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
    messageCount: 12,
    lastActivity: new Date(Date.now() - 2 * 60 * 60 * 1000),
    topics: ["Policy Renewal", "Discount"],
    summary: "Discussed 5% renewal discount for ABC Bakery policy"
  },
  {
    id: "2",
    sessionId: "session_1750773593826",
    startTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
    messageCount: 8,
    lastActivity: new Date(Date.now() - 4 * 60 * 60 * 1000),
    topics: ["Coverage Amendment"],
    summary: "Coverage increase request for City Restaurant"
  },
  {
    id: "3",
    sessionId: "session_1750773568963",
    startTime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    messageCount: 15,
    lastActivity: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    topics: ["Risk Assessment", "Premium"],
    summary: "Risk assessment for new manufacturing client"
  }
];

export default function ChatHistoryPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSession, setSelectedSession] = useState<ChatSession | null>(null);

  const { data: chatMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${selectedSession?.sessionId}/messages`],
    enabled: !!selectedSession
  });

  const filteredSessions = mockChatSessions.filter(session =>
    session.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.topics.some(topic => topic.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const hours = Math.floor(diff / (60 * 60 * 1000));
    const days = Math.floor(hours / 24);
    
    if (hours < 1) return 'Just now';
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const exportSession = (session: ChatSession) => {
    // Implement export functionality
    console.log("Exporting session:", session.sessionId);
  };

  const deleteSession = (session: ChatSession) => {
    // Implement delete functionality
    console.log("Deleting session:", session.sessionId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-1" />
          History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Chat History</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[60vh]">
          {/* Sessions List */}
          <div className="w-1/2 border-r border-gray-200 pr-4">
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="space-y-2 overflow-y-auto max-h-96">
                {filteredSessions.map((session) => (
                  <div
                    key={session.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedSession?.id === session.id
                        ? 'bg-primary/5 border-primary'
                        : 'hover:bg-gray-50 border-gray-200'
                    }`}
                    onClick={() => setSelectedSession(session)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <MessageSquare className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {session.messageCount} messages
                        </span>
                      </div>
                      <span className="text-xs text-gray-500">
                        {formatTime(session.lastActivity)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mb-2">{session.summary}</p>
                    <div className="flex flex-wrap gap-1">
                      {session.topics.map((topic, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Session Details */}
          <div className="w-1/2 pl-4">
            {selectedSession ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Session Details</h3>
                    <p className="text-sm text-gray-500">
                      Started {selectedSession.startTime.toLocaleString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => exportSession(selectedSession)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Export
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteSession(selectedSession)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Summary</h4>
                    <p className="text-sm text-gray-700">{selectedSession.summary}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Topics Discussed</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedSession.topics.map((topic, index) => (
                        <Badge key={index} variant="outline">
                          {topic}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Statistics</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Messages:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {selectedSession.messageCount}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Duration:</span>
                        <span className="font-medium text-gray-900 ml-2">
                          {Math.floor((selectedSession.lastActivity.getTime() - selectedSession.startTime.getTime()) / (60 * 1000))}m
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Messages Preview */}
                <div>
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Messages</h4>
                  <div className="bg-gray-50 rounded-lg p-3 max-h-48 overflow-y-auto">
                    {chatMessages && chatMessages.length > 0 ? (
                      <div className="space-y-2">
                        {chatMessages.slice(-5).map((message, index) => (
                          <div key={index} className="text-sm">
                            <span className={`font-medium ${
                              message.sender === 'broker' ? 'text-blue-600' : 'text-green-600'
                            }`}>
                              {message.sender === 'broker' ? 'You' : 'AI'}:
                            </span>
                            <span className="text-gray-700 ml-2">
                              {message.message.length > 100 
                                ? `${message.message.substring(0, 100)}...` 
                                : message.message
                              }
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No messages available</p>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">Select a conversation</p>
                  <p className="text-sm">Choose a chat session to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}