import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { ensureUserProfile, syncManagerTags } from "@/lib/userProfile";
import { useNavigate } from "react-router-dom";
import { UserProfile, UserRole } from "@/types";

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  userRole: UserRole;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profileReady, setProfileReady] = useState(false);
  const syncedManager = useRef<string | null | undefined>(undefined);
  const navigate = useNavigate();

  useEffect(() => {
    return onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setProfileReady(false);
      if (!firebaseUser) {
        setUserProfile(null);
        syncedManager.current = undefined;
      }
      setAuthReady(true);
    });
  }, []);

  // Keep the profile live so role changes and onboarding apply without a reload.
  useEffect(() => {
    if (!user) return;
    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    ensureUserProfile(user)
      .catch((error) => console.error("Error creating user profile:", error))
      .finally(() => {
        if (cancelled) return;
        unsubscribe = onSnapshot(
          doc(db, "users", user.uid),
          (snap) => {
            if (snap.exists()) {
              const data = snap.data();
              setUserProfile({
                id: user.uid,
                email: data.email || user.email || '',
                fullName: data.fullName || '',
                avatarUrl: data.avatarUrl || undefined,
                role: data.role || 'employee',
                team: data.team || undefined,
                managerId: data.managerId || undefined,
                managerName: data.managerName || undefined,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
              });
            } else {
              setUserProfile(null);
            }
            setProfileReady(true);
          },
          (error) => {
            console.error("Error loading user profile:", error);
            setProfileReady(true);
          }
        );
      });

    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [user]);

  // Re-tag check-ins/goals when the reporting line changes (once per value per session).
  useEffect(() => {
    if (!user || !userProfile) return;
    const managerId = userProfile.managerId ?? null;
    if (syncedManager.current === managerId) return;
    syncedManager.current = managerId;
    syncManagerTags(user.uid, managerId).catch((error) =>
      console.error("Error syncing manager access:", error)
    );
  }, [user, userProfile]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // The profile is a live listener; kept for callers that expect an explicit refresh.
  const refreshProfile = async () => {};

  const loading = !authReady || (user !== null && !profileReady);
  const userRole: UserRole = userProfile?.role ?? 'employee';

  return (
    <AuthContext.Provider value={{ user, userProfile, userRole, loading, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
