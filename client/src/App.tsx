import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import BrokerDashboard from "@/pages/BrokerDashboard";
import UserProfile from "@/pages/UserProfile";
import DocumentLibrary from "@/pages/DocumentLibrary";
import ActivityDetails from "@/pages/ActivityDetails";
import ChatPage from "@/pages/ChatPage";
import DocumentsPage from "@/pages/DocumentsPage";
import VectorSearch from "@/pages/VectorSearch";
import AnalyticsPage from "@/pages/AnalyticsPage";
import DataIngestion from "@/pages/DataIngestion";
import RulesManagement from "@/pages/RulesManagement";
import Login from "@/pages/Login";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, isZurichUser, isExternalBroker } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Login />;
  }

  // External brokers get limited access
  if (isExternalBroker) {
    return (
      <Switch>
        <Route path="/" component={BrokerDashboard} />
        <Route path="/chat" component={ChatPage} />
        <Route component={BrokerDashboard} />
      </Switch>
    );
  }

  // Zurich users get full access
  if (isZurichUser) {
    return (
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/chat" component={ChatPage} />
        <Route path="/rules" component={RulesManagement} />
        <Route path="/search" component={VectorSearch} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route path="/documents" component={DocumentsPage} />
        <Route path="/data-ingestion" component={DataIngestion} />
        <Route path="/profile" component={UserProfile} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return <Login />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
