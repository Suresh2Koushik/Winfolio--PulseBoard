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
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from '@/types';
import { getWeekNumber, getQuarter } from '@/utils/categorization';
import { toast } from 'sonner';
import { parseISO } from 'date-fns';

export type NewActivity = Omit<Activity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

interface ActivitiesContextType {
  activities: Activity[];
  loading: boolean;
  /** Resolves true when saved, false on failure (an error toast has been shown). */
  addActivity: (data: NewActivity) => Promise<boolean>;
  updateActivity: (id: string, data: Partial<Activity>) => Promise<boolean>;
  deleteActivity: (id: string) => Promise<boolean>;
  refetch: () => void;
}

const ActivitiesContext = createContext<ActivitiesContextType | undefined>(undefined);

/**
 * One live listener on the signed-in user's wins, shared by Home, Wins, Reviews and
 * the global "Log a win" dialog.
 */
export function ActivitiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'activities'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setActivities(snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          userId: data.userId,
          date: data.date,
          weekNumber: data.weekNumber,
          quarter: data.quarter,
          title: data.title,
          description: data.description,
          category: data.category,
          teams: data.teams || [],
          impactNotes: data.impactNotes || '',
          status: data.status,
          attachmentUrl: data.attachmentUrl,
          praises: data.praises,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
        };
      }));
      setLoading(false);
    }, (error) => {
      console.error('Error fetching wins:', error);
      toast.error("Couldn't load your wins. Please refresh the page.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addActivity = useCallback(async (activityData: NewActivity) => {
    if (!user) {
      toast.error('Please sign in to save a win');
      return false;
    }
    try {
      const date = parseISO(activityData.date);
      await addDoc(collection(db, 'activities'), {
        ...activityData,
        userId: user.uid,
        weekNumber: getWeekNumber(date),
        // Respect an explicitly chosen quarter; otherwise derive it from the date.
        quarter: activityData.quarter || getQuarter(date),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return true;
    } catch (error) {
      console.error('Error adding win:', error);
      toast.error("Couldn't save your win. Please try again.");
      return false;
    }
  }, [user]);

  const updateActivity = useCallback(async (id: string, activityData: Partial<Activity>) => {
    if (!user) {
      toast.error('Please sign in to edit a win');
      return false;
    }
    try {
      // Never let identity/audit fields be rewritten from the form.
      const { id: _id, userId: _userId, createdAt: _createdAt, ...fields } = activityData;
      const updates: Record<string, unknown> = { ...fields, updatedAt: serverTimestamp() };

      // Recalculate week number and quarter if the date changed.
      if (activityData.date) {
        const date = parseISO(activityData.date);
        updates.weekNumber = getWeekNumber(date);
        updates.quarter = activityData.quarter || getQuarter(date);
      }

      await updateDoc(doc(db, 'activities', id), updates);
      toast.success('Win updated');
      return true;
    } catch (error) {
      console.error('Error updating win:', error);
      toast.error("Couldn't update your win. Please try again.");
      return false;
    }
  }, [user]);

  const deleteActivity = useCallback(async (id: string) => {
    if (!user) return false;
    try {
      await deleteDoc(doc(db, 'activities', id));
      toast.success('Win deleted');
      return true;
    } catch (error) {
      console.error('Error deleting win:', error);
      toast.error("Couldn't delete your win. Please try again.");
      return false;
    }
  }, [user]);

  // Real-time listener keeps data fresh; kept for API compatibility.
  const refetch = useCallback(() => {}, []);

  return (
    <ActivitiesContext.Provider value={{ activities, loading, addActivity, updateActivity, deleteActivity, refetch }}>
      {children}
    </ActivitiesContext.Provider>
  );
}

export function useActivitiesContext() {
  const context = useContext(ActivitiesContext);
  if (context === undefined) {
    throw new Error('useActivities must be used within an ActivitiesProvider');
  }
  return context;
}
