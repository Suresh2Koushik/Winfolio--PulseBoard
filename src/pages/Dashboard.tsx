import { useState, useEffect } from "react";
import { Activity, DEFAULT_CATEGORIES } from "@/types";
import { useActivities } from "@/hooks/useActivities";
import { useUserData } from "@/hooks/useUserData";
import { useCheckIns } from "@/hooks/useCheckIns";
import { useGoals } from "@/hooks/useGoals";
import { useFeedback } from "@/hooks/useFeedback";
import { exportToExcel } from "@/utils/exportData";
import { generateExcelTemplate } from "@/utils/importData";
import { toast } from "sonner";
import { getWeekNumber } from "@/utils/categorization";
import { StatsCard } from "@/components/StatsCard";
import { ActivityCard } from "@/components/ActivityCard";
import { ActivityForm } from "@/components/ActivityForm";
import { UploadModal } from "@/components/UploadModal";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Plus,
  Search,
  Calendar,
  TrendingUp,
  BarChart3,
  Target,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
  CheckCircle2,
  Clock,
  Sparkles,
  LayoutDashboard,
  MessageSquare,
  CalendarDays,
  FolderTree,
  Settings2,
} from "lucide-react";
import { WeeklyView } from "./WeeklyView";
import { QuarterView } from "./QuarterView";
import { CategoryView } from "./CategoryView";
import { ReviewGenerator } from "./ReviewGenerator";
import { CategoryManagement } from "@/components/CategoryManagement";
import { AlertsPanel } from "@/components/AlertsPanel";
import { DashboardCharts } from "@/components/DashboardCharts";
import { ChangeLogDisplay, WhatsNewBanner } from "@/components/ChangeLogDisplay";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";


export default function Dashboard() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { activities, loading: loadingActivities, addActivity, updateActivity, deleteActivity: deleteActivityMutation, refetch } = useActivities();
  const { categories, teams } = useUserData();
  const { checkIns, loading: loadingCheckIns } = useCheckIns();
  const { goals, stats: goalStats, loading: loadingGoals } = useGoals();
  const { actionItems, stats: feedbackStats, loading: loadingFeedback } = useFeedback();

  const [formOpen, setFormOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");

  const loading = loadingActivities || loadingCheckIns || loadingGoals || loadingFeedback;

  const handleSave = async (activityData: Omit<Activity, "id" | "userId" | "createdAt" | "updatedAt">) => {
    if (editingActivity) {
      await updateActivity(editingActivity.id, activityData);
      setEditingActivity(null);
    } else {
      await addActivity(activityData);
    }
    setFormOpen(false);
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this activity?")) {
      await deleteActivityMutation(id);
    }
  };

  const currentWeek = getWeekNumber(new Date());
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const weekActivities = activities.filter((a) => a.weekNumber === currentWeek && new Date(a.date).getFullYear() === currentYear);
  const monthActivities = activities.filter((a) => {
    const date = new Date(a.date);
    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });

  const categoryCount = monthActivities.reduce((acc, activity) => {
    acc[activity.category] = (acc[activity.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostActiveCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "None";

  const filteredActivities = activities.filter(
    (activity) =>
      activity.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentActivities = filteredActivities.slice(0, 5);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <WhatsNewBanner />

        {/* Welcome Banner */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs border-primary/20 text-primary">
              {userProfile?.role === 'manager' ? 'Manager Access' : 'Employee Portal'}
            </Badge>
            {userProfile?.team && (
              <Badge variant="outline" className="text-xs">
                {userProfile.team}
              </Badge>
            )}
          </div>
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary via-primary/80 to-accent bg-clip-text text-transparent">
            Welcome back, {userProfile?.fullName?.split(' ')[0] || 'User'}
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Track your performance and reach your goals</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:w-auto overflow-x-auto h-auto p-1 gap-1">
            <TabsTrigger value="overview" className="gap-2">
              <LayoutDashboard className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="activities" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Activities
            </TabsTrigger>
            <TabsTrigger value="quarter" className="gap-2">
              <Calendar className="h-4 w-4" />
              Quarter
            </TabsTrigger>
            <TabsTrigger value="review" className="gap-2">
              <Sparkles className="h-4 w-4" />
              Reviews
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 animate-fade-in">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatsCard
                title="Weekly Activities"
                value={weekActivities.length}
                icon={Calendar}
                trend={`Week ${currentWeek}`}
              />
              <StatsCard
                title="Goals on Track"
                value={goalStats.onTrack}
                icon={Target}
                trend={`${goalStats.completed} completed`}
              />
              <StatsCard
                title="Active Goals"
                value={goalStats.total - goalStats.completed}
                icon={TrendingUp}
                trend={`${goalStats.atRisk} at risk`}
              />
              <StatsCard
                title="Pending Feedback"
                value={feedbackStats.unacknowledged}
                icon={MessageSquare}
                trend={`${feedbackStats.openActionItems} action items`}
              />
            </div>

            {/* Analytics Charts */}
            <DashboardCharts activities={activities} goalStats={goalStats} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <AlertsPanel
                  checkIns={checkIns}
                  goals={goals}
                  actionItems={actionItems}
                />

                <Card className="card-glass border-0 shadow-xl overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <div>
                      <CardTitle>Recent Impact</CardTitle>
                      <CardDescription>Your latest tracked work activities</CardDescription>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setActiveTab('activities')}>
                      View All
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {recentActivities.length === 0 ? (
                        <div className="text-center py-8">
                          <p className="text-muted-foreground mb-4">No recent activities found.</p>
                          <Button onClick={() => setFormOpen(true)}>Add Your First Activity</Button>
                        </div>
                      ) : (
                        recentActivities.map((activity) => (
                          <ActivityCard key={activity.id} activity={activity} onEdit={handleEdit} onDelete={handleDelete} />
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <ChangeLogDisplay />

                <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/10">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Quick Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button onClick={() => setFormOpen(true)} className="w-full justify-start gap-2 h-11 shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" />
                      Add Work Activity
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/check-ins')} className="w-full justify-start gap-2 h-11">
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Weekly Check-In
                    </Button>
                    <Button variant="outline" onClick={() => navigate('/goals')} className="w-full justify-start gap-2 h-11">
                      <Target className="h-4 w-4" />
                      View Performance Goals
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="activities" className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search activities..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const categoryNames = categories.map((c) => c.name);
                    generateExcelTemplate(categoryNames, teams);
                    toast.success("Template downloaded!");
                  }}
                  className="gap-2 hidden md:flex"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  Template
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setUploadOpen(true)}
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    exportToExcel(activities);
                    toast.success("Excel file downloaded!");
                  }}
                  className="gap-2"
                  disabled={activities.length === 0}
                >
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button size="sm" onClick={() => setFormOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add New
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              {filteredActivities.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed rounded-xl">
                  <p className="text-muted-foreground">No matching activities found.</p>
                </div>
              ) : (
                filteredActivities.map((activity) => (
                  <ActivityCard key={activity.id} activity={activity} onEdit={handleEdit} onDelete={handleDelete} />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="quarter">
            <QuarterView activities={activities} onEdit={handleEdit} onDelete={handleDelete} />
          </TabsContent>

          <TabsContent value="review">
            <ReviewGenerator activities={activities} />
          </TabsContent>
        </Tabs>

        <ActivityForm open={formOpen} onOpenChange={setFormOpen} onSave={handleSave} editActivity={editingActivity} />
        <UploadModal
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onImportComplete={() => {
            refetch();
            toast.success("Activities imported successfully!");
          }}
        />
      </div>
    </div>
  );
}
