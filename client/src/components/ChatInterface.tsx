import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Bot, User, Send, Paperclip, CheckCircle, AlertTriangle } from "lucide-react";
import { useWebSocket } from "../hooks/useWebSocket";
import ChatHistoryPanel from "./ChatHistoryPanel";
import ChatSettingsPanel from "./ChatSettingsPanel";
import type { ChatMessage } from "../types";

export default function ChatInterface() {
  const [sessionId] = useState(() => `session_${Date.now()}`);
  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // WebSocket connection
  const { isConnected, sendMessage } = useWebSocket({
    onMessage: (data) => {
      if (data.type === 'chat_response') {
        const newMessage: ChatMessage = {
          id: Date.now(),
          sessionId: data.sessionId,
          sender: 'ai',
          message: data.message,
          timestamp: new Date(),
          messageType: data.messageType || 'text',
          metadata: data.metadata
        };
        setMessages(prev => [...prev, newMessage]);
      }
    },
    onError: (error) => {
      console.error('WebSocket error:', error);
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim() || !isConnected) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      sessionId,
      sender: 'broker',
      message: inputMessage,
      timestamp: new Date(),
      messageType: 'text'
    };

    setMessages(prev => [...prev, userMessage]);

    sendMessage({
      type: 'chat_message',
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
                className="pr-12"
                disabled={!isConnected}
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-primary"
                onClick={() => {
                  // Implement file attachment functionality
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = '.pdf,.doc,.docx,.txt,.csv,.xlsx';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      console.log('File selected:', file.name);
                      // Handle file attachment
                    }
                  };
                  input.click();
                }}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || !isConnected}
              className="px-6"
            >
              <Send className="h-4 w-4 mr-2" />
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
