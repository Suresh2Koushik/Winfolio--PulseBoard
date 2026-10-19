import { useState, useEffect } from "react";
import { Activity, STATUS_OPTIONS, ActivityCategory } from "@/types";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { format, parseISO } from "date-fns";
import { ATTACHMENTS_ENABLED } from "@/lib/features";
import { suggestCategory, getWeekNumber } from "@/utils/categorization";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, FileText, Loader2, Sparkles, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const CURRENT_YEAR = new Date().getFullYear();
const MAX_FILE_BYTES = 10 * 1024 * 1024;
// Must stay in sync with storage.rules.
const ACCEPTED_FILES = "image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.ppt,.pptx";

// First day of the given quarter, as yyyy-MM-dd.
function quarterStartDate(year: string | number, quarter: string): string {
  const index = Math.max(0, QUARTERS.indexOf(quarter));
  return `${year}-${String(index * 3 + 1).padStart(2, "0")}-01`;
}

// Today in the user's own timezone (toISOString() would give the UTC date).
const today = () => format(new Date(), "yyyy-MM-dd");

const emptyForm = () => ({
  date: today(),
  quarter: "",
  title: "",
  description: "",
  category: "Other" as ActivityCategory,
  teams: [] as string[],
  impactNotes: "",
  status: "Done" as Activity["status"], // a logged win is usually finished work
  attachmentUrl: "",
  praises: "",
});

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Resolve true to close the dialog (saved), false to keep it open (failed). */
  onSave: (activity: Omit<Activity, "id" | "userId" | "createdAt" | "updatedAt">) => Promise<boolean>;
  editActivity?: Activity | null;
}

