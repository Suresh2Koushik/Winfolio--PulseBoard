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
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Activity } from '@/types';
import { getWeekNumber, getQuarter } from '@/utils/categorization';
import { toast } from 'sonner';
import { parseISO } from 'date-fns';

export function useActivities() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setActivities([]);
      setLoading(false);
      return;
    }

    const q = query(
      collection(db, 'activities'),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activitiesData: Activity[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
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
      });
      setActivities(activitiesData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activities');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addActivity = useCallback(async (activityData: Omit<Activity, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      toast.error('You must be logged in to add activities');
      return;
    }

    try {
      const date = parseISO(activityData.date);
      const weekNumber = getWeekNumber(date);
      // Respect an explicitly chosen quarter; otherwise derive it from the date.
      const quarter = activityData.quarter || getQuarter(date);

      await addDoc(collection(db, 'activities'), {
        ...activityData,
        userId: user.uid,
        weekNumber,
        quarter,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast.success('Activity added successfully');
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to add activity');
    }
  }, [user]);

  const updateActivity = useCallback(async (id: string, activityData: Partial<Activity>) => {
    if (!user) {
      toast.error('You must be logged in to update activities');
      return;
    }

    try {
      const activityRef = doc(db, 'activities', id);

      // Never let identity/audit fields be rewritten from the form.
      const { id: _id, userId: _userId, createdAt: _createdAt, ...fields } = activityData;
      const updates: Record<string, unknown> = {
        ...fields,
        updatedAt: serverTimestamp(),
      };

      // Recalculate week number and quarter if date changed
      if (activityData.date) {
        const date = parseISO(activityData.date);
        updates.weekNumber = getWeekNumber(date);
        updates.quarter = activityData.quarter || getQuarter(date);
      }

      await updateDoc(activityRef, updates);
      toast.success('Activity updated successfully');
    } catch (error) {
      console.error('Error updating activity:', error);
      toast.error('Failed to update activity');
    }
  }, [user]);

  const deleteActivity = useCallback(async (id: string) => {
    if (!user) {
      toast.error('You must be logged in to delete activities');
      return;
    }

    try {
      await deleteDoc(doc(db, 'activities', id));
      toast.success('Activity deleted successfully');
    } catch (error) {
      console.error('Error deleting activity:', error);
      toast.error('Failed to delete activity');
    }
  }, [user]);

  const refetch = useCallback(() => {
    // With Firestore real-time listeners, data is always fresh
    // This is kept for API compatibility
  }, []);

  return {
    activities,
    loading,
    addActivity,
    updateActivity,
    deleteActivity,
    refetch,
  };
}
