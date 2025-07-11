import React, { useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileText, MessageSquare, CheckCircle, Clock, AlertCircle, Loader2, Brain, Zap, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Document } from "../types";

interface UploadProgress {
  stage: 'uploading' | 'processing' | 'extracting' | 'storing' | 'completed' | 'failed';
  progress: number;
  message: string;
  details?: string;
}

interface ProcessingStatus {
  documentId: number;
  filename: string;
  status: UploadProgress;
  startTime: number;
}

export default function DocumentUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [fileType, setFileType] = useState<string>("");
  const [isBulkUpload, setIsBulkUpload] = useState(false);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
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

      // Add to processing status
      const processingId = Date.now();
      const newStatus: ProcessingStatus = {
        documentId: processingId,
        filename: file.name,
        status: {
          stage: 'uploading',
          progress: 0,
          message: 'Preparing upload...'
        },
        startTime: Date.now()
      };
      
      setProcessingStatus(prev => [...prev, newStatus]);

      // Progress update function
      const updateProgress = (stage: UploadProgress['stage'], progress: number, message: string, details?: string) => {
        setProcessingStatus(prev => prev.map(status => 
          status.documentId === processingId 
            ? { ...status, status: { stage, progress, message, details } }
            : status
        ));
      };

      try {
        // Upload phase
        updateProgress('uploading', 10, 'Uploading file...');
        
        const response = await fetch('/api/documents/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        updateProgress('uploading', 30, 'Upload completed');
        
        // Processing phase
        updateProgress('processing', 40, 'Processing document...');
        
        const result = await response.json();
        
        // Update with actual document ID
        setProcessingStatus(prev => prev.map(status => 
          status.documentId === processingId 
            ? { ...status, documentId: result.documentId }
            : status
        ));

        // AI processing stages
        updateProgress('extracting', 60, 'Extracting rules with AI...', 'Analyzing document content');
        
        // Simulate processing time
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        updateProgress('extracting', 80, 'Processing rules...', `Found ${result.extractedRules || 0} potential rules`);
        
        await new Promise(resolve => setTimeout(resolve, 800));
        
        updateProgress('storing', 90, 'Storing results...');
        
        await new Promise(resolve => setTimeout(resolve, 400));
        
        updateProgress('completed', 100, 'Processing completed!', 
          `Extracted ${result.extractedRules || 0} rules in ${((Date.now() - newStatus.startTime) / 1000).toFixed(1)}s`);

        // Remove from processing after delay
        setTimeout(() => {
          setProcessingStatus(prev => prev.filter(status => status.documentId !== result.documentId));
        }, 3000);

        return result;
      } catch (error) {
        updateProgress('failed', 0, 'Processing failed', (error as Error).message);
        
        // Remove failed status after delay
        setTimeout(() => {
          setProcessingStatus(prev => prev.filter(status => status.documentId !== processingId));
        }, 5000);
        
        throw error;
      }
    },
    onSuccess: () => {
      toast({
        title: "Upload successful",
        description: "Document uploaded and processing completed",
      });
      setSelectedFile(null);
      setSelectedFiles(null);
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

  const bulkUploadMutation = useMutation({
    mutationFn: async ({ files, type }: { files: FileList; type: string }) => {
      const results = [];
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Add individual file to processing status
        const processingId = Date.now() + i;
        const newStatus: ProcessingStatus = {
          documentId: processingId,
          filename: file.name,
          status: {
            stage: 'uploading',
            progress: 0,
            message: `Uploading file ${i + 1} of ${files.length}...`
          },
          startTime: Date.now()
        };
        
        setProcessingStatus(prev => [...prev, newStatus]);

        const updateProgress = (stage: UploadProgress['stage'], progress: number, message: string, details?: string) => {
          setProcessingStatus(prev => prev.map(status => 
            status.documentId === processingId 
              ? { ...status, status: { stage, progress, message, details } }
              : status
          ));
        };

        try {
          updateProgress('uploading', 10, `Uploading ${file.name}...`);
          
          const formData = new FormData();
          formData.append('file', file);
          formData.append('fileType', type);

          const response = await fetch('/api/documents/upload', {
            method: 'POST',
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Upload failed for ${file.name}`);
          }

          updateProgress('processing', 50, 'Processing...');
          const result = await response.json();
          
          // Update with actual document ID
          setProcessingStatus(prev => prev.map(status => 
            status.documentId === processingId 
              ? { ...status, documentId: result.documentId }
              : status
          ));

          updateProgress('completed', 100, 'Completed!', `${result.extractedRules || 0} rules extracted`);
          
          // Remove from processing after delay
          setTimeout(() => {
            setProcessingStatus(prev => prev.filter(status => status.documentId !== result.documentId));
          }, 2000);

          results.push(result);
        } catch (error) {
          updateProgress('failed', 0, 'Failed', (error as Error).message);
          
          // Remove failed status after delay
          setTimeout(() => {
            setProcessingStatus(prev => prev.filter(status => status.documentId !== processingId));
          }, 5000);
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      toast({
        title: "Bulk upload completed",
        description: `${results.length} documents processed successfully`,
      });
      setSelectedFile(null);
      setSelectedFiles(null);
      setFileType("");
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
    },
    onError: (error) => {
      toast({
        title: "Bulk upload failed",
        description: "Some documents failed to upload. Check individual status above.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      if (isBulkUpload) {
        setSelectedFiles(files);
        setSelectedFile(null);
      } else {
        setSelectedFile(files[0]);
        setSelectedFiles(null);
      }
    }
  };

  const handleUpload = () => {
    if (isBulkUpload) {
      if (!selectedFiles || selectedFiles.length === 0 || !fileType) {
        toast({
          title: "Missing information",
          description: "Please select files and file type",
          variant: "destructive",
        });
        return;
      }
      bulkUploadMutation.mutate({ files: selectedFiles, type: fileType });
    } else {
      if (!selectedFile || !fileType) {
        toast({
          title: "Missing information",
          description: "Please select a file and file type",
          variant: "destructive",
        });
        return;
      }
      uploadMutation.mutate({ file: selectedFile, type: fileType });
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
        <div className="flex items-center space-x-4 mb-4">
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={!isBulkUpload}
              onChange={() => {
                setIsBulkUpload(false);
                setSelectedFiles(null);
              }}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm">Single Upload</span>
          </label>
          <label className="flex items-center space-x-2">
            <input
              type="radio"
              checked={isBulkUpload}
              onChange={() => {
                setIsBulkUpload(true);
                setSelectedFile(null);
              }}
              className="text-primary focus:ring-primary"
            />
            <span className="text-sm">Bulk Upload</span>
          </label>
        </div>

        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
          <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-600 mb-1">
            {isBulkUpload ? 'Upload Multiple Documents' : 'Upload Documents'}
          </p>
          <p className="text-xs text-gray-500 mb-3">Chat logs, guidelines, policies</p>
          
          <input
            type="file"
            onChange={handleFileSelect}
            accept=".txt,.pdf,.doc,.docx,.csv,.xlsx"
            multiple={isBulkUpload}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" size="sm" className="cursor-pointer" asChild>
              <span>{isBulkUpload ? 'Choose Files' : 'Choose File'}</span>
            </Button>
          </label>
          
          {selectedFile && !isBulkUpload && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <p className="font-medium">{selectedFile.name}</p>
              <p className="text-gray-500">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          )}

          {selectedFiles && isBulkUpload && (
            <div className="mt-3 p-2 bg-gray-50 rounded text-sm">
              <p className="font-medium">{selectedFiles.length} files selected</p>
              <p className="text-gray-500">
                Total size: {Array.from(selectedFiles).reduce((total, file) => total + file.size, 0) / 1024 / 1024 > 1024 
                  ? `${(Array.from(selectedFiles).reduce((total, file) => total + file.size, 0) / 1024 / 1024 / 1024).toFixed(2)} GB`
                  : `${(Array.from(selectedFiles).reduce((total, file) => total + file.size, 0) / 1024 / 1024).toFixed(2)} MB`}
              </p>
            </div>
          )}
        </div>

        {(selectedFile || selectedFiles) && (
          <div className="space-y-3">
            <Select onValueChange={setFileType}>
              <SelectTrigger>
                <SelectValue placeholder="Select document type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="chat_log">Chat Log</SelectItem>
                <SelectItem value="guideline">Underwriting Guideline</SelectItem>
                <SelectItem value="policy">Policy Document</SelectItem>
                <SelectItem value="summary_of_coverage">Summary of Coverage</SelectItem>
                <SelectItem value="data_export">Data Export</SelectItem>
                <SelectItem value="claims_data">Claims Data</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleUpload} 
              disabled={!fileType || (uploadMutation.isPending || bulkUploadMutation.isPending)}
              className="w-full"
            >
              {(uploadMutation.isPending || bulkUploadMutation.isPending) 
                ? (isBulkUpload ? 'Uploading Files...' : 'Uploading...') 
                : (isBulkUpload ? 'Upload & Process Files' : 'Upload & Process')}
            </Button>
          </div>
        )}

        {/* Processing Status Display */}
        {processingStatus.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900">Processing Status</h4>
            {processingStatus.map((status) => (
              <div key={status.documentId} className="p-4 bg-white border rounded-lg shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {status.status.stage === 'uploading' && <Upload className="h-4 w-4 text-blue-500" />}
                    {status.status.stage === 'processing' && <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />}
                    {status.status.stage === 'extracting' && <Brain className="h-4 w-4 text-purple-500" />}
                    {status.status.stage === 'storing' && <Zap className="h-4 w-4 text-green-500" />}
                    {status.status.stage === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                    {status.status.stage === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                    <span className="text-sm font-medium text-gray-900">{status.filename}</span>
                  </div>
                  <button
                    onClick={() => setProcessingStatus(prev => prev.filter(s => s.documentId !== status.documentId))}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{status.status.message}</span>
                    <span className="text-gray-500">{status.status.progress}%</span>
                  </div>
                  
                  <Progress 
                    value={status.status.progress} 
                    className="h-2"
                  />
                  
                  {status.status.details && (
                    <p className="text-xs text-gray-500 mt-1">{status.status.details}</p>
                  )}
                  
                  {status.status.stage === 'failed' && (
                    <Alert className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {status.status.details || 'Processing failed. Please try again.'}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            ))}
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
