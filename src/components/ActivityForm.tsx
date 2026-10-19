import { useState, useEffect } from "react";
import { Activity, STATUS_OPTIONS, ActivityCategory } from "@/types";
import { DEFAULT_CATEGORIES } from "@/lib/categories";
import { useUserData } from "@/hooks/useUserData";
import { useAuth } from "@/contexts/AuthContext";
import { storage } from "@/lib/firebase";
import { ref, uploadBytes, deleteObject } from "firebase/storage";
import { parseISO } from "date-fns";
import { suggestCategory, getWeekNumber } from "@/utils/categorization";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Sparkles, Upload, FileText, Loader2, Plus } from "lucide-react";
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

interface ActivityFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (activity: Omit<Activity, "id" | "userId" | "createdAt" | "updatedAt">) => void | Promise<void>;
  editActivity?: Activity | null;
}

export function ActivityForm({ open, onOpenChange, onSave, editActivity }: ActivityFormProps) {
  const { categories, teams: teamOptions } = useUserData();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    quarter: "",
    title: "",
    description: "",
    category: "Other" as ActivityCategory,
    teams: [] as string[],
    impactNotes: "",
    status: "Not Started" as Activity["status"],
    attachmentUrl: "",
    praises: "",
  });
  const [dateType, setDateType] = useState<"date" | "quarter">("date");

  const [suggestedCategory, setSuggestedCategory] = useState<ActivityCategory | null>(null);
  const [teamInput, setTeamInput] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [removeAttachment, setRemoveAttachment] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (editActivity) {
      setFormData({
        date: editActivity.date,
        quarter: editActivity.quarter || "",
        title: editActivity.title,
        description: editActivity.description,
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
    } else {
      setFormData({
        date: new Date().toISOString().split("T")[0],
        quarter: "",
        title: "",
        description: "",
        category: "Other",
        teams: [],
        impactNotes: "",
        status: "Not Started",
        attachmentUrl: "",
        praises: "",
      });
      setDateType("date");
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

  // Keep the activity's current category selectable even if it was renamed or deleted.
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
    if (file) {
      if (file.size > MAX_FILE_BYTES) {
        toast.error("File size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      setRemoveAttachment(false);
    }
  };

  const uploadFile = async (): Promise<string | null> => {
    if (!selectedFile || !user) return null;

    try {
      const fileExt = (selectedFile.name.split('.').pop() || 'bin').replace(/[^a-z0-9]/gi, '').slice(0, 10);
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `activities/${user.uid}/${fileName}`;
      await uploadBytes(ref(storage, filePath), selectedFile, {
        contentType: selectedFile.type || undefined,
      });
      return filePath;
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload file. Allowed: images, PDF, Office documents, text/CSV up to 10MB.");
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

    setUploading(true);
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

      await onSave({
        ...formData,
        title: formData.title.trim(),
        date,
        weekNumber: getWeekNumber(parseISO(date)),
        attachmentUrl: attachmentUrl || undefined,
        quarter: dateType === "quarter" ? formData.quarter : undefined,
      });

      if (previous && previous !== attachmentUrl && isOwnUpload(previous)) {
        deleteObject(ref(storage, previous)).catch((err) => console.warn("Failed to delete old attachment", err));
      }
    } catch (error) {
      console.error("Save error:", error);
      toast.error("Failed to save activity");
    } finally {
      setUploading(false);
    }
  };

  const addTeam = (team: string) => {
    if (team && !formData.teams.includes(team)) {
      setFormData({ ...formData, teams: [...formData.teams, team] });
      setTeamInput("");
    }
  };

  const removeTeam = (team: string) => {
    setFormData({ ...formData, teams: formData.teams.filter((t) => t !== team) });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[95vh] overflow-y-auto card-glass border-0 shadow-2xl p-0">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white shrink-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            {editActivity ? "Edit Performance Impact" : "Track New Impact"}
            {editActivity && <Badge variant="secondary" className="ml-2 bg-white/20 text-white border-0">Editing</Badge>}
          </DialogTitle>
          <p className="text-white/80 text-sm mt-1">Capture your work and build your achievement story.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column: Core Details */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Time Period *</Label>
                <RadioGroup value={dateType} onValueChange={(value: "date" | "quarter") => setDateType(value)} className="flex gap-4 p-1 bg-muted/30 rounded-lg">
                  <div className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all", dateType === 'date' && "bg-white shadow-sm font-bold")}>
                    <RadioGroupItem value="date" id="date-type" className="hidden" />
                    <Label htmlFor="date-type" className="cursor-pointer">Specific Date</Label>
                  </div>
                  <div className={cn("flex-1 flex items-center justify-center gap-2 py-2 rounded-md transition-all", dateType === 'quarter' && "bg-white shadow-sm font-bold")}>
                    <RadioGroupItem value="quarter" id="quarter-type" className="hidden" />
                    <Label htmlFor="quarter-type" className="cursor-pointer">Quarter</Label>
                  </div>
                </RadioGroup>
              </div>

              {dateType === "date" ? (
                <div className="space-y-2">
                  <Label htmlFor="date">Work Date</Label>
                  <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="h-11" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="year">Year</Label>
                    <Select value={formData.date ? formData.date.slice(0, 4) : CURRENT_YEAR.toString()} onValueChange={(year) => setFormData({ ...formData, date: quarterStartDate(year, formData.quarter || "Q1") })}>
                      <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map((year) => (
                          <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="quarter">Quarter</Label>
                    <Select value={formData.quarter} onValueChange={(quarter) => setFormData({ ...formData, quarter, date: quarterStartDate(formData.date.slice(0, 4) || CURRENT_YEAR, quarter) })} required>
                      <SelectTrigger className="h-11"><SelectValue placeholder="Q1" /></SelectTrigger>
                      <SelectContent>
                        {QUARTERS.map((q) => <SelectItem key={q} value={q}>{q}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="title">Activity Title *</Label>
                <Input id="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="e.g., roofing demo for golden account" required className="h-11 font-medium" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                {suggestedCategory && suggestedCategory !== formData.category && (
                  <Button type="button" variant="outline" size="sm" onClick={() => setFormData({ ...formData, category: suggestedCategory })} className="w-full justify-start gap-2 bg-accent/5 border-accent/20 text-accent hover:bg-accent/10 mb-2 h-9">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span className="text-xs">Suggested: {suggestedCategory}</span>
                  </Button>
                )}
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value as ActivityCategory })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((cat) => (
                      <SelectItem key={cat.name} value={cat.name}>{cat.emoji} {cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Right Column: Context & Impact */}
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="What did you do? Why does it matter?" className="min-h-[105px] resize-none" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="impact">Impact Evidence</Label>
                <Textarea id="impact" value={formData.impactNotes} onChange={(e) => setFormData({ ...formData, impactNotes: e.target.value })} placeholder="Metrics, outcomes, or key takeaways..." className="min-h-[75px] resize-none" />
              </div>

              <div className="space-y-2">
                <Label>Cross-functional Collaboration</Label>
                <div className="flex gap-2">
                  <Select value={teamInput} onValueChange={addTeam}>
                    <SelectTrigger className="h-11"><SelectValue placeholder="Add team..." /></SelectTrigger>
                    <SelectContent>
                      {teamOptions.map((team) => (
                        <SelectItem key={team} value={team}>{team}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formData.teams.map((team) => (
                    <Badge key={team} variant="secondary" className="pl-2 gap-1 h-7">
                      {team}
                      <X className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => removeTeam(team)} />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Performance Status</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value as Activity["status"] })}>
                  <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recognition</Label>
                <Input value={formData.praises} onChange={(e) => setFormData({ ...formData, praises: e.target.value })} placeholder="Kudos or specific praise received..." className="h-11" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Attachment (Evidence)</Label>
              <div className="flex items-center gap-3 p-4 border-2 border-dashed rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                <div className="flex-1 min-w-0">
                  {selectedFile || (formData.attachmentUrl && !removeAttachment) ? (
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <span className="text-sm font-medium truncate">{selectedFile ? selectedFile.name : "Current file attached"}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label="Remove attachment"
                        onClick={() => {
                          if (selectedFile) setSelectedFile(null);
                          else setRemoveAttachment(true);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">Upload screenshots, PDFs, or documents to support your activity (Max 10MB)</p>
                  )}
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById('attachment-input')?.click()} className="shrink-0 gap-2">
                  <Upload className="h-4 w-4" />
                  {selectedFile || (formData.attachmentUrl && !removeAttachment) ? "Replace" : "Browse"}
                </Button>
                <input id="attachment-input" type="file" accept={ACCEPTED_FILES} className="hidden" onChange={handleFileSelect} />
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="flex-1 h-12">Cancel</Button>
            <Button type="submit" className="flex-[2] h-12 gap-2 shadow-lg shadow-primary/20" disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              {editActivity ? "Update Achievement" : "Capture Achievement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
