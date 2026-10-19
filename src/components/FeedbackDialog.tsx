import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Bug, Lightbulb, Loader2, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { useAuth } from "@/contexts/AuthContext";
import { useCelebrate } from "@/contexts/CelebrationContext";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export type FeedbackType = "bug" | "idea" | "other";

const TYPES: { id: FeedbackType; label: string; icon: typeof Bug; prompt: string }[] = [
  { id: "bug", label: "Something's broken", icon: Bug, prompt: "What happened, and what did you expect instead?" },
  { id: "idea", label: "An idea", icon: Lightbulb, prompt: "What would make Winfolio better for you?" },
  { id: "other", label: "Something else", icon: MessageCircle, prompt: "What's on your mind?" },
];
const MAX_LENGTH = 2000;

/** Bug reports and ideas from inside the app. Only admins can read them (see firestore.rules). */
export function FeedbackDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { user, userProfile } = useAuth();
  const { pathname } = useLocation();
  const celebrate = useCelebrate();
  const [type, setType] = useState<FeedbackType>("bug");
  const [message, setMessage] = useState("");
  const [okToContact, setOkToContact] = useState(true);
  const [sending, setSending] = useState(false);

  // Start fresh each time it opens.
  useEffect(() => {
    if (open) {
      setType("bug");
      setMessage("");
      setOkToContact(true);
    }
  }, [open]);

  const current = TYPES.find((t) => t.id === type)!;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !message.trim()) return;
    setSending(true);
    try {
      await addDoc(collection(db, "appFeedback"), {
        userId: user.uid,
        userEmail: user.email ?? null,
        userName: userProfile?.fullName ?? null,
        type,
        message: message.trim().slice(0, MAX_LENGTH),
        // Context, so people don't have to describe where they were.
        page: pathname.slice(0, 300),
        userAgent: navigator.userAgent.slice(0, 500),
        viewport: `${window.innerWidth}x${window.innerHeight}`,
        okToContact,
        status: "new",
        createdAt: serverTimestamp(),
      });
      onOpenChange(false);
      celebrate("Thanks! Your feedback is on its way.", { pose: "thumbs", confetti: false });
    } catch (error) {
      console.error("Error sending feedback:", error);
      toast.error("Couldn't send that. Please try again.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle className="text-2xl font-extrabold tracking-tight">Send feedback</DialogTitle>
          <DialogDescription>Found a problem or have an idea? It goes straight to the Winfolio team.</DialogDescription>
        </DialogHeader>

        <form onSubmit={send} className="space-y-5">
          <div role="group" aria-label="Feedback type" className="grid gap-2 sm:grid-cols-3">
            {TYPES.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                aria-pressed={type === id}
                onClick={() => setType(id)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-left text-sm font-semibold transition-colors",
                  type === id ? "border-foreground bg-foreground text-background" : "border-border hover:bg-muted",
                )}
              >
                <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /> {label}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback-message" className="font-bold">{current.prompt}</Label>
            <Textarea
              id="feedback-message"
              autoFocus
              required
              maxLength={MAX_LENGTH}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[120px] resize-none"
            />
            <p className="text-xs text-muted-foreground">
              We'll also note which page you're on and your browser, to help us look into it.
            </p>
          </div>

          <div className="flex items-start gap-2">
            <Checkbox id="feedback-contact" checked={okToContact} onCheckedChange={(v) => setOkToContact(v === true)} className="mt-0.5" />
            <Label htmlFor="feedback-contact" className="text-sm font-normal leading-snug">
              It's OK to email me{user?.email ? ` at ${user.email}` : ""} about this
            </Label>
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => onOpenChange(false)} className="rounded-full px-5 py-2.5 font-semibold hover:bg-muted">
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending || !message.trim()}
              className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 font-bold text-background disabled:opacity-50"
            >
              {sending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              Send feedback
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
