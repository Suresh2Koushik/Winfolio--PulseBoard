import { useState, useEffect, useMemo } from 'react';
import {
    collection,
    query,
    where,
    orderBy,
    limit,
    onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember, CheckIn, Goal, ActionItemStatus } from '@/types';
import { parseISO, subDays } from 'date-fns';

export type TeamCheckIn = CheckIn & { userName: string; userEmail: string };

interface MemberRecord {
    id: string;
    email: string;
    fullName: string;
    avatarUrl?: string;
    team?: string;
}

const toIso = (value: { toDate?: () => Date } | undefined) =>
    value?.toDate?.()?.toISOString() || new Date().toISOString();

/**
 * Everything a manager sees about their direct reports. Uses three live queries
 * scoped by managerId (which firestore.rules can verify) instead of per-member reads.
 */
export function useTeamData() {
    const { user, userRole } = useAuth();
    const isManager = userRole === 'manager' || userRole === 'admin';

    const [members, setMembers] = useState<MemberRecord[]>([]);
    const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
    const [goals, setGoals] = useState<Pick<Goal, 'id' | 'userId' | 'status'>[]>([]);
    const [actionItems, setActionItems] = useState<{ employeeId: string; status: ActionItemStatus }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user || !isManager) {
            setMembers([]);
            setCheckIns([]);
            setGoals([]);
            setActionItems([]);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);
        const pending = new Set(['members', 'checkIns', 'goals', 'actionItems']);
        const settle = (key: string) => {
            pending.delete(key);
            if (pending.size === 0) setLoading(false);
        };
        const fail = (key: string) => (err: Error) => {
            console.error(`Error loading team ${key}:`, err);
            setError('Some team data could not be loaded.');
            settle(key);
        };

        const unsubscribers = [
            onSnapshot(
                query(collection(db, 'users'), where('managerId', '==', user.uid)),
                (snapshot) => {
                    setMembers(snapshot.docs.map((d) => ({
                        id: d.id,
                        email: d.data().email || '',
                        fullName: d.data().fullName || d.data().email || 'Team member',
                        avatarUrl: d.data().avatarUrl || undefined,
                        team: d.data().team || undefined,
                    })));
                    settle('members');
                },
                fail('members'),
            ),
            onSnapshot(
                query(
                    collection(db, 'checkIns'),
                    where('managerId', '==', user.uid),
                    orderBy('weekStart', 'desc'),
                    limit(200),
                ),
                (snapshot) => {
                    setCheckIns(snapshot.docs.map((d) => {
                        const data = d.data();
                        return {
                            id: d.id,
                            userId: data.userId,
                            weekStart: data.weekStart,
                            weekEnd: data.weekEnd,
                            workSummary: data.workSummary,
                            achievements: data.achievements,
                            blockers: data.blockers,
                            supportNeeded: data.supportNeeded,
                            linkedGoalIds: data.linkedGoalIds || [],
                            categories: data.categories || [],
                            createdAt: toIso(data.createdAt),
                            updatedAt: toIso(data.updatedAt),
                        };
                    }));
                    settle('checkIns');
                },
                fail('checkIns'),
            ),
            onSnapshot(
                query(collection(db, 'goals'), where('managerId', '==', user.uid)),
                (snapshot) => {
                    setGoals(snapshot.docs.map((d) => ({
                        id: d.id,
                        userId: d.data().userId,
                        status: d.data().status,
                    })));
                    settle('goals');
                },
                fail('goals'),
            ),
            onSnapshot(
                query(collection(db, 'actionItems'), where('assignedById', '==', user.uid)),
                (snapshot) => {
                    setActionItems(snapshot.docs.map((d) => ({
                        employeeId: d.data().employeeId,
                        status: d.data().status,
                    })));
                    settle('actionItems');
                },
                fail('actionItems'),
            ),
        ];

        return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
    }, [user, isManager]);

    const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

    // Check-ins tagged to this manager by people who still report to them.
    const teamCheckIns: TeamCheckIn[] = useMemo(() => {
        const byId = new Map(members.map((m) => [m.id, m]));
        return checkIns
            .filter((c) => memberIds.has(c.userId))
            .map((c) => ({
                ...c,
                userName: byId.get(c.userId)?.fullName || 'Team member',
                userEmail: byId.get(c.userId)?.email || '',
            }));
    }, [checkIns, members, memberIds]);

    const teamMembers: TeamMember[] = useMemo(() => members.map((m) => ({
        ...m,
        lastCheckIn: teamCheckIns.find((c) => c.userId === m.id),
        pendingActionItems: actionItems.filter(
            (a) => a.employeeId === m.id && (a.status === 'open' || a.status === 'in_progress'),
        ).length,
        goalsAtRisk: goals.filter(
            (g) => g.userId === m.id && (g.status === 'at_risk' || g.status === 'behind'),
        ).length,
    })), [members, teamCheckIns, actionItems, goals]);

    const weekAgo = subDays(new Date(), 7);
    const stats = {
        totalMembers: teamMembers.length,
        membersWithRecentCheckIn: teamMembers.filter(
            (m) => m.lastCheckIn && parseISO(m.lastCheckIn.weekEnd || m.lastCheckIn.weekStart) >= weekAgo,
        ).length,
        totalPendingActionItems: teamMembers.reduce((sum, m) => sum + m.pendingActionItems, 0),
        totalGoalsAtRisk: teamMembers.reduce((sum, m) => sum + m.goalsAtRisk, 0),
    };

    return { teamMembers, teamCheckIns, loading, error, stats };
}
