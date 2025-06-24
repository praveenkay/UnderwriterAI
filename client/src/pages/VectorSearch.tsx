import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Database, 
  Zap,
  FileText,
  Clock
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

export default function VectorSearch() {
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch vector store stats
  const { data: vectorStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/vector/stats"]
  });

  // Vector search mutation
  const vectorSearchMutation = useMutation({
    mutationFn: async (query: string) => {
      return apiRequest("/api/vector/search", {
        method: "POST",
        body: JSON.stringify({ query, limit: 10 }),
        headers: { "Content-Type": "application/json" }
      });
    }
  });

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    vectorSearchMutation.mutate(searchQuery);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Vector Search</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              AI-powered semantic search through document content
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Indexed Chunks</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : vectorStats?.totalDocuments || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Source Files</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : vectorStats?.sources?.length || 0}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Last Updated</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {statsLoading ? '...' : 
                     vectorStats?.lastUpdate !== 'Never' ? 
                     formatDate(vectorStats?.lastUpdate) : 'Never'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Interface */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Semantic Document Search
            </CardTitle>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Search through document content using AI-powered semantic understanding
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Enter search query (e.g., 'renewal discounts for restaurants')"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1"
              />
              <Button 
                onClick={handleSearch}
                disabled={vectorSearchMutation.isPending || !searchQuery.trim()}
                className="px-8"
              >
                {vectorSearchMutation.isPending ? (
                  <Zap className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                Search
              </Button>
            </div>

            {/* Search Examples */}
            <div className="space-y-2">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Example searches:</p>
              <div className="flex flex-wrap gap-2">
                {[
                  "renewal discount policies",
                  "restaurant insurance coverage",
                  "risk assessment criteria", 
                  "escalation procedures",
                  "policy amendment rules"
                ].map((example) => (
                  <Button
                    key={example}
                    variant="outline"
                    size="sm"
                    onClick={() => setSearchQuery(example)}
                    className="text-xs"
                  >
                    {example}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Search Results */}
        {vectorSearchMutation.data && (
          <Card>
            <CardHeader>
              <CardTitle>Search Results ({vectorSearchMutation.data.total})</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Query: "{vectorSearchMutation.data.query}"
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {vectorSearchMutation.data.results.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No results found for your query.</p>
                  <p className="text-sm text-gray-400">Try different keywords or upload more documents.</p>
                </div>
              ) : (
                vectorSearchMutation.data.results.map((result: any, index: number) => (
                  <Card key={index} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-blue-500" />
                          <Badge variant="outline">
                            {result.metadata.source || 'Unknown Source'}
                          </Badge>
                          {result.metadata.fileType && (
                            <Badge variant="secondary" className="text-xs">
                              {result.metadata.fileType}
                            </Badge>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">
                            Relevance: {(result.score * 100).toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      
                      <div className="prose prose-sm max-w-none">
                        <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                          {result.content}
                        </p>
                      </div>
                      
                      {result.metadata.uploadDate && (
                        <div className="flex items-center justify-between mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            Uploaded: {formatDate(result.metadata.uploadDate)}
                          </div>
                          {result.metadata.brokerName && (
                            <div className="text-xs text-gray-500">
                              By: {result.metadata.brokerName}
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {vectorSearchMutation.isPending && (
          <Card>
            <CardContent className="p-8">
              <div className="flex items-center justify-center">
                <Zap className="h-6 w-6 animate-spin mr-3 text-blue-500" />
                <span className="text-gray-600">Searching through documents...</span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Source Files */}
        {vectorStats?.sources && vectorStats.sources.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Indexed Sources</CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Documents available for semantic search
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {vectorStats.sources.map((source: string, index: number) => (
                  <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <FileText className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                      {source}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}