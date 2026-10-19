import { useState } from "react";
import { Activity } from "@/types";
import { categoryDisplay } from "@/lib/categories";
import { useUserData } from "@/hooks/useUserData";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  Download,
  FileText,
  Calendar,
  CheckCircle2,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, subMonths } from "date-fns";
import { toast } from "sonner";
import { exportToPDF } from "@/utils/pdfExport";

interface ReviewGeneratorProps {
  activities: Activity[];
}

export function ReviewGenerator({ activities }: ReviewGeneratorProps) {
  const [selectedMonth, setSelectedMonth] = useState(() => format(new Date(), "yyyy-MM"));
  const [isGenerating, setIsGenerating] = useState(false);
  const { categories } = useUserData();

  // Step back from the 1st of this month so the 29th-31st can't skip or repeat months.
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = subMonths(startOfMonth(new Date()), i);
    return {
      label: format(d, "MMMM yyyy"),
      value: format(d, "yyyy-MM"),
    };
  });

  const monthStart = startOfMonth(parseISO(`${selectedMonth}-01`));
  const monthEnd = endOfMonth(monthStart);

  const filteredActivities = activities.filter(activity => {
    const activityDate = parseISO(activity.date);
    return isWithinInterval(activityDate, { start: monthStart, end: monthEnd });
  });

  const stats = {
    total: filteredActivities.length,
    completed: filteredActivities.filter(a => a.status === 'Done').length,
    impactful: filteredActivities.filter(a => a.impactNotes?.length > 0).length,
    categories: filteredActivities.reduce((acc, a) => {
      acc[a.category] = (acc[a.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  };

  const currentMonthLabel = months.find(m => m.value === selectedMonth)?.label || "Selected Month";

  const handleExport = async () => {
    if (filteredActivities.length === 0) {
      toast.error("No activities found for this period");
      return;
    }

    setIsGenerating(true);
    try {
      await exportToPDF(filteredActivities, currentMonthLabel);
      toast.success("Performance report generated!");
    } catch (error) {
      console.error("PDF Export error:", error);
      toast.error("Failed to generate PDF. Make sure dependencies are installed.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="card-glass border-0 shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-6 text-white">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6" />
                Performance Review Report
              </CardTitle>
              <CardDescription className="text-white/80 mt-1">
                Generate professional monthly impact reports from your tracked activities.
              </CardDescription>
            </div>
            <div className="flex items-center gap-3 bg-white/10 p-2 rounded-xl backdrop-blur-md">
              <Label htmlFor="month-select" className="text-sm font-medium whitespace-nowrap">Report Period:</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger id="month-select" className="w-[180px] bg-transparent border-white/20 text-white focus:ring-white/30">
                  <SelectValue placeholder="Select month" />
                </SelectTrigger>
                <SelectContent>
                  {months.map(m => (
                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-muted/30 border-0 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Monthly Items</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </Card>
            <Card className="bg-muted/30 border-0 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Completion Rate</p>
                <p className="text-2xl font-bold">{stats.total ? Math.round((stats.completed / stats.total) * 100) : 0}%</p>
              </div>
            </Card>
            <Card className="bg-muted/30 border-0 p-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Impactful Work</p>
                <p className="text-2xl font-bold">{stats.impactful}</p>
              </div>
            </Card>
          </div>

          <div className="space-y-4">
            <h4 className="font-bold flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" />
              Activities for {currentMonthLabel}
            </h4>

            <div className="border rounded-xl divide-y overflow-hidden bg-white/50">
              {filteredActivities.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground italic">
                  No activities recorded for this period. Try tracking some work in the Dashboard.
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/10 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg">{categoryDisplay(activity.category, categories).emoji}</span>
                        <h5 className="font-bold truncate">{activity.title}</h5>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-1">{activity.description}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 md:justify-end shrink-0">
                      <Badge variant="secondary" className="capitalize text-[10px] font-bold">
                        {activity.category}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {format(parseISO(activity.date), "MMM dd")}
                      </Badge>
                      <Badge
                        variant={activity.status === 'Done' ? 'default' : 'secondary'}
                        className={`text-[10px] font-bold ${activity.status === 'Done' ? 'bg-success hover:bg-success/80' : ''}`}
                      >
                        {activity.status}
                      </Badge>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col md:flex-row justify-between items-center gap-6 p-6 rounded-2xl bg-secondary/20 border border-secondary/30">
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <AlertCircle className="h-5 w-5 text-primary" />
              </div>
              <div className="max-w-md">
                <p className="font-bold text-sm">Ready for Review?</p>
                <p className="text-xs text-muted-foreground mt-1">
                  The PDF includes a summary of your month, a status breakdown, and a full activity ledger.
                </p>
              </div>
            </div>
            <Button
              onClick={handleExport}
              disabled={isGenerating || filteredActivities.length === 0}
              className="gap-2 h-12 px-8 shadow-xl shadow-primary/20 transition-all hover:scale-105"
            >
              {isGenerating ? "Processing..." : (
                <>
                  <Download className="h-4 w-4" />
                  Generate Performance PDF
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
