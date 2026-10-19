import { useMemo, useState } from "react";
import { Activity, CheckIn } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, Download, FileText, Loader2, NotebookPen, Sparkles } from "lucide-react";
import { format, parseISO, startOfQuarter } from "date-fns";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useUserData } from "@/hooks/useUserData";
import { useCelebrate } from "@/contexts/CelebrationContext";
import { categoryDisplay } from "@/lib/categories";
import { buildReview, customPeriod, hasImpact, periodOptions, ReviewPeriod } from "@/lib/review";

interface ReviewGeneratorProps {
  activities: Activity[];
  checkIns: CheckIn[];
}

const GROUP_LABELS = { quarter: "Quarters", month: "Months", half: "Half-years", year: "Years" } as const;
const CUSTOM = "custom";

export function ReviewGenerator({ activities, checkIns }: ReviewGeneratorProps) {
  const { userProfile, user } = useAuth();
  const { categories } = useUserData();
  const celebrate = useCelebrate();
  const options = useMemo(() => periodOptions(), []);
  const [periodId, setPeriodId] = useState<string>(options.quarter[0].id);
  const [customFrom, setCustomFrom] = useState(format(startOfQuarter(new Date()), "yyyy-MM-dd"));
  const [customTo, setCustomTo] = useState(format(new Date(), "yyyy-MM-dd"));
  const [isGenerating, setIsGenerating] = useState(false);

  const allPeriods = useMemo(
    () => [...options.quarter, ...options.month, ...options.half, ...options.year],
    [options],
  );
  const period: ReviewPeriod | null = periodId === CUSTOM
    ? customPeriod(customFrom, customTo)
    : allPeriods.find((p) => p.id === periodId) ?? null;

  const review = useMemo(
    () => (period ? buildReview(activities, checkIns, period) : null),
    [activities, checkIns, period],
  );

  const handleExport = async () => {
    if (!review || !period || review.wins.length === 0) return;
    setIsGenerating(true);
    try {
      const { exportReviewPdf } = await import("@/utils/pdfExport");
      exportReviewPdf({
        review,
        periodLabel: period.label,
        userName: userProfile?.fullName || user?.email || "Your review",
      });
      celebrate("Your review PDF is ready. Go get them!", { pose: "celebrate" });
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Couldn't create the PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border shadow-sm">
        <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-2xl flex items-center gap-2">
              <FileText className="h-6 w-6 text-primary" aria-hidden="true" />
              Prepare my performance review
            </CardTitle>
            <CardDescription>
              Bring together the wins and reflections you recorded for a review period. Nothing is added that you didn't write.
            </CardDescription>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="space-y-1.5">
              <Label htmlFor="review-period">Review period</Label>
              <Select value={periodId} onValueChange={setPeriodId}>
                <SelectTrigger id="review-period" className="w-[220px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(GROUP_LABELS) as (keyof typeof GROUP_LABELS)[]).map((kind) => (
                    <SelectGroup key={kind}>
                      <SelectLabel>{GROUP_LABELS[kind]}</SelectLabel>
                      {options[kind].map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                  <SelectGroup>
                    <SelectLabel>Other</SelectLabel>
                    <SelectItem value={CUSTOM}>Custom range…</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            {periodId === CUSTOM && (
              <div className="flex gap-2">
                <div className="space-y-1.5">
                  <Label htmlFor="review-from">From</Label>
                  <Input id="review-from" type="date" value={customFrom} max={customTo} onChange={(e) => setCustomFrom(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="review-to">To</Label>
                  <Input id="review-to" type="date" value={customTo} min={customFrom} onChange={(e) => setCustomTo(e.target.value)} />
                </div>
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {!period || !review ? (
            <p className="text-sm text-destructive">Choose a start date on or before the end date.</p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Wins recorded</p>
                  <p className="text-2xl font-bold">{review.wins.length}</p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">With documented impact</p>
                  <p className="text-2xl font-bold">
                    {review.withImpact}
                    {review.wins.length > 0 && <span className="text-base font-medium text-muted-foreground"> of {review.wins.length}</span>}
                  </p>
                </div>
                <div className="rounded-xl border bg-muted/30 p-4">
                  <p className="text-sm text-muted-foreground">Weekly reflections</p>
                  <p className="text-2xl font-bold">{review.reflections.length}</p>
                </div>
              </div>

              {review.wins.length === 0 ? (
                <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed p-10 text-center">
                  <NotebookPen className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
                  <p className="font-semibold">No wins recorded for {period.label}</p>
                  <p className="text-sm text-muted-foreground">Choose another period, or log a win to start building this one.</p>
                </div>
              ) : (
                <>
                  {review.withImpact < review.wins.length && (
                    <p className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-sm">
                      <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                      {review.wins.length - review.withImpact} of your wins have no impact noted. Adding what changed as a result makes them much stronger evidence.
                    </p>
                  )}

                  <section aria-labelledby="review-wins" className="space-y-4">
                    <h3 id="review-wins" className="font-bold">Wins by category</h3>
                    {review.byCategory.map((group) => {
                      const display = categoryDisplay(group.category, categories);
                      return (
                        <div key={group.category} className="rounded-xl border">
                          <div className="flex items-center gap-2 border-b px-4 py-3">
                            <span aria-hidden="true">{display.emoji}</span>
                            <span className="font-semibold">{group.category}</span>
                            <Badge variant="secondary" className="ml-auto">{group.wins.length}</Badge>
                          </div>
                          <ul className="divide-y">
                            {group.wins.map((w) => (
                              <li key={w.id} className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:gap-4">
                                <span className="w-16 shrink-0 text-sm text-muted-foreground">{format(parseISO(w.date), "MMM d")}</span>
                                <div className="min-w-0 flex-1 space-y-1">
                                  <p className="font-medium">{w.title}</p>
                                  {hasImpact(w) ? (
                                    <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Impact:</span> {w.impactNotes}</p>
                                  ) : (
                                    <p className="text-sm italic text-muted-foreground">No impact noted</p>
                                  )}
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })}
                  </section>
                </>
              )}

              <section aria-labelledby="review-reflections" className="space-y-3">
                <h3 id="review-reflections" className="font-bold flex items-center gap-2">
                  <BookOpen className="h-4 w-4" aria-hidden="true" />
                  Weekly reflections
                </h3>
                {review.reflections.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No reflections in this period. They're optional, but they add useful context to a review.</p>
                ) : (
                  <ul className="space-y-2">
                    {review.reflections.map((r) => (
                      <li key={r.id} className="rounded-xl border px-4 py-3 text-sm">
                        <p className="font-semibold">Week of {format(parseISO(r.weekStart), "MMM d, yyyy")}</p>
                        <p className="mt-1 text-muted-foreground line-clamp-2">{r.workSummary}</p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <div className="flex flex-col items-start justify-between gap-4 rounded-xl border bg-muted/20 p-5 md:flex-row md:items-center">
                <p className="text-sm text-muted-foreground max-w-lg">
                  The PDF includes every win above with its impact, grouped by category, followed by your weekly reflections for {period.label}.
                </p>
                <Button onClick={handleExport} disabled={isGenerating || review.wins.length === 0} className="gap-2">
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <Download className="h-4 w-4" aria-hidden="true" />}
                  Download review PDF
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
