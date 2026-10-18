import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'employee' | 'manager' | 'admin';
}

export default function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, userRole, loading } = useAuth();
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

  // Check role-based access
  if (requiredRole) {
    const roleHierarchy = { employee: 1, manager: 2, admin: 3 };
    const userRoleLevel = roleHierarchy[userRole] || 1;
    const requiredLevel = roleHierarchy[requiredRole];

    if (userRoleLevel < requiredLevel) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}
