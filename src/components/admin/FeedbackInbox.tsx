import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, orderBy, query, updateDoc, Timestamp } from "firebase/firestore";
import { formatDistanceToNow } from "date-fns";
import { Bug, Check, Lightbulb, Mail, MessageCircle, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface FeedbackItem {
  id: string;
  type: "bug" | "idea" | "other";
  message: string;
  status: "new" | "done";
  userName?: string | null;
  userEmail?: string | null;
  okToContact?: boolean;
  page?: string | null;
  userAgent?: string | null;
  viewport?: string | null;
  createdAt: Date | null;
}

const TYPE_META = {
  bug: { label: "Bug", icon: Bug, className: "bg-pastel-pink text-pastel-pink-ink" },
  idea: { label: "Idea", icon: Lightbulb, className: "bg-pastel-blue text-pastel-blue-ink" },
  other: { label: "Other", icon: MessageCircle, className: "bg-pastel-violet text-pastel-violet-ink" },
} as const;

const FILTERS = [
  { id: "new", label: "New" },
  { id: "done", label: "Done" },
  { id: "all", label: "All" },
] as const;
type Filter = (typeof FILTERS)[number]["id"];

// A short, readable browser/device label from the user agent.
function describeBrowser(ua?: string | null) {
  if (!ua) return null;
  const browser = /Edg\//.test(ua) ? "Edge" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "Browser";
  const device = /iPhone|iPad/.test(ua) ? "iOS" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "";
  return device ? `${browser} on ${device}` : browser;
}

/** Bug reports and ideas sent with "Send feedback". Admin-only (see firestore.rules). */
export function FeedbackInbox() {
  const [items, setItems] = useState<FeedbackItem[] | null>(null);
  const [filter, setFilter] = useState<Filter>("new");

  useEffect(() => {
    const q = query(collection(db, "appFeedback"), orderBy("createdAt", "desc"));
    return onSnapshot(
      q,
      (snapshot) => {
        setItems(snapshot.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id,
            ...data,
            createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : null,
          } as FeedbackItem;
        }));
      },
      (error) => {
        console.error("Error loading feedback:", error);
        toast.error("Couldn't load feedback");
        setItems([]);
      },
    );
  }, []);

  const setStatus = async (id: string, status: FeedbackItem["status"]) => {
    try {
      await updateDoc(doc(db, "appFeedback", id), { status });
    } catch (error) {
      console.error("Error updating feedback:", error);
      toast.error("Couldn't update that feedback");
    }
  };

  const newCount = items?.filter((i) => i.status === "new").length ?? 0;
  const shown = (items ?? []).filter((i) => filter === "all" || i.status === filter);

  return (
    <Card className="border-0 shadow-xl">
      <CardHeader className="flex flex-col justify-between gap-3 space-y-0 md:flex-row md:items-center">
        <div>
          <CardTitle>Feedback {newCount > 0 && <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{newCount} new</span>}</CardTitle>
          <CardDescription>Bug reports and ideas sent from inside Winfolio</CardDescription>
        </div>
        <div role="group" aria-label="Filter feedback" className="flex gap-1 self-start rounded-full bg-muted p-1">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                filter === f.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {items === null ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Loading feedback…</p>
        ) : shown.length === 0 ? (
          <p className="rounded-2xl border-2 border-dashed py-8 text-center text-sm text-muted-foreground">
            {filter === "new" ? "No new feedback. All caught up!" : "Nothing here yet."}
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {shown.map((item) => {
              const meta = TYPE_META[item.type] ?? TYPE_META.other;
              const Icon = meta.icon;
              const browser = describeBrowser(item.userAgent);
              return (
                <li key={item.id} className={cn("rounded-2xl border bg-card p-4", item.status === "done" && "opacity-70")}>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-sm">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold", meta.className)}>
                        <Icon className="h-3 w-3" aria-hidden="true" /> {meta.label}
                      </span>
                      <span className="font-semibold">{item.userName || item.userEmail || "Someone"}</span>
                      {item.createdAt && (
                        <span className="text-muted-foreground">{formatDistanceToNow(item.createdAt, { addSuffix: true })}</span>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {item.okToContact && item.userEmail && (
                        <a
                          href={`mailto:${item.userEmail}?subject=${encodeURIComponent("About your Winfolio feedback")}`}
                          className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted"
                        >
                          <Mail className="h-3 w-3" aria-hidden="true" /> Reply
                        </a>
                      )}
                      {item.status === "new" ? (
                        <button type="button" onClick={() => setStatus(item.id, "done")} className="inline-flex items-center gap-1 rounded-full bg-foreground px-3 py-1 text-xs font-bold text-background">
                          <Check className="h-3 w-3" aria-hidden="true" /> Mark done
                        </button>
                      ) : (
                        <button type="button" onClick={() => setStatus(item.id, "new")} className="inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold hover:bg-muted">
                          <RotateCcw className="h-3 w-3" aria-hidden="true" /> Reopen
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="mt-2 whitespace-pre-wrap text-sm">{item.message}</p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    {[item.page && `Page: ${item.page}`, browser, item.viewport && `Screen ${item.viewport}`,
                      item.okToContact ? "OK to contact" : "Prefers no contact"].filter(Boolean).join(" · ")}
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
