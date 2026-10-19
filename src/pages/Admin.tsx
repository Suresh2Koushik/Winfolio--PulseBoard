import { useCallback, useEffect, useMemo, useState } from "react";
import {
  collection,
  doc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useAuditLog } from "@/hooks/useAuditLog";
import { TEAMS_ENABLED } from "@/lib/features";
import { UserRole } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Users,
  TrendingUp,
  UserCheck,
  Shield,
  Download,
  Search,
  Loader2,
  ShieldCheck,
  Calendar,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import { format, startOfDay, subDays } from "date-fns";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts";
import { cn } from "@/lib/utils";
import { exportUserListToCSV } from "@/utils/exportUserData";

interface UserData {
  id: string;
  email: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  team?: string;
  managerId?: string | null;
  createdAt: string;
}

interface Analytics {
  totalUsers: number;
  newUsers30d: number;
  onboarded: number;
  admins: number;
  signupTimeline: Array<{ date: string; count: number }>;
}

const NO_MANAGER = "__none__";

export default function Admin() {
  const { user: currentUser } = useAuth();
  const { logAction } = useAuditLog();
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [users, setUsers] = useState<UserData[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Profiles only. Journal content (wins, reflections, goals) is private to each
      // user and not readable by admins (see firestore.rules).
      const usersSnapshot = await getDocs(collection(db, "users"));

      const userData: UserData[] = usersSnapshot.docs
        .map((d) => {
          const data = d.data();
          return {
            id: d.id,
            email: data.email || "",
            fullName: data.fullName || data.email || "User",
            avatarUrl: data.avatarUrl || undefined,
            role: (data.role || "employee") as UserRole,
            team: data.team || undefined,
            managerId: data.managerId ?? null,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || new Date(0).toISOString(),
          };
        })
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

      // Daily signups for the last 30 days, oldest first.
      const since = startOfDay(subDays(new Date(), 29));
      const perDay = new Map<string, number>();
      for (let i = 0; i < 30; i++) perDay.set(format(subDays(new Date(), 29 - i), "MMM dd"), 0);
      userData.forEach((u) => {
        const created = new Date(u.createdAt);
        if (created >= since) {
          const key = format(created, "MMM dd");
          perDay.set(key, (perDay.get(key) || 0) + 1);
        }
      });

      setUsers(userData);
      setAnalytics({
        totalUsers: userData.length,
        newUsers30d: userData.filter((u) => new Date(u.createdAt) >= since).length,
        onboarded: userData.filter((u) => u.team).length,
        admins: userData.filter((u) => u.role === "admin").length,
        signupTimeline: Array.from(perDay, ([date, count]) => ({ date, count })),
      });
    } catch (error) {
      console.error("Admin fetch error:", error);
      toast.error("Failed to load admin data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const managers = useMemo(
    () => users.filter((u) => u.role === "manager" || u.role === "admin"),
    [users]
  );
  const nameById = useMemo(() => new Map(users.map((u) => [u.id, u.fullName])), [users]);

  /**
   * Changing a role also maintains the manager directory (what employees pick from)
   * and, on demotion, detaches the person's reports so nobody points at a non-manager.
   */
  const changeRole = async (target: UserData, role: UserRole) => {
    if (role === target.role) return;
    if (target.id === currentUser?.uid) {
      toast.error("You can't change your own role. Ask another admin.");
      return;
    }
    const reports = users.filter((u) => u.managerId === target.id);
    const demoting = role === "employee";
    if (demoting && reports.length > 0 &&
      !confirm(`${target.fullName} manages ${reports.length} people. They will be unassigned. Continue?`)) {
      return;
    }

    setSavingId(target.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", target.id), { role, updatedAt: serverTimestamp() });
      if (demoting) {
        batch.delete(doc(db, "managerDirectory", target.id));
        reports.forEach((r) =>
          batch.update(doc(db, "users", r.id), { managerId: null, managerName: null, updatedAt: serverTimestamp() })
        );
      } else {
        batch.set(doc(db, "managerDirectory", target.id), {
          fullName: target.fullName.slice(0, 100),
          ...(target.team ? { team: target.team } : {}),
          updatedAt: serverTimestamp(),
        });
      }
      await batch.commit();
      logAction("profile_updated", "profile", target.id, { change: "role", from: target.role, to: role });

      setUsers((prev) => prev.map((u) => {
        if (u.id === target.id) return { ...u, role };
        if (demoting && u.managerId === target.id) return { ...u, managerId: null };
        return u;
      }));
      toast.success(`${target.fullName} is now ${role === "admin" ? "an admin" : `a ${role}`}`);
    } catch (error) {
      console.error("Role change failed:", error);
      toast.error("Failed to change role");
    } finally {
      setSavingId(null);
    }
  };

  const changeManager = async (target: UserData, managerId: string | null) => {
    if ((target.managerId ?? null) === managerId) return;
    setSavingId(target.id);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", target.id), {
        managerId,
        managerName: managerId ? (nameById.get(managerId) || "Manager").slice(0, 100) : null,
        updatedAt: serverTimestamp(),
      });
      await batch.commit();
      logAction("profile_updated", "profile", target.id, { change: "manager", to: managerId });
      setUsers((prev) => prev.map((u) => (u.id === target.id ? { ...u, managerId } : u)));
      toast.success("Manager updated. Their history becomes visible after their next sign-in.");
    } catch (error) {
      console.error("Manager change failed:", error);
      toast.error("Failed to change manager");
    } finally {
      setSavingId(null);
    }
  };

  // Managers created before the directory existed (or by hand in the console) need an entry
  // before employees can choose them. Run after reviewing the role column.
  const syncDirectory = async () => {
    if (managers.length === 0) {
      toast.info("No managers or admins to sync");
      return;
    }
    setSavingId("__directory__");
    try {
      const batch = writeBatch(db);
      managers.forEach((m) => batch.set(doc(db, "managerDirectory", m.id), {
        fullName: m.fullName.slice(0, 100),
        ...(m.team ? { team: m.team } : {}),
        updatedAt: serverTimestamp(),
      }));
      await batch.commit();
      toast.success(`Manager directory synced (${managers.length} people)`);
    } catch (error) {
      console.error("Directory sync failed:", error);
      toast.error("Failed to sync manager directory");
    } finally {
      setSavingId(null);
    }
  };

  const search = searchQuery.toLowerCase();
  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search) ||
      u.fullName.toLowerCase().includes(search) ||
      u.team?.toLowerCase().includes(search)
  );

  if (loading && !analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-background via-background to-secondary/20">
      <div className="p-4 md:p-6 max-w-7xl mx-auto animate-fade-in">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              <ShieldCheck className="h-3 w-3 mr-1" />
              Administrator
            </Badge>
            <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Admin
            </h1>
            <p className="text-muted-foreground text-sm">Manage people, roles and reporting lines</p>
          </div>
          <div className="flex gap-2">
            {TEAMS_ENABLED && (
              <Button variant="outline" onClick={syncDirectory} disabled={savingId !== null} className="gap-2">
                <Users className="h-4 w-4" />
                Sync manager directory
              </Button>
            )}
            <Button variant="outline" onClick={fetchData} disabled={loading} className="gap-2">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </header>

        {analytics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Total Users', value: analytics.totalUsers, icon: Users, color: 'text-primary', bg: 'bg-primary/10' },
                { label: 'New (30 days)', value: analytics.newUsers30d, icon: TrendingUp, color: 'text-success', bg: 'bg-success/10' },
                { label: 'Finished onboarding', value: analytics.onboarded, icon: UserCheck, color: 'text-info', bg: 'bg-info/10' },
                { label: 'Admins', value: analytics.admins, icon: Shield, color: 'text-accent', bg: 'bg-accent/10' },
              ].map((stat) => (
                <Card key={stat.label} className="border-0 shadow-lg">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.label}</CardTitle>
                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                      <stat.icon className={cn("h-4 w-4", stat.color)} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stat.value}</div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader>
                <CardTitle>Signups</CardTitle>
                <CardDescription>New accounts per day, last 30 days</CardDescription>
              </CardHeader>
              <CardContent className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics.signupTimeline}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted))" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} interval={4} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                    <Area type="monotone" dataKey="count" name="Signups" stroke="hsl(var(--primary))" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-xl overflow-hidden">
              <CardHeader className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <CardTitle>People</CardTitle>
                  <CardDescription>
                    {TEAMS_ENABLED ? "Promote managers and set who reports to whom. Employees can only see managers listed here." : "Account roles. Admins see profile details only; nobody can read another person's journal."}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                  <div className="relative flex-1 md:flex-none">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Filter users..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10 h-10 md:w-[250px]"
                    />
                  </div>
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => {
                      exportUserListToCSV(filteredUsers);
                      toast.success("User list downloaded!");
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="min-w-[240px]">User</TableHead>
                      <TableHead>Role</TableHead>
                      {TEAMS_ENABLED && <TableHead>Reports to</TableHead>}
                      <TableHead>Team</TableHead>
                      <TableHead>Joined</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((u) => {
                      const isSelf = u.id === currentUser?.uid;
                      const saving = savingId === u.id;
                      return (
                        <TableRow key={u.id} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9 border-2 border-background shadow-sm">
                                <AvatarImage src={u.avatarUrl} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {u.fullName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold truncate">{u.fullName}{isSelf && " (you)"}</span>
                                <span className="text-xs text-muted-foreground truncate">{u.email}</span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              value={u.role}
                              disabled={isSelf || saving}
                              onValueChange={(role) => changeRole(u, role as UserRole)}
                            >
                              <SelectTrigger className="h-9 w-[130px]" aria-label={`Role for ${u.fullName}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="employee">Employee</SelectItem>
                                {(TEAMS_ENABLED || u.role === "manager") && <SelectItem value="manager">Manager</SelectItem>}
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          {TEAMS_ENABLED && (
                          <TableCell>
                            <Select
                              value={u.managerId ?? NO_MANAGER}
                              disabled={saving}
                              onValueChange={(value) => changeManager(u, value === NO_MANAGER ? null : value)}
                            >
                              <SelectTrigger className="h-9 w-[180px]" aria-label={`Manager for ${u.fullName}`}>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value={NO_MANAGER}>No manager</SelectItem>
                                {managers.filter((m) => m.id !== u.id).map((m) => (
                                  <SelectItem key={m.id} value={m.id}>{m.fullName}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </TableCell>
                          )}
                          <TableCell>
                            <span className="text-sm font-medium">{u.team || '—'}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="h-3 w-3" />
                              <span className="text-xs whitespace-nowrap">{format(new Date(u.createdAt), 'MMM d, yyyy')}</span>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
