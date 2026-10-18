import { useState } from "react";
import {
    Users,
    Calendar,
    AlertTriangle,
    Target,
    MessageSquare,
    TrendingUp,
    Loader2,
    Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { FeedbackForm, FeedbackCard } from "@/components/FeedbackComponents";
import { useTeamData } from "@/hooks/useTeamData";
import { useFeedback } from "@/hooks/useFeedback";
import { useAuditLog } from "@/hooks/useAuditLog";
import { format, parseISO } from "date-fns";

interface FeedbackTarget {
    employeeId: string;
    employeeName: string;
    checkInId?: string;
}

export default function ManagerDashboard() {
    const { teamMembers, teamCheckIns, loading: loadingTeam, error, stats } = useTeamData();
    const { givenFeedback, addFeedback, loading: loadingFeedback } = useFeedback();
    const { logAction } = useAuditLog();
    const [feedbackTarget, setFeedbackTarget] = useState<FeedbackTarget | null>(null);

    const loading = loadingTeam || loadingFeedback;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
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

    const handleSendFeedback = async (data: { content: string; actionItems: { title: string; dueDate?: string }[] }) => {
        if (!feedbackTarget) return;
        const id = await addFeedback({ ...feedbackTarget, ...data });
        if (id) {
            logAction('feedback_given', 'feedback', id, {
                employeeId: feedbackTarget.employeeId,
                actionItems: data.actionItems.length,
            });
        } else {
            // Keep the dialog open so the manager doesn't lose what they wrote.
            throw new Error('Feedback not sent');
        }
    };

    const initials = (name?: string) => name?.slice(0, 2).toUpperCase() || 'U';

    return (
        <div className="bg-gradient-to-br from-background via-background to-secondary/20">
            <div className="p-4 md:p-6 max-w-7xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Manager Dashboard
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Monitor your team's progress and provide support
                    </p>
                </header>

                {error && (
                    <Card className="mb-6 border-warning/40 bg-warning/5">
                        <CardContent className="py-3 text-sm text-warning flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4" />
                            {error} Try refreshing the page.
                        </CardContent>
                    </Card>
                )}

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
                                Checked In (7 days)
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
                                Open Action Items
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-info">{stats.totalPendingActionItems}</div>
                        </CardContent>
                    </Card>
                </div>

                <Tabs defaultValue="team" className="space-y-6">
                    <TabsList className="flex-wrap h-auto">
                        <TabsTrigger value="team">Team Overview</TabsTrigger>
                        <TabsTrigger value="checkins">Recent Check-Ins</TabsTrigger>
                        <TabsTrigger value="risks">Blockers & Risks</TabsTrigger>
                        <TabsTrigger value="feedback">Feedback Sent ({givenFeedback.length})</TabsTrigger>
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
                                            Team members appear here once they choose you as their manager during onboarding or in "Edit profile".
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                teamMembers.map((member) => (
                                    <Card key={member.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="py-4">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4 min-w-0">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={member.avatarUrl} />
                                                        <AvatarFallback>{initials(member.fullName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <h3 className="font-semibold truncate">{member.fullName}</h3>
                                                        <p className="text-sm text-muted-foreground truncate">{member.email}</p>
                                                        {member.team && (
                                                            <Badge variant="secondary" className="mt-1 text-xs">
                                                                {member.team}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap items-center gap-4">
                                                    {/* Last Check-in Status */}
                                                    <div className="text-right">
                                                        <p className="text-xs text-muted-foreground">Last Check-In</p>
                                                        {member.lastCheckIn ? (
                                                            <p className="text-sm font-medium">
                                                                {format(parseISO(member.lastCheckIn.weekStart), 'MMM d')}
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

                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-2"
                                                        onClick={() => setFeedbackTarget({ employeeId: member.id, employeeName: member.fullName })}
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        Give feedback
                                                    </Button>
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
                                teamCheckIns.slice(0, 20).map((checkIn) => (
                                    <Card key={checkIn.id}>
                                        <CardHeader className="pb-2">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarFallback>{initials(checkIn.userName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-base truncate">{checkIn.userName}</CardTitle>
                                                        <CardDescription>
                                                            Week of {format(parseISO(checkIn.weekStart), 'MMM d, yyyy')}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0">
                                                    {checkIn.blockers && (
                                                        <Badge variant="outline" className="bg-destructive/10 text-destructive">
                                                            Has Blockers
                                                        </Badge>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="gap-1"
                                                        onClick={() => setFeedbackTarget({
                                                            employeeId: checkIn.userId,
                                                            employeeName: checkIn.userName,
                                                            checkInId: checkIn.id,
                                                        })}
                                                    >
                                                        <MessageSquare className="h-4 w-4" />
                                                        <span className="hidden sm:inline">Respond</span>
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="space-y-2">
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                                {checkIn.workSummary}
                                            </p>
                                            {checkIn.achievements && (
                                                <p className="text-sm"><span className="font-medium">Wins:</span> {checkIn.achievements}</p>
                                            )}
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
                                                    <AvatarFallback>{initials(checkIn.userName)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <CardTitle className="text-base">{checkIn.userName}</CardTitle>
                                                    <CardDescription>
                                                        {format(parseISO(checkIn.weekStart), 'MMM d, yyyy')}
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

                    {/* Feedback sent */}
                    <TabsContent value="feedback">
                        <div className="grid md:grid-cols-2 gap-4">
                            {givenFeedback.length === 0 ? (
                                <Card className="border-dashed md:col-span-2">
                                    <CardContent className="py-12 text-center">
                                        <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No feedback sent yet</h3>
                                        <p className="text-muted-foreground">
                                            Use "Give feedback" on a team member or check-in.
                                        </p>
                                    </CardContent>
                                </Card>
                            ) : (
                                givenFeedback.map((item) => (
                                    <FeedbackCard key={item.id} feedback={item} isEmployee={false} />
                                ))
                            )}
                        </div>
                    </TabsContent>
                </Tabs>

                <FeedbackForm
                    open={feedbackTarget !== null}
                    onOpenChange={(open) => { if (!open) setFeedbackTarget(null); }}
                    onSave={handleSendFeedback}
                    employeeName={feedbackTarget?.employeeName ?? ''}
                    checkInId={feedbackTarget?.checkInId}
                />
            </div>
        </div>
    );
}
