import { format, parseISO } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Calendar,
    Trophy,
    AlertTriangle,
    HelpCircle,
    Edit,
    Trash2,
    Target,
    Clock
} from "lucide-react";
import { CheckIn, Goal } from "@/types";
import { cn } from "@/lib/utils";

interface CheckInCardProps {
    checkIn: CheckIn;
    goals?: Goal[];
    onEdit?: (checkIn: CheckIn) => void;
    onDelete?: (id: string) => void;
    showActions?: boolean;
    expanded?: boolean;
}

export function CheckInCard({
    checkIn,
    goals = [],
    onEdit,
    onDelete,
    showActions = true,
    expanded = false
}: CheckInCardProps) {
    const linkedGoals = goals.filter(g => checkIn.linkedGoalIds?.includes(g.id));
    const hasBlockers = checkIn.blockers && checkIn.blockers.trim().length > 0;

    return (
        <Card className={cn(
            "transition-all duration-300 hover:shadow-lg border-l-4",
            hasBlockers ? "border-l-destructive" : "border-l-primary"
        )}>
            <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Calendar className="h-4 w-4" />
                            <span>
                                {format(parseISO(checkIn.weekStart), 'MMM d')} - {format(parseISO(checkIn.weekEnd), 'MMM d, yyyy')}
                            </span>
                        </div>
                        <CardTitle className="text-lg font-semibold">
                            Weekly Reflection
                        </CardTitle>
                    </div>

                    {showActions && (
                        <div className="flex gap-1">
                            {onEdit && (
                                <Button variant="ghost" size="icon" onClick={() => onEdit(checkIn)}>
                                    <Edit className="h-4 w-4" />
                                </Button>
                            )}
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => onDelete(checkIn.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Work Summary */}
                <div>
                    <p className={cn(
                        "text-sm text-foreground",
                        !expanded && "line-clamp-3"
                    )}>
                        {checkIn.workSummary}
                    </p>
                </div>

                {/* Achievements */}
                {checkIn.achievements && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                        <Trophy className="h-4 w-4 text-success mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-success mb-1">What I learned</p>
                            <p className={cn(
                                "text-sm",
                                !expanded && "line-clamp-2"
                            )}>
                                {checkIn.achievements}
                            </p>
                        </div>
                    </div>
                )}

                {/* Blockers */}
                {hasBlockers && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                        <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-destructive mb-1">What was challenging</p>
                            <p className={cn(
                                "text-sm",
                                !expanded && "line-clamp-2"
                            )}>
                                {checkIn.blockers}
                            </p>
                        </div>
                    </div>
                )}

                {/* Support Needed */}
                {checkIn.supportNeeded && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 border border-info/20">
                        <HelpCircle className="h-4 w-4 text-info mt-0.5" />
                        <div>
                            <p className="text-xs font-medium text-info mb-1">Focus next week</p>
                            <p className={cn(
                                "text-sm",
                                !expanded && "line-clamp-2"
                            )}>
                                {checkIn.supportNeeded}
                            </p>
                        </div>
                    </div>
                )}

                {/* Categories */}
                {checkIn.categories && checkIn.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {checkIn.categories.map((category) => (
                            <Badge key={category} variant="secondary" className="text-xs">
                                {category}
                            </Badge>
                        ))}
                    </div>
                )}

                {/* Linked Goals */}
                {linkedGoals.length > 0 && (
                    <div className="border-t pt-3 mt-3">
                        <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            Linked Goals
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                            {linkedGoals.map((goal) => (
                                <Badge key={goal.id} variant="outline" className="text-xs">
                                    {goal.title} ({goal.progress}%)
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}

                {/* Timestamp */}
                <div className="flex items-center gap-1 text-xs text-muted-foreground pt-2">
                    <Clock className="h-3 w-3" />
                    Submitted {format(new Date(checkIn.createdAt), 'MMM d, yyyy h:mm a')}
                </div>
            </CardContent>
        </Card>
    );
}
