import { Activity } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityCard } from "@/components/ActivityCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useMemo, useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { categoryDisplay } from "@/lib/categories";

interface CategoryViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function CategoryView({ activities, onEdit, onDelete }: CategoryViewProps) {
  const { categories } = useUserData();
  // Collapsed by default once there's a lot of history; tracks the ones the user opened.
  const [openCategories, setOpenCategories] = useState<string[] | null>(null);

  // The user's categories, plus any category still used by an activity
  // (renamed, deleted, or from an earlier default set).
  const categoryCounts = useMemo(() => {
    const names = [
      ...categories.map((c) => c.name),
      ...activities.map((a) => a.category).filter(Boolean),
    ];
    return Array.from(new Set(names))
      .map((name) => {
        const categoryActivities = activities.filter((a) => a.category === name);
        const percentage = activities.length > 0 ? (categoryActivities.length / activities.length) * 100 : 0;
        return {
          name,
          ...categoryDisplay(name, categories),
          activities: categoryActivities,
          count: categoryActivities.length,
          percentage: percentage.toFixed(1),
        };
      })
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [activities, categories]);

  const isOpen = (name: string) =>
    openCategories === null ? activities.length <= 30 : openCategories.includes(name);

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) => {
      const current = prev ?? (activities.length <= 30 ? categoryCounts.map((c) => c.name) : []);
      return current.includes(categoryName)
        ? current.filter((c) => c !== categoryName)
        : [...current, categoryName];
    });
  };

  const used = categoryCounts.filter((c) => c.count > 0);

  return (
    <div className="space-y-4">
      {used.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
          {used.map((category) => (
            <Card key={category.name} className="p-4 text-center">
              <div className="text-3xl mb-2">{category.emoji}</div>
              <div className="text-2xl font-bold">{category.count}</div>
              <div className="text-xs text-muted-foreground truncate" title={category.name}>{category.name}</div>
              <div className="text-xs text-muted-foreground">{category.percentage}%</div>
            </Card>
          ))}
        </div>
      )}

      <div className="space-y-3">
        {categoryCounts.map((category) => (
          <Collapsible
            key={category.name}
            open={isOpen(category.name)}
            onOpenChange={() => toggleCategory(category.name)}
          >
            <Card className="overflow-hidden">
              <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-accent/5 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{category.emoji}</span>
                  <div className="text-left">
                    <h3 className="font-semibold text-lg">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {category.count} activities • {category.percentage}% of total
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline">{category.count}</Badge>
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${isOpen(category.name) ? "rotate-180" : ""}`}
                  />
                </div>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className="p-5 pt-0 space-y-3 border-t">
                  {category.activities.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic py-4">No activities in this category yet</p>
                  ) : (
                    category.activities.map((activity) => (
                      <ActivityCard key={activity.id} activity={activity} onEdit={onEdit} onDelete={onDelete} />
                    ))
                  )}
                </div>
              </CollapsibleContent>
            </Card>
          </Collapsible>
        ))}
      </div>
    </div>
  );
}
