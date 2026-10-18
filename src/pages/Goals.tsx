import { useState } from "react";
import { Plus, Target, Loader2, Search, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GoalForm } from "@/components/GoalForm";
import { GoalCard } from "@/components/GoalCard";
import { UserMenu } from "@/components/UserMenu";
import { useGoals } from "@/hooks/useGoals";
import { Goal, GoalStatus, GoalPriority } from "@/types";

export default function Goals() {
    const { goals, loading, stats, addGoal, updateGoal, updateGoalProgress, deleteGoal } = useGoals();
    const [formOpen, setFormOpen] = useState(false);
    const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<GoalStatus | "all">("all");
    const [priorityFilter, setPriorityFilter] = useState<GoalPriority | "all">("all");

    const handleSave = async (data: Omit<Goal, 'id' | 'userId' | 'linkedCheckInIds' | 'createdAt' | 'updatedAt'>) => {
        if (editingGoal) {
            await updateGoal(editingGoal.id, data);
            setEditingGoal(null);
        } else {
            await addGoal(data);
        }
        setFormOpen(false);
    };

    const handleEdit = (goal: Goal) => {
        setEditingGoal(goal);
        setFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this goal?")) {
            await deleteGoal(id);
        }
    };

    const handleUpdateProgress = async (id: string, progress: number) => {
        await updateGoalProgress(id, progress);
    };

    const filteredGoals = goals.filter((goal) => {
        const matchesSearch = goal.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            goal.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = statusFilter === "all" || goal.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || goal.priority === priorityFilter;
        return matchesSearch && matchesStatus && matchesPriority;
    });

    const activeGoals = filteredGoals.filter(g => g.status !== 'completed');
    const completedGoals = filteredGoals.filter(g => g.status === 'completed');

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary/20">
            <div className="container mx-auto p-6 max-w-6xl">
                <header className="mb-8 flex justify-between items-start">
                    <div>
                        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                            Goals & Impact
                        </h1>
                        <p className="text-muted-foreground">
                            Track your objectives and measure your progress
                        </p>
                    </div>
                    <UserMenu />
                </header>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Goals</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold">{stats.total}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-success/5 to-success/10 border-success/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-success">{stats.completed}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-info/5 to-info/10 border-info/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">On Track</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-info">{stats.onTrack}</div>
                        </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-warning/5 to-warning/10 border-warning/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">At Risk</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-warning">{stats.atRisk}</div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search goals..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as GoalStatus | "all")}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="on_track">On Track</SelectItem>
                            <SelectItem value="at_risk">At Risk</SelectItem>
                            <SelectItem value="behind">Behind</SelectItem>
                            <SelectItem value="completed">Completed</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={priorityFilter} onValueChange={(v) => setPriorityFilter(v as GoalPriority | "all")}>
                        <SelectTrigger className="w-[150px]">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="critical">Critical</SelectItem>
                            <SelectItem value="high">High</SelectItem>
                            <SelectItem value="medium">Medium</SelectItem>
                            <SelectItem value="low">Low</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button onClick={() => { setEditingGoal(null); setFormOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Goal
                    </Button>
                </div>

                <Tabs defaultValue="active" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="active">Active ({activeGoals.length})</TabsTrigger>
                        <TabsTrigger value="completed">Completed ({completedGoals.length})</TabsTrigger>
                    </TabsList>

                    <TabsContent value="active">
                        {activeGoals.length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed">
                                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No active goals</h3>
                                <p className="text-muted-foreground mb-4">
                                    Set your objectives and start tracking your progress
                                </p>
                                <Button onClick={() => setFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Goal
                                </Button>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {activeGoals.map((goal) => (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                        onUpdateProgress={handleUpdateProgress}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent value="completed">
                        {completedGoals.length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed">
                                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No completed goals yet</h3>
                                <p className="text-muted-foreground">
                                    Keep working on your active goals!
                                </p>
                            </div>
                        ) : (
                            <div className="grid md:grid-cols-2 gap-4">
                                {completedGoals.map((goal) => (
                                    <GoalCard
                                        key={goal.id}
                                        goal={goal}
                                        onEdit={handleEdit}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        )}
                    </TabsContent>
                </Tabs>

                <GoalForm
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    onSave={handleSave}
                    editGoal={editingGoal}
                />
            </div>
        </div>
    );
}
