import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import AppLayout from "@/components/AppLayout";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Onboard from "./pages/Onboard";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import CheckIns from "./pages/CheckIns";
import Goals from "./pages/Goals";
import ManagerDashboard from "./pages/ManagerDashboard";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes — no sidebar */}
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />

            {/* Onboarding — no sidebar (first-time flow) */}
            <Route path="/onboard" element={<ProtectedRoute><Onboard /></ProtectedRoute>} />

            {/* App routes — with sidebar layout */}
            <Route path="/dashboard" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/check-ins" element={<ProtectedRoute><AppLayout><CheckIns /></AppLayout></ProtectedRoute>} />
            <Route path="/goals" element={<ProtectedRoute><AppLayout><Goals /></AppLayout></ProtectedRoute>} />
            <Route path="/manager" element={<ProtectedRoute><AppLayout><ManagerDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AppLayout><Admin /></AppLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
