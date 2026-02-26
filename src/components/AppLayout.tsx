import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import AppSidebar from "@/components/AppSidebar";
import PinGate from "@/components/PinGate";
import PageTransition from "@/components/PageTransition";
import PullToRefresh from "@/components/PullToRefresh";

const AppLayout: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/" replace />;

  return (
    <PinGate>
      <div className="min-h-screen bg-background grain-overlay">
        <AppSidebar />
        <main className="md:ml-64 p-4 pt-[72px] md:p-6 md:pt-6 pb-6 relative z-10 max-w-full overflow-x-hidden">
          <PullToRefresh>
            <AnimatePresence mode="wait">
              <PageTransition key={location.pathname}>
                <Outlet />
              </PageTransition>
            </AnimatePresence>
          </PullToRefresh>
        </main>
      </div>
    </PinGate>
  );
};

export default AppLayout;
