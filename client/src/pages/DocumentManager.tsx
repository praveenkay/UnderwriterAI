import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { 
  Upload, 
  FileText, 
  Download, 
  Trash2, 
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertTriangle,
  Eye,
  BarChart3
} from "lucide-react";

interface Document {
  id: number;
  filename: string;
  originalFilename: string;
  fileType: string;
  uploadDate: Date;
  processedDate?: Date;
  status: string;
  extractedRules: any[];
  extractedData: any;
  fileSize: number;
  brokerName: string;
}

export default function DocumentManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [selectedFileType, setSelectedFileType] = useState<string>("guideline");

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ["/api/documents"],
  });

  const uploadMutation = useMutation({
    mutationFn: async ({ file, fileType }: { file: File; fileType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileType', fileType);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to upload document");
      return response.json();
    },
    onSuccess: (result) => {
      toast({
        title: "Upload Successful",
        description: `Document uploaded and processed. Extracted ${result.extractedRules} rules.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/documents"] });
      setUploadingFile(null);
    },
    onError: () => {
      toast({
        title: "Upload Failed",
        description: "Failed to upload document. Please try again.",
        variant: "destructive",
      });
      setUploadingFile(null);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadingFile(file);
      uploadMutation.mutate({ file, fileType: selectedFileType });
    }
  };

  const handleDownload = async (documentId: number, filename: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}/download`);
      if (!response.ok) throw new Error("Failed to download document");
      
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
        title: "Download Started",
        description: "Document download has started.",
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Failed to download document.",
        variant: "destructive",
      });
    }
  };

  const filteredDocuments = documents.filter((doc: Document) => {
    const matchesSearch = 
      doc.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.brokerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "all" || doc.status === statusFilter;
    const matchesType = typeFilter === "all" || doc.fileType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return CheckCircle;
      case "processing": return Clock;
      case "failed": return AlertTriangle;
      default: return Clock;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "text-green-500";
      case "processing": return "text-yellow-500";
      case "failed": return "text-red-500";
      default: return "text-gray-500";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleString();
  };

  const uniqueStatuses = [...new Set(documents.map((d: Document) => d.status))];
  const uniqueTypes = [...new Set(documents.map((d: Document) => d.fileType))];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Document Manager</h1>
          <Badge variant="secondary" className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {documents.length} Documents
          </Badge>
        </div>

        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Upload Document
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Document Type</label>
                  <Select value={selectedFileType} onValueChange={setSelectedFileType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select document type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="guideline">Guidelines</SelectItem>
                      <SelectItem value="policy">Policy Document</SelectItem>
                      <SelectItem value="chat_log">Chat Log</SelectItem>
                      <SelectItem value="quote">Quote Document</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Select File</label>
                  <Input
                    type="file"
                    onChange={handleFileUpload}
                    disabled={uploadMutation.isPending}
                    accept=".txt,.pdf,.doc,.docx,.md"
                  />
                </div>
              </div>
              
              {uploadingFile && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Uploading: {uploadingFile.name}</span>
                    <span>{uploadMutation.isPending ? "Processing..." : "Done"}</span>
                  </div>
                  <Progress value={uploadMutation.isPending ? 65 : 100} className="h-2" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {uniqueStatuses.map(status => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Advanced
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Documents List */}
        <div className="space-y-4">
          {filteredDocuments.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No documents found
                </h3>
                <p className="text-gray-500">
                  {searchTerm || statusFilter !== "all" || typeFilter !== "all"
                    ? "Try adjusting your filters."
                    : "Upload your first document to get started."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredDocuments.map((document: Document) => {
              const StatusIcon = getStatusIcon(document.status);
              const statusColor = getStatusColor(document.status);
              
              return (
                <Card key={document.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {document.originalFilename}
                            </h3>
                            <Badge variant="outline" className="text-xs">
                              {document.fileType}
                            </Badge>
                            <div className={`flex items-center gap-1 ${statusColor}`}>
                              <StatusIcon className="w-4 h-4" />
                              <span className="text-sm capitalize">{document.status}</span>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                            <div>
                              <span className="font-medium">Uploaded:</span>
                              <br />
                              {formatDate(document.uploadDate)}
                            </div>
                            <div>
                              <span className="font-medium">Size:</span>
                              <br />
                              {formatFileSize(document.fileSize)}
                            </div>
                            <div>
                              <span className="font-medium">Broker:</span>
                              <br />
                              {document.brokerName}
                            </div>
                            <div>
                              <span className="font-medium">Rules Extracted:</span>
                              <br />
                              {Array.isArray(document.extractedRules) ? document.extractedRules.length : 0}
                            </div>
                          </div>

                          {document.extractedData && Object.keys(document.extractedData).length > 0 && (
                            <div className="mt-3 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                              <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-4 h-4 text-blue-500" />
                                <span className="text-sm font-medium">Extracted Insights</span>
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                {Object.entries(document.extractedData).map(([key, value]) => (
                                  <div key={key} className="flex justify-between">
                                    <span className="capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                                    <span>{Array.isArray(value) ? value.length : typeof value === 'object' ? Object.keys(value).length : 1} items</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(document.id, document.originalFilename)}
                          className="flex items-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          Download
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex items-center gap-2"
                        >
                          <Eye className="w-4 h-4" />
                          View
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}