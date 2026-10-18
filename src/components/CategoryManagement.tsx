import { useState } from "react";
import { useUserData } from "@/hooks/useUserData";
import { UserCategory } from "@/types";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit2, Trash2, X, Sparkles, Palette } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = {
  name: "",
  emoji: "🔹",
  color: "hsl(220, 15%, 50%)",
  keywords: [] as string[],
};

export function CategoryManagement() {
  const { categories, addCategory, updateCategory, deleteCategory } = useUserData();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UserCategory | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [keywordInput, setKeywordInput] = useState("");
  const [loading, setLoading] = useState(false);

  const resetForm = () => {
    setFormData(EMPTY_FORM);
    setKeywordInput("");
    setEditingCategory(null);
  };

  const handleEdit = (category: UserCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      emoji: category.emoji,
      color: category.color,
      keywords: category.keywords,
    });
    setIsOpen(true);
  };

  const handleDelete = async (category: UserCategory) => {
    if (!confirm(`Delete "${category.name}"? Existing activities keep their category label.`)) return;
    setLoading(true);
    await deleteCategory(category.id);
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = formData.name.trim();
    if (!name) return;

    const duplicate = categories.some(
      (c) => c.name.toLowerCase() === name.toLowerCase() && c.id !== editingCategory?.id
    );
    if (duplicate) {
      toast.error(`A category named "${name}" already exists`);
      return;
    }

    setLoading(true);
    const data = { ...formData, name };
    if (editingCategory) {
      await updateCategory(editingCategory.id, data);
    } else {
      await addCategory(data);
    }
    setLoading(false);
    setIsOpen(false);
    resetForm();
  };

  const addKeyword = () => {
    const keyword = keywordInput.trim();
    if (keyword && !formData.keywords.includes(keyword)) {
      setFormData({ ...formData, keywords: [...formData.keywords, keyword] });
    }
    setKeywordInput("");
  };

  const removeKeyword = (keyword: string) => {
    setFormData({ ...formData, keywords: formData.keywords.filter((k) => k !== keyword) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Category Settings
          </h3>
          <p className="text-sm text-muted-foreground">Customize activity categories and the keywords used to suggest them</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsOpen(true);
          }}
          className="gap-2 shadow-lg shadow-primary/20"
        >
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {categories.length === 0 && (
        <p className="text-sm text-muted-foreground italic">No categories yet. Add one to get started.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <Card key={category.id} className="p-4 card-glass border-0 shadow-lg hover:shadow-xl transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="text-2xl p-2 rounded-xl bg-muted/50" style={{ color: category.color }}>
                  {category.emoji}
                </div>
                <div>
                  <h4 className="font-bold">{category.name}</h4>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {category.keywords.length} keywords
                  </p>
                </div>
              </div>
              <div className="flex gap-1 md:opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" aria-label={`Edit ${category.name}`} className="h-8 w-8 hover:bg-primary/10" onClick={() => handleEdit(category)}>
                  <Edit2 className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" aria-label={`Delete ${category.name}`} className="h-8 w-8 hover:bg-destructive/10 text-destructive" disabled={loading} onClick={() => handleDelete(category)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {category.keywords.length === 0 ? (
                <span className="text-[10px] text-muted-foreground italic">No keywords added</span>
              ) : (
                category.keywords.slice(0, 5).map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="text-[10px] py-0 px-2 font-medium bg-muted/40">
                    {keyword}
                  </Badge>
                ))
              )}
              {category.keywords.length > 5 && (
                <Badge variant="secondary" className="text-[10px] py-0 px-2 font-medium">
                  +{category.keywords.length - 5}
                </Badge>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if (!open) resetForm(); }}>
        <DialogContent className="sm:max-w-md card-glass border-0 shadow-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Palette className="h-5 w-5 text-primary" />
              {editingCategory ? "Edit Category" : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-4 gap-4">
              <div className="col-span-1 space-y-2">
                <Label htmlFor="emoji">Icon</Label>
                <Input
                  id="emoji"
                  value={formData.emoji}
                  maxLength={8}
                  onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                  className="h-11 text-center text-xl"
                  required
                />
              </div>
              <div className="col-span-3 space-y-2">
                <Label htmlFor="name">Category Label *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  maxLength={100}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., Product Development"
                  className="h-11 font-medium"
                  required
                />
              </div>
            </div>

            {editingCategory && formData.name.trim() !== editingCategory.name && (
              <p className="text-xs text-muted-foreground -mt-3">
                Renaming doesn't change activities already logged under "{editingCategory.name}".
              </p>
            )}

            <div className="space-y-2">
              <Label htmlFor="color">Color (HSL)</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  value={formData.color}
                  maxLength={64}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  placeholder="hsl(220, 15%, 50%)"
                  className="h-11 font-mono text-xs"
                  required
                />
                <div className="w-11 h-11 rounded-lg border-2 border-white shadow-inner shrink-0" style={{ backgroundColor: formData.color }} />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="keywords">Suggestion Keywords</Label>
              <div className="flex gap-2 mb-3">
                <Input
                  id="keywords"
                  value={keywordInput}
                  maxLength={100}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  placeholder="Key term..."
                  className="h-11"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addKeyword();
                    }
                  }}
                />
                <Button type="button" onClick={addKeyword} variant="outline" className="h-11 px-4">
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-3 rounded-xl bg-muted/30 border border-dashed border-muted min-h-[50px]">
                {formData.keywords.length === 0 && (
                  <span className="text-xs text-muted-foreground w-full text-center py-2 italic">Activities containing these words will suggest this category</span>
                )}
                {formData.keywords.map((keyword) => (
                  <Badge key={keyword} variant="secondary" className="h-7 pl-2 gap-1 border border-primary/10">
                    {keyword}
                    <X className="h-3 w-3 cursor-pointer opacity-60 hover:opacity-100" onClick={() => removeKeyword(keyword)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-4 border-t">
              <Button type="button" variant="ghost" className="flex-1 h-11" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="flex-[2] h-11 shadow-lg shadow-primary/20" disabled={loading}>
                {loading ? "Saving..." : (editingCategory ? "Save Changes" : "Add Category")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
