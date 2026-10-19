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
import { CheckIn } from '@/types';
import { toast } from 'sonner';

export function useCheckIns() {
    const { user, userProfile } = useAuth();
    // Copied onto each check-in so the assigned manager can read it (see firestore.rules).
    const managerId = userProfile?.managerId ?? null;
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setCheckIns([]);
            setLoading(false);
            return;
        }

        const q = query(
            collection(db, 'checkIns'),
            where('userId', '==', user.uid),
            orderBy('weekStart', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: CheckIn[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                userId: doc.data().userId,
                weekStart: doc.data().weekStart,
                weekEnd: doc.data().weekEnd,
                workSummary: doc.data().workSummary,
                achievements: doc.data().achievements,
                blockers: doc.data().blockers,
                supportNeeded: doc.data().supportNeeded,
                linkedGoalIds: doc.data().linkedGoalIds || [],
                categories: doc.data().categories || [],
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                updatedAt: doc.data().updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            setCheckIns(data);
            setLoading(false);
        }, (error) => {
            console.error('Error fetching check-ins:', error);
            toast.error('Failed to load reflections');
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const addCheckIn = useCallback(async (data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (!user) {
            toast.error('You must be logged in');
            return null;
        }

        try {
            const docRef = await addDoc(collection(db, 'checkIns'), {
                ...data,
                userId: user.uid,
                managerId,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast.success('Reflection saved');
            return docRef.id;
        } catch (error) {
            console.error('Error adding check-in:', error);
            toast.error('Failed to save reflection');
            return null;
        }
    }, [user, managerId]);

    const updateCheckIn = useCallback(async (id: string, data: Partial<CheckIn>) => {
        if (!user) return;

        try {
            const { id: _id, userId: _userId, createdAt: _createdAt, ...fields } = data;
            await updateDoc(doc(db, 'checkIns', id), {
                ...fields,
                managerId,
                updatedAt: serverTimestamp(),
            });
            toast.success('Reflection updated');
        } catch (error) {
            console.error('Error updating check-in:', error);
            toast.error('Failed to update reflection');
        }
    }, [user, managerId]);

    const deleteCheckIn = useCallback(async (id: string) => {
        if (!user) return;

        try {
            await deleteDoc(doc(db, 'checkIns', id));
            toast.success('Reflection deleted');
        } catch (error) {
            console.error('Error deleting check-in:', error);
            toast.error('Failed to delete reflection');
        }
    }, [user]);

    return {
        checkIns,
        loading,
        addCheckIn,
        updateCheckIn,
        deleteCheckIn,
    };
}
