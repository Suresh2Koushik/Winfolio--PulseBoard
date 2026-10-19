import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, ReactNode, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { UserDataProvider } from "@/contexts/UserDataContext";
import { ActivitiesProvider } from "@/contexts/ActivitiesContext";
import { CelebrationProvider } from "@/contexts/CelebrationContext";
import { LogWinProvider } from "@/contexts/LogWinContext";
import AppLayout from "@/components/AppLayout";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import { TEAMS_ENABLED } from "@/lib/features";
import { Loader2 } from "lucide-react";

// Signed-in pages load on demand so the home page stays small.
const Auth = lazy(() => import("./pages/Auth"));
const Onboard = lazy(() => import("./pages/Onboard"));
const WinfolioPlayful = lazy(() => import("./pages/WinfolioPlayful"));
const Home = lazy(() => import("./pages/Dashboard"));
const Wins = lazy(() => import("./pages/Wins"));
const Reviews = lazy(() => import("./pages/Reviews"));
const Settings = lazy(() => import("./pages/Settings"));
const Admin = lazy(() => import("./pages/Admin"));
const Reflections = lazy(() => import("./pages/CheckIns"));
const Goals = lazy(() => import("./pages/Goals"));
const ManagerDashboard = lazy(() => import("./pages/ManagerDashboard"));

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <Loader2 className="w-8 h-8 animate-spin text-accent" aria-label="Loading" />
  </div>
);

const queryClient = new QueryClient();

/** A signed-in page inside the app shell. */
const AppPage = ({ children, role }: { children: ReactNode; role?: "manager" | "admin" }) => (
  <ProtectedRoute requiredRole={role}>
    <AppLayout>{children}</AppLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-center" />
      <BrowserRouter>
        <AuthProvider>
          <UserDataProvider>
            <ActivitiesProvider>
              <CelebrationProvider>
                <LogWinProvider>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      {/* Public */}
                      <Route path="/" element={<WinfolioPlayful />} />
                      <Route path="/auth" element={<Auth />} />

                      {/* First-time setup and profile editing, without the sidebar */}
                      <Route path="/onboard" element={<ProtectedRoute allowIncompleteProfile><Onboard /></ProtectedRoute>} />

                      {/* App */}
                      <Route path="/dashboard" element={<AppPage><Home /></AppPage>} />
                      <Route path="/wins" element={<AppPage><Wins /></AppPage>} />
                      <Route path="/reflections" element={<AppPage><Reflections /></AppPage>} />
                      <Route path="/goals" element={<AppPage><Goals /></AppPage>} />
                      <Route path="/reviews" element={<AppPage><Reviews /></AppPage>} />
                      <Route path="/settings" element={<AppPage><Settings /></AppPage>} />
                      {TEAMS_ENABLED && (
                        <Route path="/manager" element={<AppPage role="manager"><ManagerDashboard /></AppPage>} />
                      )}
                      <Route path="/admin" element={<AppPage role="admin"><Admin /></AppPage>} />

                      {/* Old addresses */}
                      <Route path="/check-ins" element={<Navigate to="/reflections" replace />} />

                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </LogWinProvider>
              </CelebrationProvider>
            </ActivitiesProvider>
          </UserDataProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