export function ActivityForm({ open, onOpenChange, onSave, editActivity }: ActivityFormProps) {
  const { categories, teams: teamOptions } = useUserData();
  const { user } = useAuth();
  const [formData, setFormData] = useState(emptyForm);
  const [dateType, setDateType] = useState<"date" | "quarter">("date");
  const [moreOpen, setMoreOpen] = useState(false);
  const [suggestedCategory, setSuggestedCategory] = useState<ActivityCategory | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (editActivity) {
      setFormData({
        date: editActivity.date,
        quarter: editActivity.quarter || "",
        title: editActivity.title,
        description: editActivity.description || "",
        category: editActivity.category,
        teams: editActivity.teams,
        impactNotes: editActivity.impactNotes,
        status: editActivity.status,
        attachmentUrl: editActivity.attachmentUrl || "",
        praises: editActivity.praises || "",
      });
      // Every activity stores a quarter; quarter-level entries are the ones dated on the quarter's first day.
      const isQuarterEntry = !!editActivity.quarter
        && editActivity.date === quarterStartDate(editActivity.date.slice(0, 4), editActivity.quarter);
      setDateType(isQuarterEntry ? "quarter" : "date");
      // Open the extra fields when the win already uses them.
      setMoreOpen(Boolean(editActivity.description || editActivity.teams.length || editActivity.praises
        || (ATTACHMENTS_ENABLED && editActivity.attachmentUrl) || editActivity.status !== "Done"));
    } else {
      setFormData(emptyForm());
      setDateType("date");
      setMoreOpen(false);
    }
    setSuggestedCategory(null);
    setSelectedFile(null);
    setRemoveAttachment(false);
  }, [editActivity, open]);

  useEffect(() => {
    const pool = categories.length > 0 ? categories : DEFAULT_CATEGORIES;
    const suggested = formData.title || formData.description
      ? suggestCategory(formData.title, formData.description, pool)
      : null;
    setSuggestedCategory(suggested && suggested !== formData.category ? suggested : null);
  }, [formData.title, formData.description, formData.category, categories]);

  // Keep the win's current category selectable even if it was renamed or deleted.
  const categoryOptions = (() => {
    const list = (categories.length > 0 ? categories : DEFAULT_CATEGORIES).map((c) => ({ name: c.name, emoji: c.emoji }));
    if (formData.category && !list.some((c) => c.name === formData.category)) {
      list.push({ name: formData.category, emoji: "🔹" });
    }
    return list;
  })();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Files can be up to 10MB");
      return;
    }
    setSelectedFile(file);
    setRemoveAttachment(false);
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;
    try {
      const fileExt = (selectedFile.name.split(".").pop() || "bin").replace(/[^a-z0-9]/gi, "").slice(0, 10);
      const filePath = `activities/${user.uid}/${Date.now()}.${fileExt}`;
      await uploadBytes(ref(storage, filePath), selectedFile, { contentType: selectedFile.type || undefined });
      return filePath;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Couldn't upload that file. Images, PDFs, Office documents and text/CSV up to 10MB work.");
      return null;
    }
  };

  // Only files we uploaded live in our bucket; imported rows may hold external links.
  const isOwnUpload = (path?: string) => !!path && path.startsWith("activities/");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;
    if (dateType === "quarter" && !formData.quarter) {
      toast.error("Please choose a quarter");
      return;
    }

    setSaving(true);
    try {
      const previous = editActivity?.attachmentUrl;
      let attachmentUrl = removeAttachment ? "" : formData.attachmentUrl;

      if (selectedFile) {
        // Upload first; only drop the old file once the new one is safely stored.
        const uploadedPath = await uploadFile();
        if (!uploadedPath) return;
        attachmentUrl = uploadedPath;
      }

      const date = dateType === "quarter"
        ? quarterStartDate(formData.date.slice(0, 4) || CURRENT_YEAR, formData.quarter)
        : formData.date;

      const saved = await onSave({
        ...formData,
        title: formData.title.trim(),
        impactNotes: formData.impactNotes.trim(),
        date,
        weekNumber: getWeekNumber(parseISO(date)),
        attachmentUrl: attachmentUrl || undefined,
        quarter: dateType === "quarter" ? formData.quarter : undefined,
      });
      if (!saved) return;

      if (previous && previous !== attachmentUrl && isOwnUpload(previous)) {
        deleteObject(ref(storage, previous)).catch((err) => console.warn("Failed to delete old attachment", err));
      }
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const addTeam = (team: string) => {
    if (team && !formData.teams.includes(team)) {
      setFormData({ ...formData, teams: [...formData.teams, team] });
    }
  };
  const removeTeam = (team: string) => setFormData({ ...formData, teams: formData.teams.filter((t) => t !== team) });

  const hasFile = selectedFile || (formData.attachmentUrl && !removeAttachment);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-xl overflow-y-auto rounded-2xl border-2 border-foreground p-0 shadow-[6px_6px_0_hsl(var(--foreground))]">
        <DialogHeader className="space-y-1 border-b px-6 pb-4 pt-6 text-left">
          <DialogTitle className="text-2xl font-extrabold tracking-tight">
            {editActivity ? "Edit win" : "Log a win"}
          </DialogTitle>
          <DialogDescription>
            {editActivity ? "Update the details of this win." : "A couple of sentences will do. Future you says thanks."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 pb-6 pt-5">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-bold">What did you get done?</Label>
            <Input
              id="title"
              autoFocus
              maxLength={200}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Fixed the checkout timeout for large orders"
              required
              className="h-12 text-base"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="impact" className="text-base font-bold">What got better because of it?</Label>
            <Textarea
              id="impact"
              maxLength={5000}
              value={formData.impactNotes}
              onChange={(e) => setFormData({ ...formData, impactNotes: e.target.value })}
              placeholder="Faster, fewer errors, happier customers... in your own words. Numbers help, but they're optional."
              className="min-h-[84px] resize-none"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor={dateType === "date" ? "date" : "quarter-select"} className="font-bold">When</Label>
                <div className="flex rounded-full bg-muted p-0.5 text-xs font-semibold" role="group" aria-label="Date or quarter">
                  {(["date", "quarter"] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={dateType === type}
                      onClick={() => setDateType(type)}
                      className={cn("rounded-full px-2.5 py-1 transition-colors", dateType === type ? "bg-card shadow-sm" : "text-muted-foreground hover:text-foreground")}
                    >
                      {type === "date" ? "Date" : "Quarter"}
                    </button>
                  ))}
                </div>
              </div>
              {dateType === "date" ? (
                <Input id="date" type="date" value={formData.date} max="2100-12-31" onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="h-11" />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={formData.date ? formData.date.slice(0, 4) : CURRENT_YEAR.toString()}
                    onValueChange={(year) => setFormData({ ...formData, date: quarterStartDate(year, formData.quarter || "Q1") })}
                  >
                    <SelectTrigger className="h-11" aria-label="Year"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => (
                        <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select
                    value={formData.quarter}
                    onValueChange={(quarter) => setFormData({ ...formData, quarter, date: quarterStartDate(formData.date.slice(0, 4) || CURRENT_YEAR, quarter) })}
                  >
                    <SelectTrigger id="quarter-select" className="h-11" aria-label="Quarter"><SelectValue placeholder="Quarter" /></SelectTrigger>
                    <SelectContent>
                      {QUARTERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="font-bold">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ActivityCategory })}>
                <SelectTrigger id="category" className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categoryOptions.map((cat) => (
                    <SelectItem key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {suggestedCategory && (
            <button
              type="button"
              onClick={() => setFormData({ ...formData, category: suggestedCategory })}
              className="flex w-full items-center gap-2 rounded-xl bg-pastel-violet px-3 py-2 text-left text-sm font-semibold text-pastel-violet-ink transition-colors hover:bg-pastel-violet/70"
            >
              <Sparkles className="h-4 w-4 shrink-0" aria-hidden="true" />
              Suggested: {suggestedCategory}
            </button>
          )}

          <Collapsible open={moreOpen} onOpenChange={setMoreOpen}>
            <CollapsibleTrigger className="flex items-center gap-1.5 text-sm font-bold text-muted-foreground hover:text-foreground">
              <ChevronDown className={cn("h-4 w-4 transition-transform", moreOpen && "rotate-180")} aria-hidden="true" />
              {moreOpen ? "Fewer details" : "Add more detail"}
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="description">Details</Label>
                <Textarea id="description" maxLength={5000} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Any context worth remembering" className="min-h-[72px] resize-none" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Activity["status"] })}>
                    <SelectTrigger id="status" className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teams">Worked with</Label>
                  <Select value="" onValueChange={addTeam}>
                    <SelectTrigger id="teams" className="h-11"><SelectValue placeholder="Add a team" /></SelectTrigger>
                    <SelectContent>
                      {teamOptions.map((team) => <SelectItem key={team} value={team}>{team}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {formData.teams.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {formData.teams.map((team) => (
                    <Badge key={team} variant="secondary" className="h-7 gap-1 pl-2.5">
                      {team}
                      <button type="button" onClick={() => removeTeam(team)} aria-label={`Remove ${team}`} className="rounded-full p-0.5 hover:bg-background">
                        <X className="h-3 w-3" aria-hidden="true" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="praises">Any kudos?</Label>
                <Input id="praises" maxLength={2000} value={formData.praises} onChange={(e) => setFormData({ ...formData, praises: e.target.value })} placeholder="Praise or thanks you received" className="h-11" />
              </div>

              {ATTACHMENTS_ENABLED && (
                <div className="space-y-2">
                  <Label>Evidence</Label>
                  <div className="flex items-center gap-3 rounded-xl border-2 border-dashed p-3">
                    <div className="min-w-0 flex-1">
                      {hasFile ? (
                        <div className="flex items-center gap-2">
                          <FileText className="h-5 w-5 text-accent" aria-hidden="true" />
                          <span className="truncate text-sm font-medium">{selectedFile ? selectedFile.name : "Current file attached"}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            aria-label="Remove attachment"
                            onClick={() => (selectedFile ? setSelectedFile(null) : setRemoveAttachment(true))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground">Screenshot, PDF or document, up to 10MB</p>
                      )}
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById("attachment-input")?.click()} className="shrink-0 gap-2">
                      <Upload className="h-4 w-4" aria-hidden="true" />
                      {hasFile ? "Replace" : "Attach"}
                    </Button>
                    <input id="attachment-input" type="file" accept={ACCEPTED_FILES} className="hidden" onChange={handleFileSelect} />
                  </div>
                </div>
              )}
            </CollapsibleContent>
          </Collapsible>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-12 flex-1">Cancel</Button>
            <Button type="submit" disabled={saving || !formData.title.trim()} className="h-12 flex-[2] rounded-full text-base font-bold">
              {saving && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {editActivity ? "Save changes" : "Save win"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
