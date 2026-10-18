import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { UserCategory } from '@/types';
import { toast } from 'sonner';

interface UserDataContextType {
  categories: UserCategory[];
  teams: string[];
  loading: boolean;
  addCategory: (data: Omit<UserCategory, 'id' | 'userId' | 'createdAt'>) => Promise<void>;
  updateCategory: (id: string, data: Partial<UserCategory>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  addTeam: (name: string) => Promise<void>;
  deleteTeam: (name: string) => Promise<void>;
  refetch: () => void;
}

const UserDataContext = createContext<UserDataContextType | undefined>(undefined);

// One shared listener for the signed-in user's categories and teams. Every activity
// card reads these, so a per-component subscription would multiply Firestore reads.
export function UserDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [categories, setCategories] = useState<UserCategory[]>([]);
  const [teams, setTeams] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setCategories([]);
      setTeams([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    let categoriesReady = false;
    let teamsReady = false;
    const markReady = () => {
      if (categoriesReady && teamsReady) setLoading(false);
    };

    const unsubscribeCategories = onSnapshot(
      query(collection(db, 'userCategories'), where('userId', '==', user.uid), orderBy('name')),
      (snapshot) => {
        setCategories(snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            userId: data.userId,
            name: data.name,
            emoji: data.emoji || '📁',
            color: data.color || 'hsl(220 15% 60%)',
            keywords: data.keywords || [],
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          };
        }));
        categoriesReady = true;
        markReady();
      },
      (error) => {
        console.error('Error fetching categories:', error);
        categoriesReady = true;
        markReady();
      }
    );

    const unsubscribeTeams = onSnapshot(
      query(collection(db, 'userTeams'), where('userId', '==', user.uid)),
      (snapshot) => {
        const names = snapshot.docs.map((d) => d.data().name as string);
        setTeams(Array.from(new Set(names)).sort((a, b) => a.localeCompare(b)));
        teamsReady = true;
        markReady();
      },
      (error) => {
        console.error('Error fetching teams:', error);
        teamsReady = true;
        markReady();
      }
    );

    return () => {
      unsubscribeCategories();
      unsubscribeTeams();
    };
  }, [user]);

  const addCategory = useCallback(async (categoryData: Omit<UserCategory, 'id' | 'userId' | 'createdAt'>) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'userCategories'), {
        ...categoryData,
        userId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast.success('Category added');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error('Failed to add category');
    }
  }, [user]);

  const updateCategory = useCallback(async (id: string, data: Partial<UserCategory>) => {
    if (!user) return;
    const { id: _id, userId: _userId, createdAt: _createdAt, ...fields } = data;
    try {
      await updateDoc(doc(db, 'userCategories', id), { ...fields, updatedAt: serverTimestamp() });
      toast.success('Category updated');
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Failed to update category');
    }
  }, [user]);

  const deleteCategory = useCallback(async (id: string) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'userCategories', id));
      toast.success('Category deleted');
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Failed to delete category');
    }
  }, [user]);

  const addTeam = useCallback(async (name: string) => {
    if (!user) return;
    try {
      await addDoc(collection(db, 'userTeams'), {
        userId: user.uid,
        name,
        createdAt: serverTimestamp(),
      });
      toast.success('Team added');
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to add team');
    }
  }, [user]);

  const deleteTeam = useCallback(async (name: string) => {
    if (!user) return;
    try {
      const snapshot = await getDocs(query(
        collection(db, 'userTeams'),
        where('userId', '==', user.uid),
        where('name', '==', name)
      ));
      await Promise.all(snapshot.docs.map((d) => deleteDoc(d.ref)));
      toast.success('Team deleted');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  }, [user]);

  // Real-time listeners keep data fresh; kept for API compatibility.
  const refetch = useCallback(() => {}, []);

  return (
    <UserDataContext.Provider
      value={{ categories, teams, loading, addCategory, updateCategory, deleteCategory, addTeam, deleteTeam, refetch }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserDataContext() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error('useUserData must be used within a UserDataProvider');
  }
  return context;
}
