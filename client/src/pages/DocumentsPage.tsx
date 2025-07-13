import { useState, useEffect } from 'react';
import Header from "../components/Header";
import DocumentUpload from "../components/DocumentUpload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from '@/components/ui/progress';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { FileText, MessageSquare, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye, Settings, AlertTriangle, User, Calendar, Upload, RefreshCw, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../contexts/AuthContext";
import type { Document } from "../types";

interface ProcessingStats {
  totalDocuments: number;
  completed: number;
  processing: number;
  failed: number;
  pending: number;
}

export default function DocumentsPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // Check if user is admin
  const isAdmin = user?.role === 'zurich_admin';
  
  const { data: documents = [], refetch, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
    refetchInterval: 1000, // Poll every 1 second for real-time updates
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  const { data: processingStats, refetch: refetchStats } = useQuery<ProcessingStats>({
    queryKey: ['/api/documents/stats'],
    refetchInterval: 1000,
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache results
  });

  const { data: rules, isLoading: rulesLoading } = useQuery<any[]>({
    queryKey: ['/api/rules'],
  });

  const deleteMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Document deleted",
        description: "Document has been successfully deleted",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: () => {
      toast({
        title: "Delete failed",
        description: "Failed to delete document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Download started",
        description: `Downloading ${filename}`,
      });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download document. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteRequest = async (documentId: number, filename: string) => {
    const reason = prompt('Please provide a reason for requesting deletion of this document:');
    if (!reason || !reason.trim()) {
      toast({
        title: "Deletion request cancelled",
        description: "A reason is required to request document deletion.",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch('/api/documents/delete-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId,
          filename,
          reason: reason.trim(),
          requestedBy: 'current_user', // This would come from auth context
          requestedAt: new Date().toISOString()
        })
      });

      if (response.ok) {
        toast({
          title: "Delete request submitted",
          description: "Your request has been sent to administrators for review.",
        });
      } else {
        toast({
          title: "Request failed",
          description: "Failed to submit delete request. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Request failed",
        description: "Failed to submit delete request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-600';
      case 'processing':
        return 'bg-blue-100 text-blue-600';
      case 'failed':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getFileTypeIcon = (fileType: string) => {
    switch (fileType) {
      case 'chat_log':
        return <MessageSquare className="h-4 w-4 text-purple-500" />;
      case 'guideline':
      case 'policy':
        return <FileText className="h-4 w-4 text-blue-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const calculateProgress = (doc: Document): number => {
    if (doc.status === 'completed') return 100;
    if (doc.status === 'failed') return 0;
    if (doc.status === 'processing') {
      // Estimate progress based on processing time
      const elapsed = Date.now() - new Date(doc.uploadDate).getTime();
      const estimatedTotal = Math.max(30000, elapsed * 2); // Estimate 30s minimum
      return Math.min(95, (elapsed / estimatedTotal) * 100);
    }
    return 0;
  };

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  };

  const formatProcessingTime = (ms?: number): string => {
    if (!ms) return 'Unknown';
    const seconds = Math.floor(ms / 1000);
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const overallProgress = documents.length > 0 
    ? documents.reduce((sum: number, doc: Document) => sum + calculateProgress(doc), 0) / documents.length
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      <Header />
      
      <div className="max-w-7xl mx-auto px-8 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-medium text-gray-900 tracking-tight mb-3">
            Document Management
          </h1>
          <p className="text-gray-600 text-lg leading-relaxed max-w-2xl">
            Upload and process underwriting documents to extract rules and enhance 
            the AI assistant's decision-making capabilities.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="upload">Upload & Process</TabsTrigger>
            <TabsTrigger value="status">Processing Status</TabsTrigger>
            <TabsTrigger value="history">Document Library</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-6">
            {/* Overall Progress */}
            {documents.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="h-5 w-5" />
                    Overall Progress
                  </CardTitle>
                  <CardDescription>
                    Processing {documents.length} document{documents.length !== 1 ? 's' : ''}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Total Progress</span>
                        <span>{Math.round(overallProgress)}%</span>
                      </div>
                      <Progress value={overallProgress} className="h-2" />
                    </div>
                    
                    {processingStats && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{processingStats.completed}</div>
                          <div className="text-sm text-green-700">Completed</div>
                        </div>
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{processingStats.processing}</div>
                          <div className="text-sm text-blue-700">Processing</div>
                        </div>
                        <div className="text-center p-3 bg-yellow-50 rounded-lg">
                          <div className="text-2xl font-bold text-yellow-600">{processingStats.pending}</div>
                          <div className="text-sm text-yellow-700">Pending</div>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{processingStats.failed}</div>
                          <div className="text-sm text-red-700">Failed</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Document Ingestion */}
            <DocumentUpload />
          </TabsContent>

          <TabsContent value="status" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Document Processing Status
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetch()}
                    disabled={isLoading}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No documents uploaded yet. Upload a document to start processing.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {documents.map((doc) => {
                      const progress = calculateProgress(doc);
                      return (
                        <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getStatusIcon(doc.status)}
                              <div>
                                <h3 className="font-medium">{doc.filename}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {doc.fileType} • {formatFileSize(doc.fileSize)} • 
                                  Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                            <Badge className={getStatusColor(doc.status)}>
                              {doc.status}
                            </Badge>
                          </div>

                          {/* Progress Bar */}
                          {(doc.status === 'processing' || doc.status === 'completed') && (
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Processing Progress</span>
                                <span>{Math.round(progress)}%</span>
                              </div>
                              <Progress value={progress} className="h-1" />
                            </div>
                          )}

                          {/* Results */}
                          {doc.status === 'completed' && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <span className="text-muted-foreground">Rules Extracted:</span>
                                <span className="ml-2 font-medium">{doc.extractedRules?.length || 0}</span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Processing Time:</span>
                                <span className="ml-2 font-medium">{formatProcessingTime((doc as any).processingTime)}</span>
                              </div>
                              {doc.processedDate && (
                                <div>
                                  <span className="text-muted-foreground">Completed:</span>
                                  <span className="ml-2 font-medium">
                                    {new Date(doc.processedDate).toLocaleTimeString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Error Display */}
                          {doc.status === 'failed' && (
                            <Alert variant="destructive">
                              <AlertTriangle className="h-4 w-4" />
                              <AlertDescription>
                                {(doc as any).errorMessage || 'Processing failed due to an unknown error.'}
                              </AlertDescription>
                            </Alert>
                          )}

                          {/* Processing Info */}
                          {doc.status === 'processing' && (
                            <div className="text-sm text-muted-foreground">
                              <div className="flex items-center gap-2">
                                <RefreshCw className="h-3 w-3 animate-spin" />
                                Processing large document with intelligent chunking...
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card className="swiss-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900">Document Library</CardTitle>
                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="flex items-center space-x-2">
                          <Settings className="h-4 w-4" />
                          <span>Extracted Rules</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>Extracted Rules</DialogTitle>
                          <DialogDescription>
                            Rules processed by AI from uploaded documents
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          {rulesLoading ? (
                            <div className="text-center py-4">Loading rules...</div>
                          ) : rules && rules.length > 0 ? (
                            <div className="space-y-3">
                              {rules.map((rule: any) => (
                                <div key={rule.id} className="p-4 border rounded-lg">
                                  <div className="flex items-center justify-between mb-2">
                                    <Badge variant="outline" className="capitalize">
                                      {rule.ruleType}
                                    </Badge>
                                    <span className="text-sm text-gray-500">
                                      Confidence: {rule.confidence}%
                                    </span>
                                  </div>
                                  <p className="text-sm font-medium mb-1">
                                    Conditions: {typeof rule.conditions === 'string' ? rule.conditions : JSON.stringify(rule.conditions)}
                                  </p>
                                  <p className="text-sm text-gray-600">
                                    Action: {typeof rule.action === 'string' ? rule.action : JSON.stringify(rule.action)}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-2">
                                    Source: {rule.source}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center py-8 text-gray-500">
                              <Settings className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                              <p>No rules have been extracted yet</p>
                              <p className="text-sm">Upload documents to extract rules</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="p-4 bg-gray-50 rounded-lg animate-pulse">
                        <div className="flex items-center space-x-3">
                          <div className="w-4 h-4 bg-gray-300 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : documents && documents.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => (
                      <Card key={doc.id} className="p-4 hover:shadow-md transition-shadow">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            {getFileTypeIcon(doc.fileType)}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium break-words">{doc.filename}</p>
                              <p className="text-xs text-muted-foreground">{doc.fileType}</p>
                            </div>
                          </div>
                          <div className="flex justify-start">
                            <Badge className={getStatusColor(doc.status)} variant="outline">
                              {doc.status}
                            </Badge>
                          </div>
                          
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Size: {formatFileSize(doc.fileSize)}</div>
                            <div>Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}</div>
                            {doc.extractedRules && doc.extractedRules.length > 0 && (
                              <div>Rules: {doc.extractedRules.length}</div>
                            )}
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownload(doc.id, doc.filename)}
                                className="flex-1"
                              >
                                <Download className="h-3 w-3 mr-1" />
                                Download
                              </Button>
                              {doc.extractedRules && doc.extractedRules.length > 0 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      title="View extracted rules"
                                    >
                                      <Eye className="h-3 w-3 mr-1" />
                                      Rules
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                                    <DialogHeader>
                                      <DialogTitle>Rules from {doc.filename}</DialogTitle>
                                      <DialogDescription>
                                        {doc.extractedRules.length} rules extracted from this document
                                      </DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-3">
                                      {doc.extractedRules.map((rule: any, index: number) => (
                                        <div key={index} className="p-3 border rounded-lg">
                                          <div className="flex items-center justify-between mb-2">
                                            <Badge variant="outline" className="capitalize">
                                              {rule.ruleType || 'Unknown'}
                                            </Badge>
                                            <span className="text-sm text-gray-500">
                                              Confidence: {rule.confidence || 0}%
                                            </span>
                                          </div>
                                          <p className="text-sm">{rule.description || 'No description available'}</p>
                                        </div>
                                      ))}
                                    </div>
                                  </DialogContent>
                                </Dialog>
                              )}
                            </div>
                            {isAdmin ? (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    title="Delete document"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete "{doc.filename}"? This action cannot be undone and will also remove any associated rules extracted from this document.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deleteMutation.mutate(doc.id)}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteRequest(doc.id, doc.filename)}
                                className="w-full text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Request deletion"
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Request Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium mb-2">No documents uploaded yet</p>
                    <p className="text-sm">Upload chat logs or guidelines to get started</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}
