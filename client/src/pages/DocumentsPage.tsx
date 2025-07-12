import Header from "../components/Header";
import DocumentUpload from "../components/DocumentUpload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { FileText, MessageSquare, CheckCircle, Clock, AlertCircle, Download, Trash2, Eye, Settings, AlertTriangle, User, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "../types";

export default function DocumentsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <DocumentUpload />
          </div>
          
          <div className="lg:col-span-2">
            <Card className="swiss-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg font-medium text-gray-900">Document History</CardTitle>
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
                  <div className="space-y-4">
                    {documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {getFileTypeIcon(doc.fileType)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                              <div className="flex items-center space-x-2 mt-1">
                                <Badge variant="outline" className={getStatusColor(doc.status)}>
                                  {doc.status}
                                </Badge>
                                <span className="text-xs text-gray-500">
                                  {new Date(doc.uploadDate).toLocaleDateString()}
                                </span>
                              </div>
                              {doc.extractedRules && doc.extractedRules.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {doc.extractedRules.length} rules extracted
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            {getStatusIcon(doc.status)}
                            <div className="flex items-center space-x-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDownload(doc.id, doc.filename)}
                                className="h-8 w-8 p-0"
                                title="Download document"
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              {doc.extractedRules && doc.extractedRules.length > 0 && (
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 w-8 p-0"
                                      title="View extracted rules"
                                    >
                                      <Eye className="h-4 w-4" />
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
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteRequest(doc.id, doc.filename)}
                                className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                title="Request deletion"
                              >
                                <AlertTriangle className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
