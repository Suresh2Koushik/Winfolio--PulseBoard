import { useState } from "react";
import { Plus, Calendar, Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CheckInForm } from "@/components/CheckInForm";
import { CheckInCard } from "@/components/CheckInCard";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useGoals } from "@/hooks/useGoals";
import { CheckIn } from "@/types";
import { parseISO } from "date-fns";

export default function CheckIns() {
    const { checkIns, loading, addCheckIn, updateCheckIn, deleteCheckIn } = useCheckIns();
    const { goals } = useGoals();
    const [formOpen, setFormOpen] = useState(false);
    const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
    const [searchQuery, setSearchQuery] = useState("");

    const handleSave = async (data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (editingCheckIn) {
            await updateCheckIn(editingCheckIn.id, data);
            setEditingCheckIn(null);
        } else {
            await addCheckIn(data);
        }
        setFormOpen(false);
    };

    const handleEdit = (checkIn: CheckIn) => {
        setEditingCheckIn(checkIn);
        setFormOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this check-in?")) {
            await deleteCheckIn(id);
        }
    };

    const filteredCheckIns = checkIns.filter(
        (c) =>
            c.workSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.achievements?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.blockers?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Group by month
    const groupedByMonth = filteredCheckIns.reduce((acc, checkIn) => {
        const monthKey = parseISO(checkIn.weekStart).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long'
        });
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(checkIn);
        return acc;
    }, {} as Record<string, CheckIn[]>);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-br from-background via-background to-secondary/20">
            <div className="p-4 md:p-6 max-w-5xl mx-auto">
                <header className="mb-8">
                    <h1 className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Weekly Check-Ins
                    </h1>
                    <p className="text-muted-foreground text-sm">
                        Track your weekly progress and share updates with your manager
                    </p>
                </header>

                <div className="flex flex-col sm:flex-row gap-3 mb-6">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                        <Input
                            placeholder="Search check-ins..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={() => { setEditingCheckIn(null); setFormOpen(true); }} className="gap-2">
                        <Plus className="h-4 w-4" />
                        New Check-In
                    </Button>
                </div>

                <Tabs defaultValue="all" className="space-y-6">
                    <TabsList>
                        <TabsTrigger value="all">All Check-Ins</TabsTrigger>
                        <TabsTrigger value="recent">This Month</TabsTrigger>
                        <TabsTrigger value="blockers">With Blockers</TabsTrigger>
                    </TabsList>

                    <TabsContent value="all" className="space-y-8">
                        {Object.keys(groupedByMonth).length === 0 ? (
                            <div className="text-center py-16 bg-card rounded-xl border-2 border-dashed">
                                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No check-ins yet</h3>
                                <p className="text-muted-foreground mb-4">
                                    Start tracking your weekly progress by creating your first check-in
                                </p>
                                <Button onClick={() => setFormOpen(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Create Check-In
                                </Button>
                            </div>
                        ) : (
                            Object.entries(groupedByMonth).map(([month, monthCheckIns]) => (
                                <div key={month}>
                                    <h2 className="text-lg font-semibold mb-4 text-muted-foreground">{month}</h2>
                                    <div className="space-y-4">
                                        {monthCheckIns.map((checkIn) => (
                                            <CheckInCard
                                                key={checkIn.id}
                                                checkIn={checkIn}
                                                goals={goals}
                                                onEdit={handleEdit}
                                                onDelete={handleDelete}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="recent" className="space-y-4">
                        {filteredCheckIns
                            .filter((c) => {
                                const now = new Date();
                                const start = parseISO(c.weekStart);
                                return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
                            })
                            .map((checkIn) => (
                                <CheckInCard
                                    key={checkIn.id}
                                    checkIn={checkIn}
                                    goals={goals}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                />
                            ))}
                    </TabsContent>

                    <TabsContent value="blockers" className="space-y-4">
                        {filteredCheckIns
                            .filter((c) => c.blockers && c.blockers.trim().length > 0)
                            .map((checkIn) => (
                                <CheckInCard
                                    key={checkIn.id}
                                    checkIn={checkIn}
                                    goals={goals}
                                    onEdit={handleEdit}
                                    onDelete={handleDelete}
                                    expanded
                                />
                            ))}
                    </TabsContent>
                </Tabs>

                <CheckInForm
                    open={formOpen}
                    onOpenChange={setFormOpen}
                    onSave={handleSave}
                    editCheckIn={editingCheckIn}
                />
            </div>
        </div>
    );
}
