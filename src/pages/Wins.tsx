import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Download, FileSpreadsheet, Plus, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Activity } from "@/types";
import { useActivities } from "@/hooks/useActivities";
import { useUserData } from "@/hooks/useUserData";
import { useLogWin } from "@/contexts/LogWinContext";
import { exportToExcel } from "@/utils/exportData";
import { generateExcelTemplate } from "@/utils/importData";
import { UploadModal } from "@/components/UploadModal";
import { EmptyState, ListSkeleton, Page, PageHeader, useConfirm, WinRow } from "@/components/app/ui";
import { Input } from "@/components/ui/input";
import { WeeklyView } from "./WeeklyView";
import { CategoryView } from "./CategoryView";
import { QuarterView } from "./QuarterView";
import { cn } from "@/lib/utils";

const VIEWS = [
  { id: "list", label: "List" },
  { id: "week", label: "By week" },
  { id: "category", label: "By category" },
  { id: "quarter", label: "By quarter" },
] as const;
type View = (typeof VIEWS)[number]["id"];

export default function Wins() {
  const { activities, loading, deleteActivity } = useActivities();
  const { categories, teams } = useUserData();
  const openLogWin = useLogWin();
  const confirm = useConfirm();
  const [searchParams, setSearchParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [uploadOpen, setUploadOpen] = useState(false);

  const requested = searchParams.get("view");
  const view: View = VIEWS.some((v) => v.id === requested) ? (requested as View) : "list";
  const setView = (next: View) => setSearchParams(next === "list" ? {} : { view: next }, { replace: true });

  const askDelete = (win: Activity) =>
    confirm.ask({
      title: "Delete this win?",
      body: `"${win.title}" will be removed from your journal. This can't be undone.`,
      action: "Delete win",
      onConfirm: () => void deleteActivity(win.id),
    });
  const askDeleteById = (id: string) => {
    const win = activities.find((a) => a.id === id);
    if (win) askDelete(win);
  };

  const q = query.trim().toLowerCase();
  const filtered = q
    ? activities.filter((a) =>
        [a.title, a.description, a.impactNotes, a.category].some((field) => (field || "").toLowerCase().includes(q)))
    : activities;

  return (
    <Page>
      <PageHeader
        title="Wins"
        subtitle={loading ? "Loading your wins…" : `${activities.length} win${activities.length === 1 ? "" : "s"} in your journal`}
        actions={
          <>
            <button type="button" onClick={() => setUploadOpen(true)} className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted">
              <Upload className="h-4 w-4" aria-hidden="true" /> Import
            </button>
            <button
              type="button"
              disabled={activities.length === 0}
              onClick={() => { exportToExcel(activities, "winfolio-wins"); toast.success("Your wins were downloaded"); }}
              className="inline-flex min-h-[40px] items-center gap-2 rounded-full border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" aria-hidden="true" /> Export
            </button>
            <button type="button" onClick={() => openLogWin()} className="inline-flex min-h-[40px] items-center gap-2 rounded-full bg-foreground px-4 text-sm font-bold text-background">
              <Plus className="h-4 w-4" aria-hidden="true" /> Log a win
            </button>
          </>
        }
      />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div role="group" aria-label="View" className="flex gap-1 self-start overflow-x-auto rounded-full bg-muted p-1 max-w-full">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              aria-pressed={view === v.id}
              onClick={() => setView(v.id)}
              className={cn("shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-semibold transition-colors sm:px-4",
                view === v.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view === "list" && (
          <div className="relative md:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <Input aria-label="Search wins" placeholder="Search wins" value={query} onChange={(e) => setQuery(e.target.value)} className="rounded-full pl-9" />
          </div>
        )}
      </div>

      {loading ? (
        <ListSkeleton rows={4} />
      ) : activities.length === 0 ? (
        <EmptyState
          title="No wins yet. Let's fix that."
          body="Log something you did this week, or import wins from a spreadsheet."
          action={
            <div className="mt-1 flex flex-wrap justify-center gap-2">
              <button type="button" onClick={() => openLogWin()} className="rounded-full bg-foreground px-5 py-2.5 font-bold text-background">Log a win</button>
              <button
                type="button"
                onClick={() => { generateExcelTemplate(categories.map((c) => c.name), teams); toast.success("Template downloaded"); }}
                className="inline-flex items-center gap-2 rounded-full border px-5 py-2.5 font-semibold hover:bg-muted"
              >
                <FileSpreadsheet className="h-4 w-4" aria-hidden="true" /> Get import template
              </button>
            </div>
          }
        />
      ) : view === "list" ? (
        filtered.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed py-10 text-center text-muted-foreground">No wins match "{query}".</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {filtered.map((win) => <WinRow key={win.id} win={win} onEdit={openLogWin} onDelete={askDelete} />)}
          </ul>
        )
      ) : view === "week" ? (
        <WeeklyView activities={activities} onEdit={openLogWin} onDelete={askDeleteById} />
      ) : view === "category" ? (
        <CategoryView activities={activities} onEdit={openLogWin} onDelete={askDeleteById} />
      ) : (
        <QuarterView activities={activities} onEdit={openLogWin} onDelete={askDeleteById} />
      )}

      {activities.length > 0 && (
        <p className="text-sm text-muted-foreground">
          Importing from a spreadsheet?{" "}
          <button
            type="button"
            onClick={() => { generateExcelTemplate(categories.map((c) => c.name), teams); toast.success("Template downloaded"); }}
            className="font-semibold text-accent hover:underline"
          >
            Download the template
          </button>
        </p>
      )}

      <UploadModal open={uploadOpen} onOpenChange={setUploadOpen} onImportComplete={() => toast.success("Wins imported")} />
      {confirm.dialog}
    </Page>
  );
}
