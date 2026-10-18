import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    addDoc,
    updateDoc,
    doc,
    serverTimestamp,
    getDocs
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Feedback, ActionItem, ActionItemStatus } from '@/types';
import { toast } from 'sonner';

export function useFeedback() {
    const { user, userRole } = useAuth();
    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setFeedback([]);
            setActionItems([]);
            setLoading(false);
            return;
        }

        // Feedback query - get feedback given to user (as employee) or given by user (as manager)
        const feedbackField = userRole === 'employee' ? 'employeeId' : 'managerId';
        const feedbackQuery = query(
            collection(db, 'feedback'),
            where(feedbackField, '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribeFeedback = onSnapshot(feedbackQuery, (snapshot) => {
            const data: Feedback[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                checkInId: doc.data().checkInId,
                managerId: doc.data().managerId,
                managerName: doc.data().managerName,
                employeeId: doc.data().employeeId,
                employeeName: doc.data().employeeName,
                content: doc.data().content,
                acknowledged: doc.data().acknowledged || false,
                acknowledgedAt: doc.data().acknowledgedAt?.toDate?.()?.toISOString(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            setFeedback(data);
        });

        // Action items for user
        const actionItemsQuery = query(
            collection(db, 'actionItems'),
            where('employeeId', '==', user.uid),
            orderBy('dueDate', 'asc')
        );

        const unsubscribeActionItems = onSnapshot(actionItemsQuery, (snapshot) => {
            const data: ActionItem[] = snapshot.docs.map((doc) => ({
                id: doc.id,
                feedbackId: doc.data().feedbackId,
                employeeId: doc.data().employeeId,
                assignedById: doc.data().assignedById,
                title: doc.data().title,
                description: doc.data().description,
                dueDate: doc.data().dueDate,
                status: doc.data().status || 'open',
                completedAt: doc.data().completedAt?.toDate?.()?.toISOString(),
                createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || new Date().toISOString(),
            }));
            setActionItems(data);
            setLoading(false);
        });

        return () => {
            unsubscribeFeedback();
            unsubscribeActionItems();
        };
    }, [user, userRole]);

    const addFeedback = useCallback(async (data: {
        checkInId?: string;
        employeeId: string;
        employeeName: string;
        content: string;
    }) => {
        if (!user || userRole === 'employee') {
            toast.error('Only managers can give feedback');
            return null;
        }

        try {
            const docRef = await addDoc(collection(db, 'feedback'), {
                ...data,
                managerId: user.uid,
                managerName: user.displayName || 'Manager',
                acknowledged: false,
                createdAt: serverTimestamp(),
            });
            toast.success('Feedback sent');
            return docRef.id;
        } catch (error) {
            console.error('Error adding feedback:', error);
            toast.error('Failed to send feedback');
            return null;
        }
    }, [user, userRole]);

    const acknowledgeFeedback = useCallback(async (feedbackId: string) => {
        if (!user) return;

        try {
            await updateDoc(doc(db, 'feedback', feedbackId), {
                acknowledged: true,
                acknowledgedAt: serverTimestamp(),
            });
            toast.success('Feedback acknowledged');
        } catch (error) {
            console.error('Error acknowledging feedback:', error);
            toast.error('Failed to acknowledge feedback');
        }
    }, [user]);

    const addActionItem = useCallback(async (data: {
        feedbackId?: string;
        employeeId: string;
        title: string;
        description?: string;
        dueDate?: string;
    }) => {
        if (!user) return null;

        try {
            const docRef = await addDoc(collection(db, 'actionItems'), {
                ...data,
                assignedById: user.uid,
                status: 'open',
                createdAt: serverTimestamp(),
            });
            toast.success('Action item created');
            return docRef.id;
        } catch (error) {
            console.error('Error adding action item:', error);
            toast.error('Failed to create action item');
            return null;
        }
    }, [user]);

    const updateActionItemStatus = useCallback(async (itemId: string, status: ActionItemStatus) => {
        if (!user) return;

        try {
            const updates: Record<string, unknown> = { status };
            if (status === 'completed') {
                updates.completedAt = serverTimestamp();
            }
            await updateDoc(doc(db, 'actionItems', itemId), updates);
            toast.success('Action item updated');
        } catch (error) {
            console.error('Error updating action item:', error);
            toast.error('Failed to update action item');
        }
    }, [user]);

    // Stats
    const stats = {
        totalFeedback: feedback.length,
        unacknowledged: feedback.filter(f => !f.acknowledged).length,
        openActionItems: actionItems.filter(a => a.status === 'open').length,
        completedActionItems: actionItems.filter(a => a.status === 'completed').length,
        overdueActionItems: actionItems.filter(a =>
            a.status === 'open' && a.dueDate && new Date(a.dueDate) < new Date()
        ).length,
    };

    return {
        feedback,
        actionItems,
        loading,
        stats,
        addFeedback,
        acknowledgeFeedback,
        addActionItem,
        updateActionItemStatus,
    };
}
