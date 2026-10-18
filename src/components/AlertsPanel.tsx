import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Bell,
    Calendar,
    Target,
    AlertTriangle,
    Clock,
    CheckCircle2,
    X,
    Brain,
    Zap,
    Info
} from "lucide-react";
import { format, differenceInDays, startOfWeek, isAfter } from "date-fns";
import { CheckIn, Goal, ActionItem, RiskLevel } from "@/types";
import { cn } from "@/lib/utils";

interface AlertsPanelProps {
    checkIns: CheckIn[];
    goals: Goal[];
    actionItems: ActionItem[];
    onDismiss?: (type: string, id?: string) => void;
}

interface Alert {
    id: string;
    type: 'check_in_due' | 'action_item_due' | 'goal_deadline' | 'goal_at_risk' | 'workload_risk';
    title: string;
    message: string;
    level: RiskLevel;
    dueDate?: string;
    entityId?: string;
}

export function AlertsPanel({ checkIns, goals, actionItems, onDismiss }: AlertsPanelProps) {
    const alerts = generateAlerts(checkIns, goals, actionItems);

    if (alerts.length === 0) {
        return (
            <Card className="card-glass border-0 shadow-lg bg-gradient-to-br from-success/5 to-transparent overflow-hidden">
                <CardContent className="py-10 text-center relative">
                    <div className="absolute -top-6 -right-6 h-24 w-24 bg-success/10 rounded-full blur-3xl" />
                    <CheckCircle2 className="h-12 w-12 mx-auto text-success mb-4 animate-bounce-subtle" />
                    <h3 className="text-xl font-bold text-success mb-2">Systems Nominal</h3>
                    <p className="text-sm text-muted-foreground mx-auto max-w-[250px]">
                        You're all caught up! No critical alerts or pending actions require your attention.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const highPriority = alerts.filter(a => a.level === 'high');
    const mediumPriority = alerts.filter(a => a.level === 'medium');

    return (
        <Card className="card-glass border-0 shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-500">
            <CardHeader className="pb-4 px-6 pt-6">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-primary/10 text-primary shadow-inner">
                        <Bell className="h-5 w-5" />
                    </div>
                    <div>
                        <CardTitle className="text-lg font-bold">Action Center</CardTitle>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Priority Notifications</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-0 font-black px-2.5">
                        {alerts.length}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-3">
                {alerts.map((alert) => (
                    <AlertItem key={alert.id} alert={alert} onDismiss={onDismiss} />
                ))}
                {alerts.length > 3 && (
                    <p className="text-[10px] text-center text-muted-foreground font-bold uppercase tracking-tighter pt-2">
                        View all alerts in your dashboard summary
                    </p>
                )}
            </CardContent>
        </Card>
    );
}

function AlertItem({
    alert,
    onDismiss
}: {
    alert: Alert;
    onDismiss?: (type: string, id?: string) => void;
}) {
    const levelConfig: Record<RiskLevel, { bg: string; text: string; icon: string; shadow: string }> = {
        high: {
            bg: 'bg-destructive/5 hover:bg-destructive/10',
            text: 'text-destructive',
            icon: 'bg-destructive/20',
            shadow: 'border-destructive/10 shadow-destructive/5'
        },
        medium: {
            bg: 'bg-warning/5 hover:bg-warning/10',
            text: 'text-warning',
            icon: 'bg-warning/20',
            shadow: 'border-warning/10 shadow-warning/5'
        },
        low: {
            bg: 'bg-info/5 hover:bg-info/10',
            text: 'text-info',
            icon: 'bg-info/20',
            shadow: 'border-info/10 shadow-info/5'
        },
    };

    const typeIcons: Record<string, any> = {
        check_in_due: Calendar,
        action_item_due: Clock,
        goal_deadline: Target,
        goal_at_risk: AlertTriangle,
        workload_risk: Brain,
    };

    const config = levelConfig[alert.level];
    const Icon = typeIcons[alert.type] || Info;

    return (
        <div className={cn(
            "flex items-start gap-4 p-4 rounded-2xl border-l-4 transition-all duration-300 group relative overflow-hidden shadow-sm",
            config.bg,
            config.shadow,
            alert.level === 'high' ? "border-l-destructive" : "border-l-warning"
        )}>
            <div className={cn("p-2 rounded-xl shrink-0 transition-transform group-hover:scale-110", config.icon)}>
                <Icon className={cn("h-4 w-4", config.text)} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                    <p className="font-bold text-sm leading-tight">{alert.title}</p>
                    {alert.level === 'high' && <Zap className="h-3 w-3 text-destructive animate-pulse" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{alert.message}</p>
                {alert.dueDate && (
                    <div className="flex items-center gap-1.5 mt-2">
                        <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                        <span className="text-[10px] font-bold uppercase tracking-tight text-muted-foreground">
                            Deadline: {format(new Date(alert.dueDate), 'MMM d')}
                        </span>
                    </div>
                )}
            </div>
            {onDismiss && (
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20"
                    onClick={() => onDismiss(alert.type, alert.entityId)}
                >
                    <X className="h-3 w-3" />
                </Button>
            )}
        </div>
    );
}

function generateAlerts(checkIns: CheckIn[], goals: Goal[], actionItems: ActionItem[]): Alert[] {
    const alerts: Alert[] = [];
    const today = new Date();

    // 1. Weekly Check-In
    const currentWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    const hasCurrentWeekCheckIn = checkIns.some(c => new Date(c.weekStart) >= currentWeekStart);

    if (!hasCurrentWeekCheckIn && today.getDay() >= 4) {
        alerts.push({
            id: 'check-in-due',
            type: 'check_in_due',
            title: 'Check-In Window Open',
            message: 'Your weekly reflection is due by EOD Friday.',
            level: today.getDay() === 5 ? 'high' : 'medium',
        });
    }

    // 2. Goals
    goals.forEach(goal => {
        if (goal.status === 'completed') return;
        const daysUntilDeadline = differenceInDays(new Date(goal.endDate), today);

        if (daysUntilDeadline < 0) {
            alerts.push({
                id: `goal-overdue-${goal.id}`,
                type: 'goal_deadline',
                title: 'Critical: Goal Overdue',
                message: `"${goal.title}" has missed its target completion date.`,
                level: 'high',
                dueDate: goal.endDate,
                entityId: goal.id,
            });
        } else if (daysUntilDeadline <= 3) {
            alerts.push({
                id: `goal-deadline-${goal.id}`,
                type: 'goal_deadline',
                title: 'Deadline Approaching',
                message: `"${goal.title}" target is in ${daysUntilDeadline} days.`,
                level: 'medium',
                dueDate: goal.endDate,
                entityId: goal.id,
            });
        }

        if (goal.status === 'at_risk' || goal.status === 'behind') {
            alerts.push({
                id: `goal-risk-${goal.id}`,
                type: 'goal_at_risk',
                title: 'Performance Variance',
                message: `"${goal.title}" is currently flagged as ${goal.status}.`,
                level: goal.status === 'behind' ? 'high' : 'medium',
                entityId: goal.id,
            });
        }
    });

    // 3. Action Items
    actionItems.forEach(item => {
        if (item.status === 'completed' || !item.dueDate) return;
        const daysUntilDue = differenceInDays(new Date(item.dueDate), today);

        if (daysUntilDue < 0) {
            alerts.push({
                id: `action-overdue-${item.id}`,
                type: 'action_item_due',
                title: 'Action Overdue',
                message: `Follow-up needed: "${item.title}"`,
                level: 'high',
                dueDate: item.dueDate,
                entityId: item.id,
            });
        } else if (daysUntilDue <= 2) {
            alerts.push({
                id: `action-due-${item.id}`,
                type: 'action_item_due',
                title: 'Action Item Pending',
                message: `Complete task: "${item.title}"`,
                level: 'medium',
                dueDate: item.dueDate,
                entityId: item.id,
            });
        }
    });

    return alerts.sort((a, b) => {
        const priority = { high: 0, medium: 1, low: 2 };
        return priority[a.level] - priority[b.level];
    });
}

export function RiskIndicator({ level, label }: { level: RiskLevel; label?: string }) {
    const config: Record<RiskLevel, { bg: string; text: string; dot: string; border: string }> = {
        low: { bg: 'bg-success/5', text: 'text-success', dot: 'bg-success', border: 'border-success/20' },
        medium: { bg: 'bg-warning/5', text: 'text-warning', dot: 'bg-warning', border: 'border-warning/20' },
        high: { bg: 'bg-destructive/5', text: 'text-destructive', dot: 'bg-destructive', border: 'border-destructive/20' },
    };

    const c = config[level];

    return (
        <Badge variant="outline" className={cn("gap-1.5 px-2 py-0.5 border-0 font-bold", c.bg, c.text, c.border)}>
            <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", c.dot)} />
            {label || `${level.charAt(0).toUpperCase() + level.slice(1)} Risk`}
        </Badge>
    );
}
