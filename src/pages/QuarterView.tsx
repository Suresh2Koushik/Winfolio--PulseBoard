import { Activity } from "@/types";
import { Card } from "@/components/ui/card";
import { ActivityCard } from "@/components/ActivityCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { parseISO } from "date-fns";

interface QuarterViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

const QUARTERS = ["Q1", "Q2", "Q3", "Q4"];
const CURRENT_YEAR = new Date().getFullYear();
const CURRENT_QUARTER = `Q${Math.floor(new Date().getMonth() / 3) + 1}`;

export function QuarterView({ activities, onEdit, onDelete }: QuarterViewProps) {
  const [selectedQuarter, setSelectedQuarter] = useState(CURRENT_QUARTER);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);

  // Get available years from activities
  const years = Array.from(new Set(activities.map(a => parseISO(a.date).getFullYear()))).sort((a, b) => b - a);
  if (!years.includes(CURRENT_YEAR)) years.unshift(CURRENT_YEAR);

  // Filter activities for selected quarter and year
  const filteredActivities = activities.filter((activity) => {
    const activityDate = parseISO(activity.date);
    const activityYear = activityDate.getFullYear();
    const activityMonth = activityDate.getMonth();
    const activityQuarter = `Q${Math.floor(activityMonth / 3) + 1}`;

    // Check if activity has explicit quarter or falls in date range
    if (activity.quarter) {
      return activity.quarter === selectedQuarter && activityYear === selectedYear;
    }
    return activityQuarter === selectedQuarter && activityYear === selectedYear;
  });

  // Group by month within quarter
  const monthsInQuarter = {
    Q1: ["January", "February", "March"],
    Q2: ["April", "May", "June"],
    Q3: ["July", "August", "September"],
    Q4: ["October", "November", "December"]
  };

  const groupedByMonth = monthsInQuarter[selectedQuarter as keyof typeof monthsInQuarter].reduce((acc, month, idx) => {
    const monthNum = QUARTERS.indexOf(selectedQuarter) * 3 + idx;
    acc[month] = filteredActivities.filter(a => {
      const activityMonth = parseISO(a.date).getMonth();
      return activityMonth === monthNum;
    });
    return acc;
  }, {} as Record<string, Activity[]>);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Quarter View</h2>
          <p className="text-muted-foreground">View activities organized by quarter</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(Number(value))}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUARTERS.map((quarter) => (
                <SelectItem key={quarter} value={quarter}>
                  {quarter} {selectedYear}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">
            {selectedQuarter} {selectedYear}
          </h3>
          <Badge variant="outline">{filteredActivities.length} activities</Badge>
        </div>

        <div className="space-y-6">
          {Object.entries(groupedByMonth).map(([month, monthActivities]) => (
            <div key={month}>
              <div className="flex items-center gap-2 mb-3">
                <h4 className="font-medium text-muted-foreground">{month}</h4>
                <Badge variant="secondary" className="text-xs">{monthActivities.length}</Badge>
              </div>
              {monthActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic ml-4">No activities this month</p>
              ) : (
                <div className="space-y-3">
                  {monthActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
