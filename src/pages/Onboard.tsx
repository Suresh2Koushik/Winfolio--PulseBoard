import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { db } from "@/lib/firebase";
import { doc, updateDoc, serverTimestamp, collection, getDocs, query, where, addDoc } from "firebase/firestore";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { JobFunction } from "@/types";
import { categoriesForRole, JOB_FUNCTIONS, TEAM_OPTIONS } from "@/lib/categories";
import { Plus, Trash2, Sparkles, Target, Users, CheckCircle2, ChevronRight, Loader2, Rocket } from "lucide-react";
import { cn } from "@/lib/utils";
import { TEAMS_ENABLED } from "@/lib/features";

export default function Onboard() {
  const navigate = useNavigate();
  const { user, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Profile state
  const [team, setTeam] = useState(userProfile?.team || "");
  const [managerId, setManagerId] = useState(userProfile?.managerId || "");
  const [jobFunction, setJobFunction] = useState<JobFunction>(userProfile?.jobFunction || "general");
  const recommended = categoriesForRole(jobFunction);
  const jobFunctionLabel = JOB_FUNCTIONS.find(j => j.id === jobFunction)?.label ?? "General";
  const [managers, setManagers] = useState<{ id: string; name: string }[]>([]);

  // Categories & Teams state
  const [customTeams, setCustomTeams] = useState<string[]>([]);
  const [newTeam, setNewTeam] = useState("");

  useEffect(() => {
    if (!TEAMS_ENABLED) return;
    const fetchManagers = async () => {
      try {
        // Names only; the directory is maintained by admins when they grant manager access.
        const snapshot = await getDocs(collection(db, "managerDirectory"));
        setManagers(
          snapshot.docs
            .filter(d => d.id !== user?.uid)
            .map(d => ({ id: d.id, name: d.data().fullName || "Manager" }))
            .sort((a, b) => a.name.localeCompare(b.name))
        );
      } catch (error) {
        console.error("Error fetching managers:", error);
      }
    };
    fetchManagers();
  }, [user?.uid]);

  const handleCompleteProfile = async () => {
    if (!user) return;
    const teamName = team.trim();
    if (!teamName) {
      toast.error("Please enter your team name");
      return;
    }

    setLoading(true);
    try {
      const selectedManager = managers.find(m => m.id === managerId);

      await updateDoc(doc(db, "users", user.uid), {
        team: teamName.slice(0, 100),
        jobFunction,
        // Individual mode never assigns a manager.
        ...(TEAMS_ENABLED ? {
          managerId: selectedManager ? selectedManager.id : null,
          managerName: selectedManager ? selectedManager.name : null,
        } : {}),
        updatedAt: serverTimestamp(),
      });

      setStep(2);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Only add what's missing, so re-running onboarding never creates duplicates.
      const [existingCategories, existingTeams] = await Promise.all([
        getDocs(query(collection(db, "userCategories"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "userTeams"), where("userId", "==", user.uid))),
      ]);
      const haveCategory = new Set(existingCategories.docs.map(d => d.data().name));
      const haveTeam = new Set(existingTeams.docs.map(d => d.data().name));

      const categoryPromises = recommended
        .filter(cat => !haveCategory.has(cat.name))
        .map(cat =>
          addDoc(collection(db, "userCategories"), {
            userId: user.uid,
            name: cat.name,
            emoji: cat.emoji,
            color: cat.color,
            keywords: cat.keywords,
            createdAt: serverTimestamp(),
          })
        );

      const allTeams = Array.from(new Set([...TEAM_OPTIONS, ...customTeams]));
      const teamPromises = allTeams
        .filter(name => !haveTeam.has(name))
        .map(name =>
          addDoc(collection(db, "userTeams"), {
            userId: user.uid,
            name,
            createdAt: serverTimestamp(),
          })
        );

      await Promise.all([...categoryPromises, ...teamPromises]);

      toast.success("All set! Welcome to Winfolio.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error completing setup:", error);
      toast.error("Failed to complete setup");
    } finally {
      setLoading(false);
    }
  };

  const addCustomTeam = () => {
    if (newTeam.trim() && !customTeams.includes(newTeam.trim())) {
      setCustomTeams([...customTeams, newTeam.trim()]);
      setNewTeam("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full space-y-8 animate-fade-in">
        <div className="text-center space-y-4">
          <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
            <Sparkles className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Let's get you started
          </h1>
          <p className="text-muted-foreground text-lg">
            A few quick details and you're ready to save your first win.
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center gap-4">
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all",
                i === step ? "bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-110" :
                  i < step ? "bg-success text-background" : "bg-muted text-muted-foreground"
              )}>
                {i < step ? <CheckCircle2 className="h-5 w-5" /> : i}
              </div>
              <div className={cn(
                "h-1 w-16 rounded-full",
                i < step ? "bg-success" : "bg-muted"
              )} />
            </div>
          ))}
        </div>

        {step === 1 && (
          <Card className="border-0 shadow-2xl glass-dark">
            <CardHeader>
              <CardTitle>Profile Setup</CardTitle>
              <CardDescription>{TEAMS_ENABLED ? "Tell us where you work and who you report to." : "Tell us a little about your work."}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="team">Team Name *</Label>
                <Input
                  id="team"
                  value={team}
                  onChange={e => setTeam(e.target.value)}
                  placeholder="e.g. Engineering, Sales, Product"
                  className="h-12"
                />
              </div>

              <div className="space-y-2">
                <Label>What's your role?</Label>
                <Select value={jobFunction} onValueChange={(v) => setJobFunction(v as JobFunction)}>
                  <SelectTrigger className="h-12" aria-label="Your role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {JOB_FUNCTIONS.map(j => (
                      <SelectItem key={j.id} value={j.id}>{j.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">We use this to suggest the right category as you log work.</p>
              </div>

              {TEAMS_ENABLED && (
              <div className="space-y-2">
                <Label>Your Manager (Optional)</Label>
                <Select value={managerId} onValueChange={setManagerId}>
                  <SelectTrigger className="h-12" aria-label="Your manager">
                    <SelectValue placeholder="Select your manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.length === 0 ? (
                      <div className="p-2 text-center text-sm text-muted-foreground">No managers yet. You can set one later from "Edit profile" in your account menu.</div>
                    ) : (
                      managers.map(m => (
                        <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Managers can see your check-ins and provide feedback.</p>
              </div>
              )}

              <Button onClick={handleCompleteProfile} className="w-full h-12 gap-2" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Next Step <ChevronRight className="h-4 w-4" /></>}
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-0 shadow-2xl glass-dark">
            <CardHeader>
              <CardTitle>Your Categories & Teams</CardTitle>
              <CardDescription>
                These match the sections of a typical performance review. You can rename, add or remove them anytime in Dashboard → Settings.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                  <CheckCircle2 className="h-4 w-4" />
                  Categories tuned for {jobFunctionLabel}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {recommended.map(cat => (
                    <div key={cat.name} className="p-2 rounded-lg bg-muted/50 border text-xs flex items-center gap-2">
                      {cat.emoji} {cat.name}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <Label>Teams you work with</Label>
                <div className="flex flex-wrap gap-2 mb-3">
                  {TEAM_OPTIONS.map(name => (
                    <Badge key={name} variant="secondary" className="px-3 py-1">{name}</Badge>
                  ))}
                  {customTeams.map((name, i) => (
                    <Badge key={i} variant="outline" className="px-3 py-1 flex items-center gap-1 border-primary/30">
                      {name}
                      <Trash2 className="h-3 w-3 cursor-pointer text-destructive" onClick={() => setCustomTeams(customTeams.filter((_, idx) => idx !== i))} />
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTeam}
                    onChange={e => setNewTeam(e.target.value)}
                    placeholder="Add custom team..."
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomTeam(); } }}
                  />
                  <Button variant="outline" size="icon" onClick={addCustomTeam}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setStep(1)} className="flex-1 h-12">Back</Button>
                <Button onClick={handleFinalize} className="flex-1 h-12 gap-2 shadow-lg shadow-primary/20" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Complete Setup <Rocket className="h-4 w-4" /></>}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

