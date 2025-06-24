import Header from "../components/Header";
import DocumentUpload from "../components/DocumentUpload";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import type { Document } from "../types";

export default function DocumentsPage() {
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

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
                <CardTitle className="text-lg font-medium text-gray-900">Document History</CardTitle>
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
                              {doc.extractedRules.length > 0 && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {doc.extractedRules.length} rules extracted
                                </p>
                              )}
                            </div>
                          </div>
                          {getStatusIcon(doc.status)}
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