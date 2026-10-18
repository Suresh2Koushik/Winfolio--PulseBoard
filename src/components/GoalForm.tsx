import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Loader2 } from "lucide-react";
import { Goal, GoalPriority, GoalStatus, GOAL_PRIORITY_OPTIONS, GOAL_STATUS_OPTIONS } from "@/types";

interface GoalFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: Omit<Goal, 'id' | 'userId' | 'linkedCheckInIds' | 'createdAt' | 'updatedAt'>) => Promise<void>;
    editGoal?: Goal | null;
}

const priorityLabels: Record<GoalPriority, string> = {
    low: '🟢 Low',
    medium: '🟡 Medium',
    high: '🟠 High',
    critical: '🔴 Critical',
};

const statusLabels: Record<GoalStatus, string> = {
    on_track: '✅ On Track',
    at_risk: '⚠️ At Risk',
    behind: '🔴 Behind',
    completed: '🎉 Completed',
};

export function GoalForm({ open, onOpenChange, onSave, editGoal }: GoalFormProps) {
    const [loading, setLoading] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [priority, setPriority] = useState<GoalPriority>("medium");
    const [status, setStatus] = useState<GoalStatus>("on_track");
    const [progress, setProgress] = useState(0);
    const [startDate, setStartDate] = useState<Date>(new Date());
    const [endDate, setEndDate] = useState<Date>(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));

    useEffect(() => {
        if (editGoal) {
            setTitle(editGoal.title);
            setDescription(editGoal.description || "");
            setPriority(editGoal.priority);
            setStatus(editGoal.status);
            setProgress(editGoal.progress);
            setStartDate(new Date(editGoal.startDate));
            setEndDate(new Date(editGoal.endDate));
        } else {
            resetForm();
        }
    }, [editGoal, open]);

    const resetForm = () => {
        setTitle("");
        setDescription("");
        setPriority("medium");
        setStatus("on_track");
        setProgress(0);
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) return;

        setLoading(true);
        try {
            await onSave({
                title,
                description: description || undefined,
                priority,
                status,
                progress,
                startDate: format(startDate, 'yyyy-MM-dd'),
                endDate: format(endDate, 'yyyy-MM-dd'),
            });
            resetForm();
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        {editGoal ? 'Edit Goal' : 'Create Goal'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div className="space-y-2">
                        <Label htmlFor="title">Goal Title *</Label>
                        <Input
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="What do you want to achieve?"
                            required
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add more details about this goal..."
                            className="min-h-[80px] resize-none"
                        />
                    </div>

                    {/* Priority & Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={priority} onValueChange={(v) => setPriority(v as GoalPriority)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GOAL_PRIORITY_OPTIONS.map((p) => (
                                        <SelectItem key={p} value={p}>
                                            {priorityLabels[p]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Status</Label>
                            <Select value={status} onValueChange={(v) => setStatus(v as GoalStatus)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {GOAL_STATUS_OPTIONS.map((s) => (
                                        <SelectItem key={s} value={s}>
                                            {statusLabels[s]}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Start Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(startDate, 'MMM d, yyyy')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate}
                                        onSelect={(date) => date && setStartDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        <div className="space-y-2">
                            <Label>End Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {format(endDate, 'MMM d, yyyy')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate}
                                        onSelect={(date) => date && setEndDate(date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Progress */}
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <Label>Progress</Label>
                            <span className="text-sm text-muted-foreground">{progress}%</span>
                        </div>
                        <Input
                            type="range"
                            min="0"
                            max="100"
                            value={progress}
                            onChange={(e) => setProgress(Number(e.target.value))}
                            className="w-full"
                        />
                    </div>

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
                        <Button type="submit" disabled={loading || !title.trim()} className="flex-1">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                editGoal ? 'Update Goal' : 'Create Goal'
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
