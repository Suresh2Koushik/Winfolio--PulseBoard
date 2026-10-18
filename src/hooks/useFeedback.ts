import { useState, useEffect, useCallback } from 'react';
import {
    collection,
    query,
    where,
    onSnapshot,
    updateDoc,
    doc,
    serverTimestamp,
    writeBatch,
    QueryDocumentSnapshot,
    DocumentData,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { Feedback, ActionItem, ActionItemStatus } from '@/types';
import { toast } from 'sonner';

const toIso = (value: { toDate?: () => Date } | undefined) =>
    value?.toDate?.()?.toISOString();

function toFeedback(d: QueryDocumentSnapshot<DocumentData>): Feedback {
    // 'estimate' fills in pending server timestamps so new items sort correctly.
    const data = d.data({ serverTimestamps: 'estimate' });
    return {
        id: d.id,
        checkInId: data.checkInId,
        managerId: data.managerId,
        managerName: data.managerName,
        employeeId: data.employeeId,
        employeeName: data.employeeName,
        content: data.content,
        acknowledged: data.acknowledged || false,
        acknowledgedAt: toIso(data.acknowledgedAt),
        createdAt: toIso(data.createdAt) || new Date().toISOString(),
    };
}

function toActionItem(d: QueryDocumentSnapshot<DocumentData>): ActionItem {
    const data = d.data({ serverTimestamps: 'estimate' });
    return {
        id: d.id,
        feedbackId: data.feedbackId,
        employeeId: data.employeeId,
        assignedById: data.assignedById,
        title: data.title,
        description: data.description,
        dueDate: data.dueDate || undefined,
        status: data.status || 'open',
        completedAt: toIso(data.completedAt),
        createdAt: toIso(data.createdAt) || new Date().toISOString(),
    };
}

const newestFirst = (a: { createdAt: string }, b: { createdAt: string }) =>
    b.createdAt.localeCompare(a.createdAt);

// Items with a due date first (soonest first), then undated items, newest first.
const byDueDate = (a: ActionItem, b: ActionItem) => {
    if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return newestFirst(a, b);
};

export interface NewFeedback {
    employeeId: string;
    employeeName: string;
    content: string;
    checkInId?: string;
    actionItems?: { title: string; dueDate?: string }[];
}

export function useFeedback() {
    const { user, userProfile, userRole } = useAuth();
    const isManager = userRole === 'manager' || userRole === 'admin';

    const [feedback, setFeedback] = useState<Feedback[]>([]);
    const [givenFeedback, setGivenFeedback] = useState<Feedback[]>([]);
    const [actionItems, setActionItems] = useState<ActionItem[]>([]);
    const [assignedActionItems, setAssignedActionItems] = useState<ActionItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user) {
            setFeedback([]);
            setGivenFeedback([]);
            setActionItems([]);
            setAssignedActionItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        const pending = new Set<string>();
        const unsubscribers: (() => void)[] = [];

        // Each listener clears its key on first result or error, so a failed query
        // can never leave the UI loading forever.
        const listen = <T,>(
            key: string,
            field: string,
            collectionName: string,
            map: (d: QueryDocumentSnapshot<DocumentData>) => T,
            sort: (a: T, b: T) => number,
            set: (items: T[]) => void,
        ) => {
            pending.add(key);
            const settle = () => {
                pending.delete(key);
                if (pending.size === 0) setLoading(false);
            };
            unsubscribers.push(onSnapshot(
                query(collection(db, collectionName), where(field, '==', user.uid)),
                (snapshot) => {
                    set(snapshot.docs.map(map).sort(sort));
                    settle();
                },
                (error) => {
                    console.error(`Error loading ${key}:`, error);
                    settle();
                },
            ));
        };

        listen<Feedback>('received feedback', 'employeeId', 'feedback', toFeedback, newestFirst, setFeedback);
        listen<ActionItem>('action items', 'employeeId', 'actionItems', toActionItem, byDueDate, setActionItems);
        if (isManager) {
            listen<Feedback>('given feedback', 'managerId', 'feedback', toFeedback, newestFirst, setGivenFeedback);
            listen<ActionItem>('assigned action items', 'assignedById', 'actionItems', toActionItem, byDueDate, setAssignedActionItems);
        } else {
            setGivenFeedback([]);
            setAssignedActionItems([]);
        }

        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [user, isManager]);

    /** Sends feedback and any attached action items in one atomic write. */
    const addFeedback = useCallback(async (data: NewFeedback) => {
        if (!user || !isManager) {
            toast.error('Only managers can give feedback');
            return null;
        }

        try {
            const batch = writeBatch(db);
            const feedbackRef = doc(collection(db, 'feedback'));
            batch.set(feedbackRef, {
                checkInId: data.checkInId,
                employeeId: data.employeeId,
                employeeName: data.employeeName.slice(0, 100) || 'Employee',
                managerId: user.uid,
                managerName: (userProfile?.fullName || user.email || 'Manager').slice(0, 100),
                content: data.content,
                acknowledged: false,
                createdAt: serverTimestamp(),
            });

            for (const item of data.actionItems ?? []) {
                batch.set(doc(collection(db, 'actionItems')), {
                    feedbackId: feedbackRef.id,
                    employeeId: data.employeeId,
                    assignedById: user.uid,
                    title: item.title,
                    dueDate: item.dueDate || null,
                    status: 'open',
                    createdAt: serverTimestamp(),
                });
            }

            await batch.commit();
            toast.success('Feedback sent');
            return feedbackRef.id;
        } catch (error) {
            console.error('Error adding feedback:', error);
            toast.error('Failed to send feedback');
            return null;
        }
    }, [user, userProfile, isManager]);

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

    const updateActionItemStatus = useCallback(async (itemId: string, status: ActionItemStatus) => {
        if (!user) return;

        try {
            await updateDoc(doc(db, 'actionItems', itemId), {
                status,
                completedAt: status === 'completed' ? serverTimestamp() : null,
            });
            toast.success(status === 'completed' ? 'Action item completed' : 'Action item updated');
        } catch (error) {
            console.error('Error updating action item:', error);
            toast.error('Failed to update action item');
        }
    }, [user]);

    const isOverdue = (a: ActionItem) =>
        a.status !== 'completed' && a.status !== 'cancelled' && !!a.dueDate
        && a.dueDate < new Date().toISOString().slice(0, 10);

    const stats = {
        totalFeedback: feedback.length,
        unacknowledged: feedback.filter(f => !f.acknowledged).length,
        openActionItems: actionItems.filter(a => a.status === 'open' || a.status === 'in_progress').length,
        completedActionItems: actionItems.filter(a => a.status === 'completed').length,
        overdueActionItems: actionItems.filter(isOverdue).length,
    };

    return {
        feedback,
        givenFeedback,
        actionItems,
        assignedActionItems,
        loading,
        stats,
        addFeedback,
        acknowledgeFeedback,
        updateActionItemStatus,
    };
}
