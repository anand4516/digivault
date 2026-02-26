import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/components/ThemeProvider";
import AuthPage from "./pages/AuthPage";
import AppLayout from "./components/AppLayout";
import Dashboard from "./pages/Dashboard";
import HomePage from "./pages/HomePage";
import CapturePage from "./pages/CapturePage";
import CardDetailPage from "./pages/CardDetailPage";
import SettingsPage from "./pages/SettingsPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import WalletPage from "./pages/WalletPage";
import IdentityPage from "./pages/IdentityPage";
import BankDetailPage from "./pages/BankDetailPage";
import FinancePage from "./pages/FinancePage";
import TodoPage from "./pages/TodoPage";
import PasswordPage from "./pages/PasswordPage";
import DocumentsPage from "./pages/DocumentsPage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import SupportPage from "./pages/SupportPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthGate = () => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (user) return <Navigate to="/dashboard" replace />;
  return <AuthPage />;
};

const App = () => (
  <ThemeProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Sonner position="top-right" />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              <Route path="/" element={<AuthGate />} />
              <Route element={<AppLayout />}>
                <Route path="/dashboard" element={<HomePage />} />
                <Route path="/businessinfo" element={<Dashboard />} />
                <Route path="/capture" element={<CapturePage />} />
                <Route path="/card/:id" element={<CardDetailPage />} />
                <Route path="/analytics" element={<AnalyticsPage />} />
                <Route path="/wallet" element={<WalletPage />} />
                <Route path="/identity" element={<IdentityPage />} />
                <Route path="/bank" element={<BankDetailPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/todos" element={<TodoPage />} />
                <Route path="/passwords" element={<PasswordPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/privacy" element={<PrivacyPolicyPage />} />
                <Route path="/support" element={<SupportPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
