import { useState } from "react";
import { Activity, CategoryType, ActivityStatus } from "@/types";
import { ActivityCard } from "@/components/ActivityCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format, startOfWeek, addDays } from "date-fns";
import { CATEGORIES } from "@/types";

interface WeeklyViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function WeeklyView({ activities, onEdit, onDelete }: WeeklyViewProps) {
  const [selectedWeek, setSelectedWeek] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-W${String(Math.ceil(now.getDate() / 7)).padStart(2, "0")}`;
  });
  const [filterCategory, setFilterCategory] = useState<CategoryType | "All">("All");
  const [filterStatus, setFilterStatus] = useState<ActivityStatus | "All">("All");

  const weeks = Array.from({ length: 52 }, (_, i) => {
    const year = new Date().getFullYear();
    return `${year}-W${String(i + 1).padStart(2, "0")}`;
  });

  const [year, weekStr] = selectedWeek.split("-W");
  const weekNumber = parseInt(weekStr);

  const filteredActivities = activities.filter((activity) => {
    const activityYear = new Date(activity.date).getFullYear();
    const matchesWeek = activity.weekNumber === weekNumber && activityYear === parseInt(year);
    const matchesCategory = filterCategory === "All" || activity.category === filterCategory;
    const matchesStatus = filterStatus === "All" || activity.status === filterStatus;
    return matchesWeek && matchesCategory && matchesStatus;
  });

  const groupedByDay = filteredActivities.reduce((acc, activity) => {
    const day = format(new Date(activity.date), "yyyy-MM-dd");
    if (!acc[day]) acc[day] = [];
    acc[day].push(activity);
    return acc;
  }, {} as Record<string, Activity[]>);

  const weekStart = startOfWeek(new Date(parseInt(year), 0, (weekNumber - 1) * 7 + 1), { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Select value={selectedWeek} onValueChange={setSelectedWeek}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {weeks.map((week) => (
              <SelectItem key={week} value={week}>
                {week.replace("-W", " Week ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterCategory} onValueChange={(value) => setFilterCategory(value as CategoryType | "All")}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.name} value={cat.name}>
                {cat.emoji} {cat.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={filterStatus} onValueChange={(value) => setFilterStatus(value as ActivityStatus | "All")}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="All">All Statuses</SelectItem>
            <SelectItem value="Not Started">Not Started</SelectItem>
            <SelectItem value="In Progress">In Progress</SelectItem>
            <SelectItem value="Done">Done</SelectItem>
            <SelectItem value="Blocked">Blocked</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex-1" />
        <Badge variant="outline" className="h-10 px-4 flex items-center">
          {filteredActivities.length} activities
        </Badge>
      </div>

      <div className="grid gap-4">
        {weekDays.map((day) => {
          const dayKey = format(day, "yyyy-MM-dd");
          const dayActivities = groupedByDay[dayKey] || [];

          return (
            <Card key={dayKey} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-lg font-semibold">{format(day, "EEEE, MMM d")}</h3>
                {dayActivities.length > 0 && (
                  <Badge variant="secondary">{dayActivities.length}</Badge>
                )}
              </div>

              {dayActivities.length === 0 ? (
                <p className="text-sm text-muted-foreground italic">No activities this day</p>
              ) : (
                <div className="space-y-3">
                  {dayActivities.map((activity) => (
                    <ActivityCard key={activity.id} activity={activity} onEdit={onEdit} onDelete={onDelete} />
                  ))}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
