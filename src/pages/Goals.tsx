import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GoalForm } from "@/components/GoalForm";
import { GoalCard } from "@/components/GoalCard";
import { EmptyState, ListSkeleton, Page, PageHeader, StatTile, useConfirm } from "@/components/app/ui";
import { useGoals } from "@/hooks/useGoals";
import { useCelebrate } from "@/contexts/CelebrationContext";
import { Goal, GoalStatus, GoalPriority } from "@/types";
import { cn } from "@/lib/utils";

export default function Goals() {
    const { goals, loading, stats, addGoal, updateGoal, updateGoalProgress, deleteGoal } = useGoals();
    const celebrate = useCelebrate();
    const confirm = useConfirm();
    const [formOpen, setFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
    const [priorityFilter, setPriorityFilter] = useState<GoalPriority | "all">("all");
    const [showCompleted, setShowCompleted] = useState(false);

    const openNew = () => {
        setEditingGoal(null);
        setFormOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingGoal(null);
    };

    const handleSave = async (data: Omit<Goal, 'id' | 'userId' | 'linkedCheckInIds' | 'createdAt' | 'updatedAt'>) => {
        if (editingGoal) {
            await updateGoal(editingGoal.id, data);
        } else {
            await addGoal(data);
        }
        handleOpenChange(false);
    };

    const handleDelete = (id: string) =>
        confirm.ask({
            title: "Delete this goal?",
            body: "The goal and its progress will be removed. This can't be undone.",
            action: "Delete goal",
            onConfirm: () => void deleteGoal(id),
        });

    const handleUpdateProgress = async (id: string, progress: number) => {
        const before = goals.find((g) => g.id === id)?.progress ?? 0;
        await updateGoalProgress(id, progress);
        if (progress >= 100 && before < 100) celebrate("Goal complete! That's a big one.");
    };

    const q = searchQuery.trim().toLowerCase();
    const filteredGoals = goals.filter((goal) => {
        const matchesSearch = !q || goal.title.toLowerCase().includes(q) || (goal.description || "").toLowerCase().includes(q);
        const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || goal.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });
    const shown = filteredGoals.filter((g) => (g.status === "completed") === showCompleted);
    const activeCount = filteredGoals.filter((g) => g.status !== "completed").length;

    return (
        <Page>
            <PageHeader
                title="Goals"
                subtitle="What you're working towards, and how it's going."
                actions={
                    <button type="button" onClick={openNew} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background">
                        <Plus className="h-4 w-4" aria-hidden="true" /> New goal
                    </button>
                }
            />

            {loading ? (
                <ListSkeleton rows={3} />
            ) : goals.length === 0 ? (
                <EmptyState
                    title="No goals yet"
                    body="Set something you want to achieve this quarter. Your wins and reflections can point back to it."
                    action={<button type="button" onClick={openNew} className="mt-1 rounded-full bg-foreground px-5 py-2.5 font-bold text-background">Set your first goal</button>}
                />
            ) : (
                <>
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                        <StatTile tint="blue" label="Active" value={stats.total - stats.completed} />
                        <StatTile tint="violet" label="On track" value={stats.onTrack} />
                        <StatTile tint="pink" label="Needs attention" value={stats.atRisk} note="At risk or behind" />
                        <StatTile tint="ink" label="Completed" value={stats.completed} />
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div role="group" aria-label="Show" className="flex gap-1 self-start rounded-full bg-muted p-1">
                            {[false, true].map((completed) => (
                                <button
                                    key={String(completed)}
                                    type="button"
                                    aria-pressed={showCompleted === completed}
                                    onClick={() => setShowCompleted(completed)}
                                    className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                                        showCompleted === completed ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {completed ? `Completed (${filteredGoals.length - activeCount})` : `Active (${activeCount})`}
                                </button>
                            ))}
                        </div>
                        <div className="flex flex-col gap-2 sm:flex-row">
                            <div className="relative sm:w-64">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                                <Input aria-label="Search goals" placeholder="Search goals" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-full pl-9" />
                            </div>
                            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as GoalStatus | "all")}>
                                <SelectTrigger className="rounded-full sm:w-[150px]" aria-label="Status"><SelectValue placeholder="Status" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any status</SelectItem>
                                    <SelectItem value="on_track">On track</SelectItem>
                                    <SelectItem value="at_risk">At risk</SelectItem>
                                    <SelectItem value="behind">Behind</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as GoalPriority | "all")}>
                                <SelectTrigger className="rounded-full sm:w-[150px]" aria-label="Priority"><SelectValue placeholder="Priority" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Any priority</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="low">Low</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {shown.length === 0 ? (
                        <p className="rounded-2xl border-2 border-dashed py-10 text-center text-muted-foreground">
                            {showCompleted ? "No completed goals yet. Keep going!" : "No active goals match."}
                        </p>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2">
                            {shown.map((goal) => (
                                <GoalCard
                                    key={goal.id}
                                    goal={goal}
                                    onEdit={(g) => { setEditingGoal(g); setFormOpen(true); }}
                                    onDelete={handleDelete}
                                    onUpdateProgress={showCompleted ? undefined : handleUpdateProgress}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            <GoalForm open={formOpen} onOpenChange={handleOpenChange} onSave={handleSave} editGoal={editingGoal} />
            {confirm.dialog}
        </Page>
    );
}
