import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'employee' | 'manager' | 'admin';
  /** Set on the onboarding route itself so it doesn't redirect to itself. */
  allowIncompleteProfile?: boolean;
}

const ROLE_LEVEL = { employee: 1, manager: 2, admin: 3 } as const;

// UI-level gating only. Data access is enforced by firestore.rules.
export default function ProtectedRoute({ children, requiredRole, allowIncompleteProfile }: ProtectedRouteProps) {
  const { user, userProfile, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary/20">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent animate-pulse" />
            <Loader2 className="w-8 h-8 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white animate-spin" />
          </div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to auth page but save the intended destination
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // New accounts finish onboarding (team + manager) before using the app.
  if (!allowIncompleteProfile && userProfile && !userProfile.team && userRole !== 'admin') {
    return <Navigate to="/onboard" replace />;
  }

  if (requiredRole && (ROLE_LEVEL[userRole] ?? 1) < ROLE_LEVEL[requiredRole]) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}
