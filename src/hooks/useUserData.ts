import { useState, useEffect, useCallback } from 'react';
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
import { UserCategory, UserTeam } from '@/types';
import { toast } from 'sonner';

export function useUserData() {
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

    // Fetch categories
    const categoriesQuery = query(
      collection(db, 'userCategories'),
      where('userId', '==', user.uid),
      orderBy('name')
    );

    const unsubscribeCategories = onSnapshot(categoriesQuery, (snapshot) => {
      const categoriesData: UserCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        userId: doc.data().userId,
        name: doc.data().name,
        emoji: doc.data().emoji || '📁',
        color: doc.data().color || 'hsl(220 15% 60%)',
        keywords: doc.data().keywords || [],
        createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
      }));
      setCategories(categoriesData);
    });

    // Fetch teams
    const teamsQuery = query(
      collection(db, 'userTeams'),
      where('userId', '==', user.uid)
    );

    const unsubscribeTeams = onSnapshot(teamsQuery, (snapshot) => {
      const teamsData = snapshot.docs.map((doc) => doc.data().name);
      setTeams(teamsData);
      setLoading(false);
    });

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

    try {
      await updateDoc(doc(db, 'userCategories', id), data);
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
      const teamsQuery = query(
        collection(db, 'userTeams'),
        where('userId', '==', user.uid),
        where('name', '==', name)
      );
      const snapshot = await getDocs(teamsQuery);
      const deletePromises = snapshot.docs.map((d) => deleteDoc(doc(db, 'userTeams', d.id)));
      await Promise.all(deletePromises);
      toast.success('Team deleted');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  }, [user]);

  const refetch = useCallback(() => {
    // Real-time listeners keep data fresh
  }, []);

  return {
    categories,
    teams,
    loading,
    addCategory,
    updateCategory,
    deleteCategory,
    addTeam,
    deleteTeam,
    refetch,
  };
}
