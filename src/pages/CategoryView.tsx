import { Activity, CATEGORIES } from "@/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ActivityCard } from "@/components/ActivityCard";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import { useState } from "react";

interface CategoryViewProps {
  activities: Activity[];
  onEdit: (activity: Activity) => void;
  onDelete: (id: string) => void;
}

export function CategoryView({ activities, onEdit, onDelete }: CategoryViewProps) {
  const [openCategories, setOpenCategories] = useState<string[]>(CATEGORIES.map((c) => c.name));

  const toggleCategory = (categoryName: string) => {
    setOpenCategories((prev) =>
      prev.includes(categoryName) ? prev.filter((c) => c !== categoryName) : [...prev, categoryName]
    );
  };

  const categoryCounts = CATEGORIES.map((category) => {
    const categoryActivities = activities.filter((a) => a.category === category.name);
    const percentage = activities.length > 0 ? (categoryActivities.length / activities.length) * 100 : 0;

    return {
      ...category,
      activities: categoryActivities,
      count: categoryActivities.length,
      percentage: percentage.toFixed(1),
    };
  }).sort((a, b) => b.count - a.count);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        {categoryCounts.map((category) => (
          <Card key={category.name} className="p-4 text-center">
            <div className="text-3xl mb-2">{category.emoji}</div>
            <div className="text-2xl font-bold">{category.count}</div>
            <div className="text-xs text-muted-foreground">{category.percentage}%</div>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        {categoryCounts.map((category) => (
          <Collapsible
            key={category.name}
            open={openCategories.includes(category.name)}
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
                    className={`h-5 w-5 transition-transform ${
                      openCategories.includes(category.name) ? "rotate-180" : ""
                    }`}
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
