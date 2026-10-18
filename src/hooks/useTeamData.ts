import { useState, useEffect } from 'react';
import {
    collection,
    query,
    where,
    getDocs,
    orderBy
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMember, CheckIn, Goal } from '@/types';

export function useTeamData() {
    const { user, userRole } = useAuth();
    const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || userRole === 'employee') {
            setTeamMembers([]);
            setLoading(false);
            return;
        }

        const fetchTeamData = async () => {
            try {
                // Get users managed by current user
                const usersQuery = query(
                    collection(db, 'users'),
                    where('managerId', '==', user.uid)
                );
                const usersSnapshot = await getDocs(usersQuery);

                const members: TeamMember[] = await Promise.all(
                    usersSnapshot.docs.map(async (userDoc) => {
                        const userData = userDoc.data();
                        const memberId = userDoc.id;

                        // Get latest check-in
                        const checkInsQuery = query(
                            collection(db, 'checkIns'),
                            where('userId', '==', memberId),
                            orderBy('weekStart', 'desc')
                        );
                        const checkInsSnapshot = await getDocs(checkInsQuery);
                        const lastCheckIn = checkInsSnapshot.docs[0]?.data() as CheckIn | undefined;

                        // Get pending action items count
                        const actionItemsQuery = query(
                            collection(db, 'actionItems'),
                            where('employeeId', '==', memberId),
                            where('status', '==', 'open')
                        );
                        const actionItemsSnapshot = await getDocs(actionItemsQuery);

                        // Get goals at risk count
                        const goalsQuery = query(
                            collection(db, 'goals'),
                            where('userId', '==', memberId),
                            where('status', '==', 'at_risk')
                        );
                        const goalsSnapshot = await getDocs(goalsQuery);

                        return {
                            id: memberId,
                            email: userData.email,
                            fullName: userData.fullName,
                            avatarUrl: userData.avatarUrl,
                            team: userData.team,
                            lastCheckIn: lastCheckIn ? {
                                ...lastCheckIn,
                                id: checkInsSnapshot.docs[0].id,
                                createdAt: lastCheckIn.createdAt || new Date().toISOString(),
                                updatedAt: lastCheckIn.updatedAt || new Date().toISOString(),
                            } : undefined,
                            pendingActionItems: actionItemsSnapshot.size,
                            goalsAtRisk: goalsSnapshot.size,
                        };
                    })
                );

                setTeamMembers(members);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching team data:', error);
                setLoading(false);
            }
        };

        fetchTeamData();
    }, [user, userRole]);

    // Team stats
    const stats = {
        totalMembers: teamMembers.length,
        membersWithRecentCheckIn: teamMembers.filter(m => {
            if (!m.lastCheckIn) return false;
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return new Date(m.lastCheckIn.weekStart) > weekAgo;
        }).length,
        totalPendingActionItems: teamMembers.reduce((sum, m) => sum + m.pendingActionItems, 0),
        totalGoalsAtRisk: teamMembers.reduce((sum, m) => sum + m.goalsAtRisk, 0),
    };

    return { teamMembers, loading, stats };
}
