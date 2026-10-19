import { useState, useEffect } from "react";
import { format, startOfWeek, endOfWeek, addDays, parseISO } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { CheckIn, Goal, ActivityCategory } from "@/types";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { useUserData } from "@/hooks/useUserData";
import { useGoals } from "@/hooks/useGoals";

interface CheckInFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    editCheckIn?: CheckIn | null;
}

export function CheckInForm({ open, onOpenChange, onSave, editCheckIn }: CheckInFormProps) {
    const { goals } = useGoals();
    const { categories } = useUserData();
    const categoryChoices = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const [loading, setLoading] = useState(false);
    const [weekStart, setWeekStart] = useState<Date>(startOfWeek(new Date(), { weekStartsOn: 1 }));
    const [workSummary, setWorkSummary] = useState("");
    const [achievements, setAchievements] = useState("");
    const [blockers, setBlockers] = useState("");
    const [supportNeeded, setSupportNeeded] = useState("");
    const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<ActivityCategory[]>([]);

    useEffect(() => {
        if (editCheckIn) {
            setWeekStart(parseISO(editCheckIn.weekStart));
            setWorkSummary(editCheckIn.workSummary);
            setAchievements(editCheckIn.achievements || "");
            setBlockers(editCheckIn.blockers || "");
            setSupportNeeded(editCheckIn.supportNeeded || "");
            setSelectedGoals(editCheckIn.linkedGoalIds || []);
            setSelectedCategories(editCheckIn.categories || []);
        } else {
            resetForm();
        }
    }, [editCheckIn, open]);

    const resetForm = () => {
        setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));
        setWorkSummary("");
        setAchievements("");
        setBlockers("");
        setSupportNeeded("");
        setSelectedGoals([]);
        setSelectedCategories([]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!workSummary.trim()) return;

        setLoading(true);
        try {
            await onSave({
                weekStart: format(weekStart, 'yyyy-MM-dd'),
                weekEnd: format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'yyyy-MM-dd'),
                workSummary,
                achievements: achievements || undefined,
                blockers: blockers || undefined,
                supportNeeded: supportNeeded || undefined,
                linkedGoalIds: selectedGoals,
                categories: selectedCategories,
            });
            resetForm();
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    const toggleGoal = (goalId: string) => {
        setSelectedGoals(prev =>
            prev.includes(goalId)
                ? prev.filter(id => id !== goalId)
                : [...prev, goalId]
        );
    };

    const toggleCategory = (category: ActivityCategory) => {
        setSelectedCategories(prev =>
            prev.includes(category)
                ? prev.filter(c => c !== category)
                : [...prev, category]
        );
    };

    const activeGoals = goals.filter(g => g.status !== 'completed');

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {editCheckIn ? 'Edit Reflection' : 'Weekly Reflection'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Week Selection */}
                    <div className="space-y-2">
                        <Label>Week</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button variant="outline" className="w-full justify-start text-left">
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {format(weekStart, 'MMM d')} - {format(endOfWeek(weekStart, { weekStartsOn: 1 }), 'MMM d, yyyy')}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={weekStart}
                                    onSelect={(date) => date && setWeekStart(startOfWeek(date, { weekStartsOn: 1 }))}
                                    initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    </div>

                    {/* Work Summary */}
                    <div className="space-y-2">
                        <Label htmlFor="workSummary">What went well this week? *</Label>
                        <Textarea
                            id="workSummary"
                            value={workSummary}
                            onChange={(e) => setWorkSummary(e.target.value)}
                            placeholder="The work you're proud of, progress you made, problems you solved..."
                            className="min-h-[100px] resize-none"
                            required
                        />
                    </div>

                    {/* Blockers */}
                    <div className="space-y-2">
                        <Label htmlFor="blockers">What was challenging?</Label>
                        <Textarea
                            id="blockers"
                            value={blockers}
                            onChange={(e) => setBlockers(e.target.value)}
                            placeholder="What obstacles are you facing?"
                            className="min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Achievements */}
                    <div className="space-y-2">
                        <Label htmlFor="achievements">What did you learn?</Label>
                        <Textarea
                            id="achievements"
                            value={achievements}
                            onChange={(e) => setAchievements(e.target.value)}
                            placeholder="A skill, a lesson, something you'd do differently..."
                            className="min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Support Needed */}
                    <div className="space-y-2">
                        <Label htmlFor="supportNeeded">What will you focus on next week?</Label>
                        <Textarea
                            id="supportNeeded"
                            value={supportNeeded}
                            onChange={(e) => setSupportNeeded(e.target.value)}
                            placeholder="One or two priorities for next week..."
                            className="min-h-[60px] resize-none"
                        />
                    </div>

                    {/* Categories */}
                    <div className="space-y-2">
                        <Label>Work Categories</Label>
                        <div className="flex flex-wrap gap-2">
                            {categoryChoices.map((cat) => (
                                <Badge
                                    key={cat.name}
                                    variant={selectedCategories.includes(cat.name) ? "default" : "outline"}
                                    className="cursor-pointer transition-all hover:scale-105"
                                    onClick={() => toggleCategory(cat.name)}
                                >
                                    {cat.emoji} {cat.name}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Link to Goals */}
                    {activeGoals.length > 0 && (
                        <div className="space-y-2">
                            <Label>Link to Goals</Label>
                            <div className="space-y-2 max-h-[150px] overflow-y-auto border rounded-lg p-3">
                                {activeGoals.map((goal) => (
                                    <div key={goal.id} className="flex items-center space-x-2">
                                        <Checkbox
                                            id={goal.id}
                                            checked={selectedGoals.includes(goal.id)}
                                            onCheckedChange={() => toggleGoal(goal.id)}
                                        />
                                        <label
                                            htmlFor={goal.id}
                                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                                        >
                                            {goal.title}
                                            <span className="text-muted-foreground ml-2 text-xs">
                                                ({goal.progress}% complete)
                                            </span>
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !workSummary.trim()} className="flex-1">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editCheckIn ? 'Update Reflection' : 'Save Reflection'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
