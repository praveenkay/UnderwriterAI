import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/Dashboard";
import UserProfile from "@/pages/UserProfile";
import DocumentLibrary from "@/pages/DocumentLibrary";
import ActivityDetails from "@/pages/ActivityDetails";
import ChatPage from "@/pages/ChatPage";
import DocumentsPage from "@/pages/DocumentsPage";
import VectorSearch from "@/pages/VectorSearch";
import AnalyticsPage from "@/pages/AnalyticsPage";
import DataIngestion from "@/pages/DataIngestion";
import RulesManagement from "@/pages/RulesManagement";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/rules" component={RulesManagement} />
      <Route path="/search" component={VectorSearch} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/documents" component={DocumentsPage} />
      <Route path="/data-ingestion" component={DataIngestion} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
