import { useCallback } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';

type ActionType =
    | 'check_in_created'
    | 'check_in_updated'
    | 'goal_created'
    | 'goal_updated'
    | 'goal_completed'
    | 'feedback_given'
    | 'feedback_acknowledged'
    | 'action_item_created'
    | 'action_item_completed'
    | 'profile_updated';

type EntityType = 'check_in' | 'goal' | 'feedback' | 'action_item' | 'profile';

export function useAuditLog() {
    const { user, userProfile } = useAuth();

    const logAction = useCallback(async (
        actionType: ActionType,
        entityType: EntityType,
        entityId?: string,
        details?: Record<string, unknown>
    ) => {
        if (!user) return;

        try {
            await addDoc(collection(db, 'auditLogs'), {
                userId: user.uid,
                userName: userProfile?.fullName || user.email || 'Unknown',
                actionType,
                entityType,
                entityId,
                details,
                createdAt: serverTimestamp(),
            });
        } catch (error) {
            console.error('Error logging action:', error);
            // Don't show error to user - audit logging should be silent
        }
    }, [user, userProfile]);

    return { logAction };
}
