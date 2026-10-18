import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserDataProvider } from "@/contexts/UserDataContext";
import AppLayout from "@/components/AppLayout";
import Landing from "./pages/Landing";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { Loader2 } from "lucide-react";

// Signed-in pages load on demand so the landing page stays small.
const Auth = lazy(() => import("./pages/Auth"));
const Onboard = lazy(() => import("./pages/Onboard"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Admin = lazy(() => import("./pages/Admin"));
const CheckIns = lazy(() => import("./pages/CheckIns"));
const Goals = lazy(() => import("./pages/Goals"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <UserDataProvider>
            <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public routes — no sidebar */}
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />

              {/* Onboarding — no sidebar (first-time flow) */}
              <Route path="/onboard" element={<ProtectedRoute allowIncompleteProfile><Onboard /></ProtectedRoute>} />

              {/* App routes — with sidebar layout */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/check-ins" element={<ProtectedRoute><AppLayout><CheckIns /></AppLayout></ProtectedRoute>} />
              <Route path="/goals" element={<ProtectedRoute><AppLayout><Goals /></AppLayout></ProtectedRoute>} />
              <Route path="/manager" element={<ProtectedRoute requiredRole="manager"><AppLayout><ManagerDashboard /></AppLayout></ProtectedRoute>} />
              <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AppLayout><Admin /></AppLayout></ProtectedRoute>} />

              <Route path="*" element={<NotFound />} />
            </Routes>
            </Suspense>
          </UserDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
