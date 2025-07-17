import React, { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  BookOpen, 
  Shield, 
  Zap, 
  Users, 
  Database, 
  Brain, 
  ChevronRight,
  Target,
  Cog,
  BarChart3,
  FileText,
  Network,
  Lock
} from "lucide-react";

export default function About() {
  useEffect(() => {
    // Scroll to header when page loads
    const headerElement = document.getElementById('header');
    if (headerElement) {
      headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Hero Section */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="h-8 w-8 text-blue-600" />
            <h1 className="text-3xl font-medium text-gray-900 tracking-tight">
              About UnderwriterAI
            </h1>
          </div>
          <p className="text-gray-600 text-lg leading-relaxed max-w-3xl">
            Intelligent underwriting assistant for Zurich Insurance's SME business operations. 
            Learn about our comprehensive AI-powered system architecture, features, and technical implementation.
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="features">Features</TabsTrigger>
            <TabsTrigger value="architecture">Architecture</TabsTrigger>
            <TabsTrigger value="technical">Technical Details</TabsTrigger>
            <TabsTrigger value="control">Control & Evaluation</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    System Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    UnderwriterAI is a comprehensive multi-agent AI system designed for Zurich Insurance's 
                    Small Medium Enterprise (SME) business insurance operations. The system provides real-time 
                    broker interactions, automated underwriting decisions, intelligent document processing, 
                    and advanced analytics.
                  </p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Automate 75% of routine underwriting decisions</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Real-time broker support with AI assistants</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Intelligent document processing and rule extraction</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Comprehensive analytics and performance tracking</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-green-600" />
                    AI Providers
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Anthropic Claude Sonnet 4</span>
                      <Badge variant="outline">Primary Chat</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">OpenAI GPT-4</span>
                      <Badge variant="outline">Document Processing</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Google Gemini 2.5</span>
                      <Badge variant="outline">Analytics</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">OpenRouter</span>
                      <Badge variant="outline">Backup Provider</Badge>
                    </div>
                  </div>
                  <Separator className="my-4" />
                  <div className="text-sm text-gray-600">
                    <p className="mb-2"><strong>Intelligent Routing:</strong> Task-based provider selection</p>
                    <p><strong>Hybrid Decision Logic:</strong> Rule-based with AI fallback</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">75%</div>
                    <div className="text-sm text-gray-600">Automation Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">&lt;2s</div>
                    <div className="text-sm text-gray-600">Rule-based Response</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">85%</div>
                    <div className="text-sm text-gray-600">Avg Confidence</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">15%</div>
                    <div className="text-sm text-gray-600">Escalation Rate</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-blue-600" />
                    Authentication & Roles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      Multi-role system (Zurich Admin, Zurich Users, External Brokers)
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      Role-based UI adaptation
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      JWT-based security with session management
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-5 w-5 text-green-600" />
                    Real-time Chat
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      WebSocket-powered real-time communication
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      Context-aware AI responses
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-green-600" />
                      File attachment support
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-purple-600" />
                    Document Management
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                      Bulk operations with role-based permissions
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                      Multi-format support (PDF, Excel, Text)
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-purple-600" />
                      AI-powered rule extraction
                    </li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-orange-600" />
                    Analytics Dashboard
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-600" />
                      Performance metrics with time-based views
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-600" />
                      Interactive visualizations
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-orange-600" />
                      PDF report generation
                    </li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="architecture" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Network className="h-5 w-5 text-blue-600" />
                    System Architecture
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="font-semibold text-blue-900">Frontend</div>
                        <div className="text-sm text-blue-700 mt-1">React + TypeScript</div>
                        <div className="text-sm text-blue-700">shadcn/ui + Tailwind</div>
                      </div>
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="font-semibold text-green-900">Backend</div>
                        <div className="text-sm text-green-700 mt-1">Node.js + Express</div>
                        <div className="text-sm text-green-700">TypeScript + WebSocket</div>
                      </div>
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="font-semibold text-purple-900">Database</div>
                        <div className="text-sm text-purple-700 mt-1">SQLite + Drizzle ORM</div>
                        <div className="text-sm text-purple-700">Custom Vector Store</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Data Flow Architecture</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">1. Input Layer</Badge>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-sm">User interactions, file uploads, chat messages</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">2. Processing Layer</Badge>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-sm">AI analysis, rule extraction, vector embedding</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">3. Storage Layer</Badge>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-sm">SQLite database, file system, vector store</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">4. Output Layer</Badge>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-sm">UI updates, notifications, reports, real-time responses</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="technical" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5 text-blue-600" />
                    Database Design
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Core Tables</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• Users, Policies, Chat Messages</li>
                        <li>• Underwriting Decisions & Rules</li>
                        <li>• Documents & Analytics Events</li>
                        <li>• Escalations & Broker Metrics</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold mb-2">Features</h4>
                      <ul className="space-y-1 text-sm">
                        <li>• SQLite with better-sqlite3 driver</li>
                        <li>• Drizzle ORM with type safety</li>
                        <li>• Manual schema with automated seeding</li>
                        <li>• Migration ready for PostgreSQL</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Vector Store Implementation</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Custom built for insurance domain requirements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">OpenAI text-embedding-3-small model</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">1000-character chunks with 200-character overlap</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Cosine similarity search with 0.1 threshold</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Provider Integration</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Token Management</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Dynamic model selection</li>
                          <li>• Intelligent content chunking</li>
                          <li>• Cost optimization</li>
                          <li>• Error recovery mechanisms</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold">Provider Selection</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Task-based routing</li>
                          <li>• Automatic failover</li>
                          <li>• Load balancing</li>
                          <li>• Performance monitoring</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="control" className="mt-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Cog className="h-5 w-5 text-blue-600" />
                    Control Mechanisms
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-semibold text-blue-900 mb-2">Confidence-Based Routing</h4>
                      <div className="text-sm text-blue-700 space-y-1">
                        <div>• Rule Match (&gt;80% confidence) → Automatic Approval/Denial</div>
                        <div>• Rule Match (&lt;80% confidence) → AI Analysis → Human Review</div>
                        <div>• No Rule Match → AI Processing → Escalation (if high risk)</div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="font-semibold mb-2">Rule-Based Control</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Business rules with confidence scoring</li>
                          <li>• Automatic escalation triggers</li>
                          <li>• Complete decision audit trail</li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">AI Provider Management</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Multi-provider failover</li>
                          <li>• Load balancing</li>
                          <li>• Cost optimization</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-red-600" />
                    Limitations & Risks
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <h4 className="font-semibold text-red-700">AI-Related Risks</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• Hallucination risks (mitigated by confidence scoring)</li>
                          <li>• Context window limitations</li>
                          <li>• Model dependency</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-semibold text-orange-700">Scalability Considerations</h4>
                        <ul className="space-y-1 text-sm">
                          <li>• SQLite → PostgreSQL migration path</li>
                          <li>• Vector store memory constraints</li>
                          <li>• File storage limitations</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h4 className="font-semibold text-yellow-900 mb-2">Security & Privacy</h4>
                      <div className="text-sm text-yellow-700 space-y-1">
                        <div>• Sensitive insurance data requires careful handling</div>
                        <div>• Role-based access control and JWT authentication</div>
                        <div>• Data anonymization for AI provider interactions</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      <Footer />
    </div>
  );
}