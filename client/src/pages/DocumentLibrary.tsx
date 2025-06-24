import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Upload, 
  FileText, 
  Download, 
  Search, 
  Filter,
  Eye,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  FileX
} from "lucide-react";

export default function DocumentLibrary() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploading, setUploading] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      setUploading(true);
      setUploadProgress(0);
      
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      return response.json();
    },
    onSuccess: (result) => {
      setUploading(false);
      setUploadProgress(0);
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      
      toast({
        title: "Upload Successful",
        description: `Document processed successfully. ${result.extractedRules} rules extracted.`,
      });
    },
    onError: () => {
      setUploading(false);
      setUploadProgress(0);
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("fileType", "document");

    uploadMutation.mutate(formData);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'processing':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'failed':
        return <FileX className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const filteredDocuments = documents.filter(doc => {
    const matchesSearch = doc.originalFilename.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         doc.fileType.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || doc.fileType === selectedType;
    return matchesSearch && matchesType;
  });

  const downloadDocument = (documentId: number, filename: string) => {
    window.open(`/api/documents/${documentId}/download`, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Library</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Upload, process, and manage your underwriting documents
            </p>
          </div>
          
          {/* Upload Section */}
          <div className="flex items-center gap-4">
            <input
              type="file"
              id="file-upload"
              className="hidden"
              accept=".txt,.pdf,.doc,.docx,.csv,.json"
              onChange={handleFileUpload}
              disabled={uploading}
            />
            <label htmlFor="file-upload">
              <Button 
                className="flex items-center gap-2" 
                disabled={uploading}
                asChild
              >
                <span>
                  <Upload className="h-4 w-4" />
                  {uploading ? "Uploading..." : "Upload Document"}
                </span>
              </Button>
            </label>
          </div>
        </div>

        {/* Upload Progress */}
        {uploading && (
          <Card>
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Uploading and processing document...</span>
                  <span className="text-sm text-gray-600">{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="w-full" />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search and Filter */}
        <Card>
          <CardContent className="p-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md dark:border-gray-600 dark:bg-gray-800"
              >
                <option value="all">All Types</option>
                <option value="chat_log">Chat Logs</option>
                <option value="guideline">Guidelines</option>
                <option value="policy">Policies</option>
                <option value="quote">Quotes</option>
                <option value="document">Documents</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No documents found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {searchQuery ? "Try adjusting your search criteria" : "Upload your first document to get started"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((document) => (
              <Card key={document.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <FileText className="h-8 w-8 text-blue-500" />
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                          {document.originalFilename}
                        </h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <span>{formatFileSize(document.fileSize)}</span>
                          <span>•</span>
                          <span>Uploaded {formatDate(document.uploadDate)}</span>
                          <span>•</span>
                          <span className="capitalize">{document.fileType.replace('_', ' ')}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Status */}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(document.status)}
                        <Badge className={getStatusColor(document.status)}>
                          {document.status}
                        </Badge>
                      </div>

                      {/* Rules Extracted */}
                      {document.extractedRules && Array.isArray(document.extractedRules) && (
                        <div className="text-sm">
                          <span className="font-medium text-green-600">
                            {document.extractedRules.length}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400 ml-1">rules</span>
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadDocument(document.id, document.originalFilename)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Processing Details */}
                  {document.status === 'completed' && document.extractedRules && Array.isArray(document.extractedRules) && document.extractedRules.length > 0 && (
                    <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium text-green-800 dark:text-green-300">
                          Processing completed successfully
                        </span>
                        <div className="mt-1 text-green-700 dark:text-green-400">
                          Extracted {document.extractedRules.length} underwriting rules from this document
                        </div>
                      </div>
                    </div>
                  )}

                  {document.status === 'failed' && (
                    <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                      <div className="text-sm">
                        <span className="font-medium text-red-800 dark:text-red-300">
                          Processing failed
                        </span>
                        <div className="mt-1 text-red-700 dark:text-red-400">
                          Unable to process this document. Please try uploading again.
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Download Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Export Options</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={() => window.open('/api/reports/documents', '_blank')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Document Report (PDF)
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open('/api/reports/broker-performance', '_blank')}
                className="flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Performance Report (PDF)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}