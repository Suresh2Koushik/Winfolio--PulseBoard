import { format, differenceInDays, parseISO } from "date-fns";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
    Target,
    Edit,
    Trash2,
    Calendar,
    Flag,
    TrendingUp,
    AlertTriangle,
    CheckCircle2,
    Clock,
    ChevronRight
} from "lucide-react";
import { Goal, GoalStatus, GoalPriority } from "@/types";
import { cn } from "@/lib/utils";

interface GoalCardProps {
    goal: Goal;
    onEdit?: (goal: Goal) => void;
    onDelete?: (id: string) => void;
    onUpdateProgress?: (id: string, progress: number) => void;
    showActions?: boolean;
    compact?: boolean;
}

const statusConfig: Record<GoalStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    on_track: {
        label: 'On Track',
        color: 'text-success',
        bg: 'bg-success/10',
        icon: TrendingUp
    },
    at_risk: {
        label: 'At Risk',
        color: 'text-warning',
        bg: 'bg-warning/10',
        icon: AlertTriangle
    },
    behind: {
        label: 'Behind',
        color: 'text-destructive',
        bg: 'bg-destructive/10',
        icon: Clock
    },
    completed: {
        label: 'Completed',
        color: 'text-primary',
        bg: 'bg-primary/10',
        icon: CheckCircle2
    },
};

const priorityConfig: Record<GoalPriority, { label: string; color: string; bg: string }> = {
    low: { label: 'Low', color: 'text-muted-foreground', bg: 'bg-muted' },
    medium: { label: 'Medium', color: 'text-blue-600', bg: 'bg-blue-100' },
    high: { label: 'High', color: 'text-orange-600', bg: 'bg-orange-100' },
    critical: { label: 'Critical', color: 'text-red-600', bg: 'bg-red-100' },
};

export function GoalCard({
    goal,
    onEdit,
    onDelete,
    onUpdateProgress,
    showActions = true,
    compact = false
}: GoalCardProps) {
    const daysRemaining = differenceInDays(parseISO(goal.endDate), new Date());
    const isOverdue = daysRemaining < 0 && goal.status !== 'completed';
    const status = statusConfig[goal.status];
    const priority = priorityConfig[goal.priority];

    return (
        <Card className={cn(
            "card-glass border-0 shadow-lg card-hover overflow-hidden group transition-all duration-500",
            goal.status === 'completed' && "bg-secondary/5 border-primary/20"
        )}>
            <div className={cn(
                "absolute top-0 left-0 w-1 h-full transition-colors",
                isOverdue ? "bg-destructive" : status.bg.replace('/10', '')
            )} />

            <CardHeader className="pb-3 px-6 pt-6">
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className={cn(
                            "p-3 rounded-2xl shadow-inner shrink-0 group-hover:scale-110 transition-transform duration-500",
                            status.bg
                        )}>
                            <status.icon className={cn("h-6 w-6", status.color)} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-widest px-2 py-0 border-0", priority.bg, priority.color)}>
                                    {priority.label}
                                </Badge>
                                {isOverdue && (
                                    <Badge variant="destructive" className="text-[10px] font-bold uppercase tracking-widest px-2 py-0">
                                        Overdue
                                    </Badge>
                                )}
                            </div>
                            <h3 className={cn(
                                "text-xl font-bold truncate leading-tight group-hover:text-primary transition-colors",
                                goal.status === 'completed' && "text-muted-foreground"
                            )}>
                                {goal.title}
                            </h3>
                        </div>
                    </div>

                    {showActions && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-300">
                            {onEdit && (
                                <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-primary/10 hover:text-primary" onClick={() => onEdit(goal)}>
                                    <Edit className="h-4.5 w-4.5" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 rounded-xl text-destructive hover:bg-destructive/10"
                                    onClick={() => onDelete(goal.id)}
                                >
                                    <Trash2 className="h-4.5 w-4.5" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="px-6 pb-6 space-y-5">
                {!compact && goal.description && (
                    <p className="text-sm text-muted-foreground leading-relaxed">
                        {goal.description}
                    </p>
                )}

                <div className="space-y-3">
                    <div className="flex justify-between items-end">
                        <div className="space-y-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Cumulative Progress</p>
                            <p className="text-2xl font-black">{goal.progress}%</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Timeline</p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                                <Calendar className="h-3.5 w-3.5 text-primary" />
                                {format(parseISO(goal.endDate), 'MMM d, yyyy')}
                            </div>
                        </div>
                    </div>
                    <div className="relative h-3 w-full bg-muted/30 rounded-full overflow-hidden shadow-inner">
                        <div
                            className={cn(
                                "absolute top-0 left-0 h-full transition-all duration-1000 ease-out flex items-center justify-end pr-1",
                                goal.progress === 100 ? "bg-gradient-to-r from-success to-primary" :
                                    isOverdue ? "bg-destructive" :
                                        "bg-gradient-to-r from-primary/80 to-primary"
                            )}
                            style={{ width: `${goal.progress}%` }}
                        >
                            <div className="h-1 w-1 rounded-full bg-white/40 blur-[1px]" />
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-muted/50">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Status</span>
                            <span className={cn("text-xs font-bold capitalize", status.color)}>{status.label.replace('_', ' ')}</span>
                        </div>
                        <div className="flex flex-col border-l pl-4 border-muted/50 text-right">
                            <span className="text-[9px] uppercase font-bold text-muted-foreground">Pulse</span>
                            <span className={cn(
                                "text-xs font-bold",
                                isOverdue ? "text-destructive" : daysRemaining <= 7 ? "text-warning" : "text-foreground"
                            )}>
                                {goal.status === 'completed'
                                    ? 'Goal Secured'
                                    : isOverdue
                                        ? `${Math.abs(daysRemaining)}d behind`
                                        : `${daysRemaining}d remaining`
                                }
                            </span>
                        </div>
                    </div>

                    {onUpdateProgress && goal.status !== 'completed' && (
                        <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                            {[25, 50, 75, 100].map((value) => (
                                <Button
                                    key={value}
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "h-8 px-3 text-[10px] font-black rounded-lg transition-all",
                                        goal.progress === value ? "bg-primary text-primary-foreground border-primary" : "hover:border-primary hover:text-primary"
                                    )}
                                    disabled={goal.progress >= value}
                                    onClick={() => onUpdateProgress(goal.id, value)}
                                >
                                    {value}%
                                </Button>
                            ))}
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
