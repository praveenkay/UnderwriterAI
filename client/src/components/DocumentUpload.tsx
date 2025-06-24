import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Upload, FileText, MessageSquare, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "../types";

export default function DocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, type }: { file: File; type: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', type);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Document uploaded and processing started",
      });
      setSelectedFile(null);
      setFileType("");
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !fileType) {
      toast({
        title: "Missing information",
        description: "Please select a file and file type",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({ file: selectedFile, type: fileType });
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
    <Card className="swiss-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-medium text-gray-900">Document Ingestion</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Extract rules from chat logs and guidelines</p>
          </div>
          <div className="status-dot status-active"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600 mb-1">Upload Documents</p>
          <p className="text-xs text-gray-500 mb-3">Chat logs, guidelines, policies</p>
          
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.pdf,.doc,.docx,.csv,.xlsx"
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <span>Choose File</span>
            </Button>
          </label>
          
          {selectedFile && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}
        </div>

        {selectedFile && (
          <div className="space-y-3">
            <Select onValueChange={setFileType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat_log">Chat Log</SelectItem>
                <SelectItem value="guideline">Underwriting Guideline</SelectItem>
                <SelectItem value="policy">Policy Document</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleUpload} 
              disabled={!fileType || uploadMutation.isPending}
              className="w-full"
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Upload & Process'}
            </Button>
          </div>
        )}

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">Uploaded Files</h4>
            {documents && documents.length > 3 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-primary hover:text-primary/80"
                onClick={() => window.open('/documents', '_blank')}
              >
                View All ({documents.length})
              </Button>
            )}
          </div>
          
          <div className="space-y-2">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="p-3 bg-gray-50 rounded-lg animate-pulse">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-gray-300 rounded"></div>
                      <div className="flex-1">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : documents && documents.length > 0 ? (
              documents.slice(0, 3).map((doc) => (
                <div 
                  key={doc.id} 
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                  onClick={() => {
                    // Open document details or download
                    console.log('Opening document:', doc.filename);
                  }}
                >
                  <div className="flex items-center space-x-3">
                    {getFileTypeIcon(doc.fileType)}
                    <div>
                      <p className="text-sm font-medium text-gray-900">{doc.filename}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className={getStatusColor(doc.status)}>
                          {doc.status}
                        </Badge>
                        {doc.extractedRules.length > 0 && (
                          <span className="text-xs text-gray-500">
                            {doc.extractedRules.length} rules extracted
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {getStatusIcon(doc.status)}
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">No documents uploaded yet</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
