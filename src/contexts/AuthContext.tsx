import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, onAuthStateChanged, signOut as firebaseSignOut } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchUserProfile = async (uid: string): Promise<UserProfile | null> => {
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return {
          id: uid,
          email: data.email || '',
          fullName: data.fullName || '',
          avatarUrl: data.avatarUrl,
          role: data.role || 'employee',
          team: data.team,
          managerId: data.managerId,
          managerName: data.managerName,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profile = await fetchUserProfile(user.uid);
      if (profile) {
        setUserProfile(profile);
        setUserRole(profile.role);
      }
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        // Fetch or create user profile
        let profile = await fetchUserProfile(firebaseUser.uid);

        if (!profile) {
          // Create initial profile for new users
          const newProfile: Omit<UserProfile, 'id'> = {
            email: firebaseUser.email || '',
            fullName: firebaseUser.displayName || '',
            avatarUrl: firebaseUser.photoURL || undefined,
            role: 'employee',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };

          await setDoc(doc(db, "users", firebaseUser.uid), {
            ...newProfile,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          profile = { id: firebaseUser.uid, ...newProfile };
        }

        setUserProfile(profile);
        setUserRole(profile.role);
      } else {
        setUserProfile(null);
        setUserRole('employee');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setUserProfile(null);
      setUserRole('employee');
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

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
