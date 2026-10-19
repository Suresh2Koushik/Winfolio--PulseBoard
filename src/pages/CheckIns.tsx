import { useState } from "react";
import { Plus, Search } from "lucide-react";
import { parseISO } from "date-fns";
import { Input } from "@/components/ui/input";
import { CheckInForm } from "@/components/CheckInForm";
import { CheckInCard } from "@/components/CheckInCard";
import { EmptyState, ListSkeleton, Page, PageHeader, useConfirm } from "@/components/app/ui";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useGoals } from "@/hooks/useGoals";
import { useCelebrate } from "@/contexts/CelebrationContext";
import { CheckIn } from "@/types";
import { cn } from "@/lib/utils";

const FILTERS = [
    { id: "all", label: "All" },
    { id: "month", label: "This month" },
    { id: "challenges", label: "With challenges" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

export default function CheckIns() {
    const { checkIns, loading, addCheckIn, updateCheckIn, deleteCheckIn } = useCheckIns();
    const { goals } = useGoals();
    const celebrate = useCelebrate();
    const confirm = useConfirm();
    const [formOpen, setFormOpen] = useState(false);
    const [editingCheckIn, setEditingCheckIn] = useState<CheckIn | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filter, setFilter] = useState<Filter>("all");

    const openNew = () => {
        setEditingCheckIn(null);
        setFormOpen(true);
    };

    const handleOpenChange = (open: boolean) => {
        setFormOpen(open);
        if (!open) setEditingCheckIn(null);
    };

    const handleSave = async (data: Omit<CheckIn, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
        if (editingCheckIn) {
            if (await updateCheckIn(editingCheckIn.id, data)) handleOpenChange(false);
            return;
        }
        if (await addCheckIn(data)) {
            handleOpenChange(false);
            celebrate("Reflection saved. Future you says thanks!", { pose: "thumbs", confetti: false });
        }
    };

    const handleDelete = (id: string) =>
        confirm.ask({
            title: "Delete this reflection?",
            body: "It will be removed from your journal and future reviews. This can't be undone.",
            action: "Delete reflection",
            onConfirm: () => void deleteCheckIn(id),
        });

    const q = searchQuery.trim().toLowerCase();
    const now = new Date();
    const visible = checkIns
        .filter((c) => !q || [c.workSummary, c.achievements, c.blockers, c.supportNeeded]
            .some((field) => (field || "").toLowerCase().includes(q)))
        .filter((c) => {
            if (filter === "challenges") return Boolean(c.blockers?.trim());
            if (filter === "month") {
                const start = parseISO(c.weekStart);
                return start.getMonth() === now.getMonth() && start.getFullYear() === now.getFullYear();
            }
            return true;
        });

    const groupedByMonth = visible.reduce((acc, checkIn) => {
        const monthKey = parseISO(checkIn.weekStart).toLocaleDateString("en-US", { year: "numeric", month: "long" });
        (acc[monthKey] ??= []).push(checkIn);
        return acc;
    }, {} as Record<string, CheckIn[]>);

    return (
        <Page className="max-w-4xl">
            <PageHeader
                title="Weekly Reflections"
                subtitle="A few minutes each week on what went well, what was hard, and what's next."
                actions={
                    <button type="button" onClick={openNew} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background">
                        <Plus className="h-4 w-4" aria-hidden="true" /> New reflection
                    </button>
                }
            />

            {loading ? (
                <ListSkeleton rows={3} />
            ) : checkIns.length === 0 ? (
                <EmptyState
                    pose="thumbs"
                    title="No reflections yet"
                    body="Take a moment to reflect on your week. Your future self will thank you at review time."
                    action={<button type="button" onClick={openNew} className="mt-1 rounded-full bg-foreground px-5 py-2.5 font-bold text-background">Write your first reflection</button>}
                />
            ) : (
                <>
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div role="group" aria-label="Filter reflections" className="flex flex-wrap gap-1 rounded-full bg-muted p-1">
                            {FILTERS.map((f) => (
                                <button
                                    key={f.id}
                                    type="button"
                                    aria-pressed={filter === f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                                        filter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
                                >
                                    {f.label}
                                </button>
                            ))}
                        </div>
                        <div className="relative md:w-72">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
                            <Input aria-label="Search reflections" placeholder="Search reflections" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="rounded-full pl-9" />
                        </div>
                    </div>

                    {visible.length === 0 ? (
                        <p className="rounded-2xl border-2 border-dashed py-10 text-center text-muted-foreground">No reflections match.</p>
                    ) : (
                        Object.entries(groupedByMonth).map(([month, monthCheckIns]) => (
                            <section key={month} className="space-y-3">
                                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">{month}</h2>
                                {monthCheckIns.map((checkIn) => (
                                    <CheckInCard
                                        key={checkIn.id}
                                        checkIn={checkIn}
                                        goals={goals}
                                        onEdit={(c) => { setEditingCheckIn(c); setFormOpen(true); }}
                                        onDelete={handleDelete}
                                        expanded={filter === "challenges"}
                                    />
                                ))}
                            </section>
                        ))
                    )}
                </>
            )}

            <CheckInForm open={formOpen} onOpenChange={handleOpenChange} onSave={handleSave} editCheckIn={editingCheckIn} />
            {confirm.dialog}
        </Page>
    );
}
