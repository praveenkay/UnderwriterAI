import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { RefreshCw, Upload, FileText, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface Document {
  id: number;
  filename: string;
  fileType: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  uploadDate: string;
  processedDate?: string;
  extractedRules: any[];
  fileSize?: number;
  processingTime?: number;
  errorMessage?: string;
  progress?: number;
}

interface ProcessingStats {
  totalDocuments: number;
  completed: number;
  processing: number;
  failed: number;
  pending: number;
}

export default function DataIngestion() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [fileType, setFileType] = useState('chat_log');

  const { data: documents = [], refetch, isLoading } = useQuery({
    queryKey: ['/api/documents'],
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
  });

  const { data: processingStats } = useQuery({
    queryKey: ['/api/documents/stats'],
    refetchInterval: 1000,
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('fileType', fileType);

      const response = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSelectedFile(null);
        refetch();
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
    } finally {
      setUploading(false);
    }
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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Data Ingestion</h1>
        <p className="text-muted-foreground">
          Upload and process documents for AI analysis and rule extraction
        </p>
      </div>

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

      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Upload Document</CardTitle>
          <CardDescription>
            Upload documents for AI analysis and rule extraction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Document Type</label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="chat_log">Chat Log</option>
                <option value="guideline">Guideline Document</option>
                <option value="policy">Policy Document</option>
                <option value="data_export">Data Export/Spreadsheet</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Select File</label>
              <input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                accept=".txt,.pdf,.doc,.docx,.csv,.json,.xlsx,.xls"
                className="w-full p-2 border rounded-md"
              />
            </div>
            
            <Button
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Document
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Documents List */}
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
              {documents.map((doc: Document) => {
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
                          <span className="ml-2 font-medium">{formatProcessingTime(doc.processingTime)}</span>
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
                          {doc.errorMessage || 'Processing failed due to an unknown error.'}
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
    </div>
  );
}