import { useState } from "react";
import {
    Users,
    Calendar,
    AlertTriangle,
    Target,
    MessageSquare,
    TrendingUp,
    Loader2,
    ChevronRight,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { UserMenu } from "@/components/UserMenu";
import { useTeamData } from "@/hooks/useTeamData";
import { useTeamCheckIns } from "@/hooks/useCheckIns";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

export default function ManagerDashboard() {
    const { userRole } = useAuth();
    const navigate = useNavigate();
    const { teamMembers, loading: loadingTeam, stats } = useTeamData();
    const { checkIns: teamCheckIns, loading: loadingCheckIns } = useTeamCheckIns();

    // Restrict to managers/admins
    if (userRole === 'employee') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <AlertTriangle className="h-12 w-12 mx-auto text-warning mb-4" />
                        <h2 className="text-xl font-semibold mb-2">Access Restricted</h2>
                        <p className="text-muted-foreground mb-4">
                            This dashboard is only available to managers and admins.
                        </p>
                        <Button onClick={() => navigate('/dashboard')}>
                            Go to Dashboard
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const loading = loadingTeam || loadingCheckIns;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    const checkInCompletionRate = stats.totalMembers > 0
        ? Math.round((stats.membersWithRecentCheckIn / stats.totalMembers) * 100)
        : 0;

    // Recent blockers from team check-ins
    const recentBlockers = teamCheckIns
        .filter(c => c.blockers && c.blockers.trim().length > 0)
        .slice(0, 5);

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
            <div className="container mx-auto p-6 max-w-7xl">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Manager Dashboard
                        </h1>
                        <p className="text-muted-foreground">
                            Monitor your team's progress and provide support
                        </p>
                    </div>
                    <UserMenu />
                </header>

                {/* Stats Overview */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Team Members
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.totalMembers}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Check-In Rate
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-success">{checkInCompletionRate}%</div>
                            <Progress value={checkInCompletionRate} className="mt-2 h-1.5" />
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Goals at Risk
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-warning">{stats.totalGoalsAtRisk}</div>
                        </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                                <MessageSquare className="h-4 w-4" />
                                Pending Actions
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-info">{stats.totalPendingActionItems}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="team" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="team">Team Overview</TabsTrigger>
                        <TabsTrigger value="checkins">Recent Check-Ins</TabsTrigger>
                        <TabsTrigger value="risks">Blockers & Risks</TabsTrigger>
                    </TabsList>

                    {/* Team Overview */}
                    <TabsContent value="team">
                        <div className="grid gap-4">
                            {teamMembers.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="py-12 text-center">
                                        <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No Team Members</h3>
                                        <p className="text-muted-foreground">
                                            Team members will appear here once they're assigned to you as their manager.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                teamMembers.map((member) => (
                                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback>
                                                            {member.fullName?.slice(0, 2).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <h3 className="font-semibold">{member.fullName}</h3>
                                                        <p className="text-sm text-muted-foreground">{member.email}</p>
                                                        {member.team && (
                                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                                {member.team}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    {/* Last Check-in Status */}
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">Last Check-In</p>
                                                        {member.lastCheckIn ? (
                                                            <p className="text-sm font-medium">
                                                                {format(new Date(member.lastCheckIn.weekStart), 'MMM d')}
                                                            </p>
                                                        ) : (
                                                            <p className="text-sm text-warning">None yet</p>
                                                        )}
                                                    </div>

                                                    {/* Risk Indicators */}
                                                    <div className="flex items-center gap-2">
                                                        {member.goalsAtRisk > 0 && (
                                                            <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                                                                <AlertTriangle className="h-3 w-3 mr-1" />
                                                                {member.goalsAtRisk} at risk
                                                            </Badge>
                                                        )}
                                                        {member.pendingActionItems > 0 && (
                                                            <Badge variant="outline" className="bg-info/10 text-info border-info/20">
                                                                <Clock className="h-3 w-3 mr-1" />
                                                                {member.pendingActionItems} pending
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Recent Check-Ins */}
                    <TabsContent value="checkins">
                        <div className="space-y-4">
                            {teamCheckIns.length === 0 ? (
                                <Card className="border-dashed">
                                    <CardContent className="py-12 text-center">
                                        <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No Check-Ins Yet</h3>
                                        <p className="text-muted-foreground">
                                            Team check-ins will appear here once submitted.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                teamCheckIns.slice(0, 10).map((checkIn) => (
                                    <Card key={checkIn.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>
                                                            {checkIn.userName?.slice(0, 2).toUpperCase() || 'U'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <CardTitle className="text-base">{checkIn.userName}</CardTitle>
                                                        <CardDescription>
                                                            Week of {format(new Date(checkIn.weekStart), 'MMM d, yyyy')}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                {checkIn.blockers && (
                                                    <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                                        Has Blockers
                                                    </Badge>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground line-clamp-2">
                                                {checkIn.workSummary}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>

                    {/* Blockers & Risks */}
                    <TabsContent value="risks">
                        <div className="space-y-4">
                            {recentBlockers.length === 0 ? (
                                <Card className="border-dashed border-success/50 bg-success/5">
                                    <CardContent className="py-12 text-center">
                                        <TrendingUp className="h-12 w-12 mx-auto text-success mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No Active Blockers</h3>
                                        <p className="text-muted-foreground">
                                            Your team is running smoothly with no reported blockers.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                recentBlockers.map((checkIn) => (
                                    <Card key={checkIn.id} className="border-l-4 border-l-destructive">
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarFallback>
                                                        {checkIn.userName?.slice(0, 2).toUpperCase() || 'U'}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-base">{checkIn.userName}</CardTitle>
                                                    <CardDescription>
                                                        {format(new Date(checkIn.weekStart), 'MMM d, yyyy')}
                                                    </CardDescription>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                                                <p className="text-sm font-medium text-destructive mb-1">Blocker</p>
                                                <p className="text-sm">{checkIn.blockers}</p>
                                            </div>
                                            {checkIn.supportNeeded && (
                                                <div className="mt-3 p-3 rounded-lg bg-info/10 border border-info/20">
                                                    <p className="text-sm font-medium text-info mb-1">Support Needed</p>
                                                    <p className="text-sm">{checkIn.supportNeeded}</p>
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
