import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    MessageSquare,
    Check,
    Plus,
    Calendar,
    Loader2,
    CheckCircle2
} from "lucide-react";
import { format } from "date-fns";
import { Feedback, ActionItem } from "@/types";
import { cn } from "@/lib/utils";

interface FeedbackFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (data: {
        content: string;
        actionItems: { title: string; dueDate?: string }[]
    }) => Promise<void>;
    employeeName: string;
    checkInId?: string;
}

export function FeedbackForm({
    open,
    onOpenChange,
    onSave,
    employeeName,
    checkInId
}: FeedbackFormProps) {
    const [loading, setLoading] = useState(false);
    const [content, setContent] = useState("");
    const [actionItems, setActionItems] = useState<{ title: string; dueDate: string }[]>([]);
    const [newActionTitle, setNewActionTitle] = useState("");
    const [newActionDueDate, setNewActionDueDate] = useState("");

    const handleAddActionItem = () => {
        if (!newActionTitle.trim()) return;
        setActionItems([...actionItems, { title: newActionTitle, dueDate: newActionDueDate }]);
        setNewActionTitle("");
        setNewActionDueDate("");
    };

    const handleRemoveActionItem = (index: number) => {
        setActionItems(actionItems.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return;

        setLoading(true);
        try {
            await onSave({ content, actionItems });
            setContent("");
            setActionItems([]);
            onOpenChange(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                        Give Feedback to {employeeName}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="feedback">Feedback *</Label>
                        <Textarea
                            id="feedback"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Share your feedback, recognition, or suggestions..."
                            className="min-h-[120px] resize-none"
                            required
                        />
                    </div>

                    {/* Action Items */}
                    <div className="space-y-3">
                        <Label>Action Items (Optional)</Label>

                        {actionItems.length > 0 && (
                            <div className="space-y-2">
                                {actionItems.map((item, index) => (
                                    <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                                        <Check className="h-4 w-4 text-muted-foreground" />
                                        <span className="flex-1 text-sm">{item.title}</span>
                                        {item.dueDate && (
                                            <Badge variant="outline" className="text-xs">
                                                Due {format(new Date(item.dueDate), 'MMM d')}
                                            </Badge>
                                        )}
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRemoveActionItem(index)}
                                            className="h-6 px-2 text-destructive"
                                        >
                                            Remove
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="flex gap-2">
                            <Input
                                value={newActionTitle}
                                onChange={(e) => setNewActionTitle(e.target.value)}
                                placeholder="Action item title"
                                className="flex-1"
                            />
                            <Input
                                type="date"
                                value={newActionDueDate}
                                onChange={(e) => setNewActionDueDate(e.target.value)}
                                className="w-[140px]"
                            />
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={handleAddActionItem}
                                disabled={!newActionTitle.trim()}
                            >
                                <Plus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={loading || !content.trim()} className="flex-1">
                            {loading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <MessageSquare className="mr-2 h-4 w-4" />
                                    Send Feedback
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}

interface FeedbackCardProps {
    feedback: Feedback;
    onAcknowledge?: (id: string) => void;
    isEmployee?: boolean;
}

export function FeedbackCard({ feedback, onAcknowledge, isEmployee = true }: FeedbackCardProps) {
    return (
        <Card className={cn(
            "transition-all",
            !feedback.acknowledged && isEmployee && "border-primary/50 bg-primary/5"
        )}>
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-base">
                            {isEmployee ? `From ${feedback.managerName}` : `To ${feedback.employeeName}`}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground">
                            {format(new Date(feedback.createdAt), 'MMM d, yyyy h:mm a')}
                        </p>
                    </div>
                    {feedback.acknowledged ? (
                        <Badge variant="outline" className="bg-success/10 text-success">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Acknowledged
                        </Badge>
                    ) : isEmployee && (
                        <Badge variant="outline" className="bg-primary/10 text-primary">
                            New
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-3">
                <p className="text-sm">{feedback.content}</p>

                {!feedback.acknowledged && isEmployee && onAcknowledge && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAcknowledge(feedback.id)}
                        className="w-full"
                    >
                        <Check className="h-4 w-4 mr-2" />
                        Acknowledge Feedback
                    </Button>
                )}
            </CardContent>
        </Card>
    );
}

interface ActionItemListProps {
    items: ActionItem[];
    onUpdateStatus: (id: string, status: 'completed') => void;
}

export function ActionItemList({ items, onUpdateStatus }: ActionItemListProps) {
    const openItems = items.filter(i => i.status === 'open' || i.status === 'in_progress');
    const completedItems = items.filter(i => i.status === 'completed');

    return (
        <div className="space-y-4">
            {openItems.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Open Items</h4>
                    {openItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 rounded-full border-2 border-muted-foreground/30 hover:border-success hover:bg-success/10"
                                onClick={() => onUpdateStatus(item.id, 'completed')}
                            >
                                <Check className="h-3 w-3 opacity-0 hover:opacity-100 text-success" />
                            </Button>
                            <div className="flex-1">
                                <p className="text-sm font-medium">{item.title}</p>
                                {item.description && (
                                    <p className="text-xs text-muted-foreground">{item.description}</p>
                                )}
                            </div>
                            {item.dueDate && (
                                <Badge
                                    variant="outline"
                                    className={cn(
                                        "text-xs",
                                        new Date(item.dueDate) < new Date() && "bg-destructive/10 text-destructive"
                                    )}
                                >
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {format(new Date(item.dueDate), 'MMM d')}
                                </Badge>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {completedItems.length > 0 && (
                <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Completed</h4>
                    {completedItems.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30 opacity-75">
                            <div className="h-6 w-6 rounded-full bg-success/20 flex items-center justify-center">
                                <Check className="h-3 w-3 text-success" />
                            </div>
                            <p className="text-sm line-through text-muted-foreground">{item.title}</p>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
