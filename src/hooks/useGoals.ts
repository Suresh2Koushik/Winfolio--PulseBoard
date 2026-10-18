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
    serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Goal, GoalStatus } from '@/types';
import { toast } from 'sonner';

export function useGoals() {
    const { user, userProfile } = useAuth();
    // Copied onto each goal so the assigned manager can read it (see firestore.rules).
    const managerId = userProfile?.managerId ?? null;
    const [goals, setGoals] = useState<Goal[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setGoals([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'goals'),
            where('userId', '==', user.uid),
            orderBy('endDate', 'asc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Goal[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                userId: doc.data().userId,
                title: doc.data().title,
                description: doc.data().description,
                priority: doc.data().priority || 'medium',
                startDate: doc.data().startDate,
                endDate: doc.data().endDate,
                status: doc.data().status || 'on_track',
                progress: doc.data().progress || 0,
                linkedCheckInIds: doc.data().linkedCheckInIds || [],
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            setGoals(data);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching goals:', error);
            toast.error('Failed to load goals');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addGoal = useCallback(async (data: Omit<Goal, 'id' | 'userId' | 'linkedCheckInIds' | 'createdAt' | 'updatedAt'>) => {
        if (!user) {
            toast.error('You must be logged in');
            return null;
        }

        try {
            const docRef = await addDoc(collection(db, 'goals'), {
                ...data,
                userId: user.uid,
                managerId,
                linkedCheckInIds: [],
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast.success('Goal created!');
            return docRef.id;
        } catch (error) {
            console.error('Error adding goal:', error);
            toast.error('Failed to create goal');
            return null;
        }
    }, [user, managerId]);

    const updateGoal = useCallback(async (id: string, data: Partial<Goal>) => {
        if (!user) return;

        try {
            const { id: _id, userId: _userId, createdAt: _createdAt, ...fields } = data;
            await updateDoc(doc(db, 'goals', id), {
                ...fields,
                managerId,
                updatedAt: serverTimestamp(),
            });
            toast.success('Goal updated');
        } catch (error) {
            console.error('Error updating goal:', error);
            toast.error('Failed to update goal');
        }
    }, [user, managerId]);

    const updateGoalProgress = useCallback(async (id: string, progress: number, status?: GoalStatus) => {
        if (!user) return;

        try {
            const updates: Record<string, unknown> = {
                progress,
                managerId,
                updatedAt: serverTimestamp(),
            };

            if (status) {
                updates.status = status;
            } else if (progress >= 100) {
                updates.status = 'completed';
            }

            await updateDoc(doc(db, 'goals', id), updates);
        } catch (error) {
            console.error('Error updating goal progress:', error);
            toast.error('Failed to update progress');
        }
    }, [user, managerId]);

    const deleteGoal = useCallback(async (id: string) => {
        if (!user) return;

        try {
            await deleteDoc(doc(db, 'goals', id));
            toast.success('Goal deleted');
        } catch (error) {
            console.error('Error deleting goal:', error);
            toast.error('Failed to delete goal');
        }
    }, [user]);

    const linkCheckInToGoal = useCallback(async (goalId: string, checkInId: string) => {
        if (!user) return;

        try {
            const goal = goals.find(g => g.id === goalId);
            if (!goal) return;

            const linkedCheckInIds = [...goal.linkedCheckInIds, checkInId];
            await updateDoc(doc(db, 'goals', goalId), {
                linkedCheckInIds,
                managerId,
                updatedAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error linking check-in to goal:', error);
        }
    }, [user, goals, managerId]);

    // Calculate stats
    const stats = {
        total: goals.length,
        completed: goals.filter(g => g.status === 'completed').length,
        atRisk: goals.filter(g => g.status === 'at_risk').length,
        onTrack: goals.filter(g => g.status === 'on_track').length,
        behind: goals.filter(g => g.status === 'behind').length,
    };

    return {
        goals,
        loading,
        stats,
        addGoal,
        updateGoal,
        updateGoalProgress,
        deleteGoal,
        linkCheckInToGoal,
    };
}
