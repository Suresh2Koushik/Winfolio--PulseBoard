import { useMemo } from "react";
import { Activity } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";

const COLORS = [
  "hsl(252, 87%, 58%)",  // primary purple
  "hsl(280, 85%, 65%)",  // accent magenta
  "hsl(210, 80%, 58%)",  // blue
  "hsl(145, 60%, 50%)",  // green
  "hsl(35, 85%, 55%)",   // amber
  "hsl(340, 75%, 60%)",  // rose
  "hsl(190, 70%, 50%)",  // teal
  "hsl(15, 80%, 55%)",   // orange
];

interface DashboardChartsProps {
  activities: Activity[];
  goalStats: {
    total: number;
    completed: number;
    onTrack: number;
    atRisk: number;
    behind: number;
  };
}

export function DashboardCharts({ activities, goalStats }: DashboardChartsProps) {
  // Last 8 weeks activity trend
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const weeks: { week: string; count: number }[] = [];
    for (let i = 7; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i * 7);
      const weekStart = new Date(d);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const count = activities.filter((a) => {
        const ad = new Date(a.date);
        return ad >= weekStart && ad <= weekEnd;
      }).length;
      const label = `W${Math.ceil((weekStart.getDate() + weekStart.getDay()) / 7)}`;
      weeks.push({ week: `${weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`, count });
    }
    return weeks;
  }, [activities]);

  // Category distribution
  const categoryData = useMemo(() => {
    const map: Record<string, number> = {};
    activities.forEach((a) => {
      map[a.category] = (map[a.category] || 0) + 1;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [activities]);

  // Goal status distribution
  const goalData = useMemo(() => {
    return [
      { name: "Completed", value: goalStats.completed, color: "hsl(145, 65%, 50%)" },
      { name: "On Track", value: goalStats.onTrack, color: "hsl(210, 80%, 58%)" },
      { name: "At Risk", value: goalStats.atRisk, color: "hsl(38, 92%, 50%)" },
      { name: "Behind", value: goalStats.behind, color: "hsl(0, 84%, 60%)" },
    ].filter((d) => d.value > 0);
  }, [goalStats]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-sm text-primary font-bold">{payload[0].value} activities</p>
        </div>
      );
    }
    return null;
  };

  const PieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="rounded-lg border bg-background/95 backdrop-blur-sm p-3 shadow-xl">
          <p className="text-sm font-medium">{payload[0].name}</p>
          <p className="text-sm font-bold" style={{ color: payload[0].payload.fill || payload[0].payload.color }}>
            {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Activity Trend - Area Chart */}
      <Card className="card-glass border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Activity Trend</CardTitle>
          <CardDescription className="text-xs">Last 8 weeks performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="activityGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(252, 87%, 58%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(252, 87%, 58%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(252, 87%, 58%)"
                  strokeWidth={2.5}
                  fill="url(#activityGradient)"
                  dot={{ r: 4, fill: "hsl(252, 87%, 58%)", stroke: "hsl(var(--background))", strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: "hsl(252, 87%, 58%)", strokeWidth: 2, fill: "hsl(var(--background))" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Category Breakdown - Bar Chart */}
      <Card className="card-glass border-0 shadow-lg">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Category Breakdown</CardTitle>
          <CardDescription className="text-xs">Activities by category this period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[220px]">
            {categoryData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No activities yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} angle={-20} textAnchor="end" height={50} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={40}>
                    {categoryData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Goal Progress - Pie Chart */}
      {goalStats.total > 0 && (
        <Card className="card-glass border-0 shadow-lg lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Goal Progress Overview</CardTitle>
            <CardDescription className="text-xs">{goalStats.total} total goals</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center gap-8">
              <div className="h-[180px] w-[180px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={goalData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                      stroke="none"
                    >
                      {goalData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<PieTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {goalData.map((item) => (
                  <div key={item.name} className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                    <span className="text-sm font-bold ml-auto">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
