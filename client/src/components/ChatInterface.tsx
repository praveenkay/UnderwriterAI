import React, { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Paperclip, CheckCircle, AlertTriangle, X } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import ChatHistoryPanel from "./ChatHistoryPanel";
import ChatSettingsPanel from "./ChatSettingsPanel";
import type { ChatMessage } from "@shared/schema";

export default function ChatInterface() {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch existing messages
  const { data: existingMessages } = useQuery<ChatMessage[]>({
    queryKey: [`/api/chat/sessions/${sessionId}/messages`],
  });

  useEffect(() => {
    if (existingMessages) {
      setMessages(existingMessages.map(msg => ({
        ...msg,
        timestamp: new Date(msg.timestamp)
      })));
    }
  }, [existingMessages]);

  const handleFileAttach = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      console.log("Files selected:", files.map(f => f.name));
      setAttachedFiles(prev => [...prev, ...files]);
      
      // Process each file for document ingestion
      files.forEach(async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('fileType', getFileType(file.name));
        
        try {
          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData
          });
          
          if (response.ok) {
            const result = await response.json();
            console.log(`Document ${file.name} processed: ${result.extractedRules} rules extracted`);
          }
        } catch (error) {
          console.error('Failed to process document:', error);
        }
      });
    }
  };

  const getFileType = (filename: string): string => {
    const ext = filename.toLowerCase().split('.').pop();
    switch (ext) {
      case 'pdf':
      case 'doc':
      case 'docx':
        return filename.toLowerCase().includes('policy') ? 'policy' : 
               filename.toLowerCase().includes('guideline') ? 'guideline' :
               filename.toLowerCase().includes('quote') ? 'quote' : 'guideline';
      case 'txt':
        return filename.toLowerCase().includes('chat') || filename.toLowerCase().includes('log') ? 'chat_log' : 'guideline';
      default:
        return 'guideline';
    }
  };

  const sendMessageMutation = useMutation({
    mutationFn: async (messageData: any) => {
      const response = await fetch("/api/chat/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(messageData),
      });
      if (!response.ok) throw new Error("Failed to send message");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/sessions/${sessionId}/messages`] });
    },
  });

  const handleSendMessage = () => {
    if (inputMessage.trim()) {
      const newMessage: ChatMessage = {
        id: Date.now(),
        sessionId: sessionId,
        brokerId: "broker_1",
        brokerName: "John Smith",
        sender: "broker",
        message: inputMessage,
        timestamp: new Date(),
        messageType: "text",
        metadata: {},
        policyNumber: null,
        isArchived: false,
        attachments: attachedFiles.map(file => ({
          filename: file.name,
          size: file.size,
          type: file.type
        }))
      };

      setMessages(prev => [...prev, newMessage]);
      
      sendMessageMutation.mutate({
        sessionId: sessionId,
        sender: "broker",
        message: inputMessage,
        messageType: "text",
        policyNumber: null,
        attachments: attachedFiles.map(file => ({
          filename: file.name,
          size: file.size,
          type: file.type
        }))
      });

      setInputMessage("");
      setAttachedFiles([]);
    }
  };

  // WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'chat_response') {
        const newMessage: ChatMessage = {
          id: Date.now(),
          sessionId: data.sessionId,
          brokerId: "broker_1",
          brokerName: "AI Assistant",
          sender: 'ai',
          message: data.message,
          timestamp: new Date(),
          messageType: data.messageType || 'text',
          metadata: data.metadata || {},
          policyNumber: null,
          isArchived: false,
          attachments: []
        };
        setMessages(prev => [...prev, newMessage]);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });
      sessionId,
      message: inputMessage
    });

    setInputMessage("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessage = (message: string) => {
    // Convert markdown-style formatting to HTML
    return message
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>')
      .replace(/• /g, '• ');
  };

  return (
    <Card className="swiss-card h-[500px] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Bot className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">AI Assistant</h3>
              <p className="text-sm text-green-600 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                {isConnected ? 'Online & Ready' : 'Connecting...'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <ChatHistoryPanel />
            <ChatSettingsPanel />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-md">
                  <p className="text-gray-900">
                    Hello! I'm your AI underwriting assistant for Zurich's SME business insurance. I can help you with:
                  </p>
                  <ul className="mt-2 text-sm text-gray-700 space-y-1">
                    <li>• Policy renewals and discounts</li>
                    <li>• Coverage amendments</li>
                    <li>• Risk assessments</li>
                    <li>• Underwriting decisions</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-3">Just now</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <button 
                  className="btn-swiss text-left p-3 text-sm"
                  onClick={() => setInputMessage("Can I apply a 5% renewal discount for ABC Bakery policy SME-2024-0892?")}
                >
                  <div className="font-medium text-gray-700">Try: "5% renewal discount for ABC Bakery"</div>
                  <div className="text-xs text-gray-500 mt-1">Quick renewal request</div>
                </button>
                <button 
                  className="btn-swiss text-left p-3 text-sm"
                  onClick={() => setInputMessage("Can we increase coverage for City Restaurant from £750k to £900k?")}
                >
                  <div className="font-medium text-gray-700">Try: "Coverage increase to £900k"</div>
                  <div className="text-xs text-gray-500 mt-1">Policy amendment</div>
                </button>
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex items-start space-x-3 ${
                message.sender === 'broker' ? 'justify-end' : ''
              }`}
            >
              {message.sender === 'broker' ? (
                <>
                  <div className="bg-primary rounded-2xl rounded-tr-sm p-4 max-w-md text-white">
                    <p>{message.message}</p>
                    <p className="text-xs text-primary-100 mt-2">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="h-4 w-4 text-gray-600" />
                  </div>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="space-y-3">
                    <div className="bg-gray-50 rounded-2xl rounded-tl-sm p-4 max-w-md">
                      {message.messageType === 'decision' && message.metadata?.decision && (
                        <div className="flex items-center space-x-2 mb-2">
                          {message.metadata.decision === 'approved' ? (
                            <>
                              <CheckCircle className="h-4 w-4 text-green-500" />
                              <Badge variant="secondary" className="bg-green-100 text-green-600">
                                APPROVED
                              </Badge>
                            </>
                          ) : message.metadata.decision === 'escalated' ? (
                            <>
                              <AlertTriangle className="h-4 w-4 text-orange-500" />
                              <Badge variant="secondary" className="bg-orange-100 text-orange-600">
                                ESCALATED
                              </Badge>
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-4 w-4 text-red-500" />
                              <Badge variant="secondary" className="bg-red-100 text-red-600">
                                DECLINED
                              </Badge>
                            </>
                          )}
                        </div>
                      )}
                      <div 
                        className="text-gray-900"
                        dangerouslySetInnerHTML={{ __html: formatMessage(message.message) }}
                      />
                      {message.metadata?.responseTime && (
                        <p className="text-xs text-gray-500 mt-2">
                          Response time: {(message.metadata.responseTime / 1000).toFixed(1)}s
                        </p>
                      )}
                      <p className="text-xs text-gray-500 mt-2">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-6 border-t border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Input
                type="text"
                placeholder="Ask about policies, renewals, discounts, coverage..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2"
            >
              <Paperclip className="w-4 h-4" />
              Attach
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              hidden
              onChange={handleFileAttach}
              accept=".pdf,.doc,.docx,.txt,.jpg,.png"
              multiple
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
              className="flex items-center gap-2"
            >
              <Send className="h-4 w-4" />
              Send
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            AI responses are generated based on Zurich underwriting guidelines and historical data
          </p>
        </div>
      </Card>
  );
}
