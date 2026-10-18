import { Activity } from "@/types";
import { storage } from "@/lib/firebase";
import { ref, getDownloadURL } from "firebase/storage";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CATEGORIES } from "@/types";
import { useUserData } from "@/hooks/useUserData";
import { Pencil, Trash2, Calendar, Award, FileText, Download, Users } from "lucide-react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ActivityCardProps {
  activity: Activity;
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function ActivityCard({ activity, onEdit, onDelete }: ActivityCardProps) {
  const { categories } = useUserData();

  // Find category info safely
  const categoryInfo = categories.find(c => c.name === activity.category) ||
    CATEGORIES.find(c => c.name === activity.category) ||
    { name: activity.category, emoji: '🔹', color: 'hsl(220 15% 60%)' };

  const handleDownloadAttachment = async () => {
    if (!activity.attachmentUrl) return;

    // Open the tab synchronously so pop-up blockers allow it, then point it at the file.
    // ('noopener' would make window.open return null, so detach the opener manually.)
    const tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    try {
      const value = activity.attachmentUrl;
      let url: string;
      if (value.startsWith('activities/')) {
        url = await getDownloadURL(ref(storage, value));
      } else {
        // Imported rows may carry an external link; only allow http(s).
        const parsed = new URL(value);
        if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') throw new Error('Unsupported link');
        url = parsed.toString();
      }
      if (tab) tab.location.href = url;
      else window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
      tab?.close();
      toast.error("Failed to access attachment");
      console.error("Download error:", error);
    }
  };

  return (
    <Card className="p-5 border-l-4 card-glass card-hover group" style={{ borderLeftColor: categoryInfo.color }}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-2xl p-2 rounded-xl bg-muted/50 group-hover:scale-110 transition-transform">
              {categoryInfo.emoji}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                {activity.title}
              </h3>
              <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                <Calendar className="h-3 w-3" />
                <span>{format(parseISO(activity.date), "MMM d, yyyy")}</span>
                <span className="opacity-30">•</span>
                <span>Week {activity.weekNumber}</span>
              </div>
            </div>
          </div>

          {activity.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
              {activity.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider" style={{ borderColor: categoryInfo.color + '40', color: categoryInfo.color }}>
              {activity.category}
            </Badge>
            <Badge variant="secondary" className={cn(
              "text-[10px] uppercase font-bold tracking-wider",
              activity.status === 'Done' ? "bg-success/10 text-success" :
                activity.status === 'In Progress' ? "bg-info/10 text-info" :
                  activity.status === 'Blocked' ? "bg-destructive/10 text-destructive" : ""
            )}>
              {activity.status}
            </Badge>
            {activity.teams.map((team) => (
              <Badge key={team} variant="outline" className="text-[10px] uppercase font-bold tracking-wider bg-muted/30">
                <Users className="h-2 w-2 mr-1" />
                {team}
              </Badge>
            ))}
          </div>

          {activity.impactNotes && (
            <div className="bg-accent/5 rounded-xl p-3 mb-3 border border-accent/10">
              <p className="text-xs font-bold text-accent mb-1 uppercase tracking-widest">Impact</p>
              <p className="text-sm italic">"{activity.impactNotes}"</p>
            </div>
          )}

          {activity.praises && (
            <div className="bg-primary/5 rounded-xl p-3 mb-3 border border-primary/10">
              <div className="flex items-start gap-2">
                <Award className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">Recognition</p>
                  <p className="text-sm font-medium">{activity.praises}</p>
                </div>
              </div>
            </div>
          )}

          {activity.attachmentUrl && (
            <div className="mt-4 pt-4 border-t border-muted/50">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadAttachment}
                className="h-9 gap-2 text-xs"
              >
                <FileText className="h-3.5 w-3.5" />
                View Attachment
                <Download className="h-3.5 w-3.5 ml-1 opacity-50" />
              </Button>
            </div>
          )}
        </div>

        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-primary/10 hover:text-primary transition-colors" onClick={() => onEdit(activity)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive transition-colors" onClick={() => onDelete(activity.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
