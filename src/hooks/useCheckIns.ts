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
import { CheckIn } from '@/types';
import { toast } from 'sonner';

export function useCheckIns() {
    const { user } = useAuth();
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
            toast.error('Failed to load check-ins');
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
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            });
            toast.success('Check-in submitted!');
            return docRef.id;
        } catch (error) {
            console.error('Error adding check-in:', error);
            toast.error('Failed to submit check-in');
            return null;
        }
    }, [user]);

    const updateCheckIn = useCallback(async (id: string, data: Partial<CheckIn>) => {
        if (!user) return;

        try {
            await updateDoc(doc(db, 'checkIns', id), {
                ...data,
                updatedAt: serverTimestamp(),
            });
            toast.success('Check-in updated');
        } catch (error) {
            console.error('Error updating check-in:', error);
            toast.error('Failed to update check-in');
        }
    }, [user]);

    const deleteCheckIn = useCallback(async (id: string) => {
        if (!user) return;

        try {
            await deleteDoc(doc(db, 'checkIns', id));
            toast.success('Check-in deleted');
        } catch (error) {
            console.error('Error deleting check-in:', error);
            toast.error('Failed to delete check-in');
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

// Hook for managers to view team check-ins
export function useTeamCheckIns() {
    const { user, userRole } = useAuth();
    const [checkIns, setCheckIns] = useState<(CheckIn & { userName: string; userEmail: string })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || userRole === 'employee') {
            setCheckIns([]);
            setLoading(false);
            return;
        }

        const fetchTeamCheckIns = async () => {
            try {
                // Get team members (users where managerId == current user)
                const usersQuery = query(
                    collection(db, 'users'),
                    where('managerId', '==', user.uid)
                );
                const usersSnapshot = await getDocs(usersQuery);
                const teamUserIds = usersSnapshot.docs.map(d => d.id);
                const userMap = new Map(usersSnapshot.docs.map(d => [d.id, d.data()]));

                if (teamUserIds.length === 0) {
                    setCheckIns([]);
                    setLoading(false);
                    return;
                }

                // Get check-ins for team members
                const checkInsQuery = query(
                    collection(db, 'checkIns'),
                    where('userId', 'in', teamUserIds.slice(0, 10)), // Firestore 'in' limit is 10
                    orderBy('weekStart', 'desc')
                );

                const unsubscribe = onSnapshot(checkInsQuery, (snapshot) => {
                    const data = snapshot.docs.map((doc) => {
                        const checkInData = doc.data();
                        const userData = userMap.get(checkInData.userId);
                        return {
                            id: doc.id,
                            userId: checkInData.userId,
                            weekStart: checkInData.weekStart,
                            weekEnd: checkInData.weekEnd,
                            workSummary: checkInData.workSummary,
                            achievements: checkInData.achievements,
                            blockers: checkInData.blockers,
                            supportNeeded: checkInData.supportNeeded,
                            linkedGoalIds: checkInData.linkedGoalIds || [],
                            categories: checkInData.categories || [],
                            createdAt: checkInData.createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                            updatedAt: checkInData.updatedAt?.toDate?.()?.toISOString() || new Date().toISOString(),
                            userName: userData?.fullName || 'Unknown',
                            userEmail: userData?.email || '',
                        };
                    });
                    setCheckIns(data);
                    setLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error('Error fetching team check-ins:', error);
                setLoading(false);
            }
        };

        fetchTeamCheckIns();
    }, [user, userRole]);

    return { checkIns, loading };
}
