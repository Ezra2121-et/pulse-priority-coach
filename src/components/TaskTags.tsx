import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X, Plus, Filter } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TAG_COLORS: Record<string, string> = {
  work: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  personal: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  urgent: "bg-red-500/20 text-red-300 border-red-500/30",
  health: "bg-green-500/20 text-green-300 border-green-500/30",
  learning: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30",
  creative: "bg-pink-500/20 text-pink-300 border-pink-500/30",
};

function getTagColor(tag: string): string {
  const lower = tag.toLowerCase();
  return TAG_COLORS[lower] || "bg-secondary text-secondary-foreground";
}

interface TagBadgeProps {
  tag: string;
  onRemove?: () => void;
  size?: "sm" | "default";
}

export function TagBadge({ tag, onRemove, size = "default" }: TagBadgeProps) {
  return (
    <Badge variant="outline" className={`gap-1 ${getTagColor(tag)} ${size === "sm" ? "text-[10px] px-1 py-0" : "text-xs"}`}>
      {tag}
      {onRemove && (
        <button onClick={onRemove} className="hover:text-foreground">
          <X className="h-2.5 w-2.5" />
        </button>
      )}
    </Badge>
  );
}

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = () => {
    const tag = input.trim().toLowerCase();
    if (tag && !tags.includes(tag) && tags.length < 5) {
      onChange([...tags, tag]);
      setInput("");
    }
  };

  const presets = Object.keys(TAG_COLORS).filter((t) => !tags.includes(t));

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Input
          placeholder="Add a tag..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
          className="h-8 text-xs"
        />
        <Button type="button" size="sm" variant="outline" onClick={addTag} className="h-8 px-2">
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      {presets.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {presets.map((p) => (
            <button key={p} type="button" onClick={() => onChange([...tags, p])}>
              <Badge variant="outline" className={`text-[10px] cursor-pointer hover:opacity-80 ${getTagColor(p)}`}>{p}</Badge>
            </button>
          ))}
        </div>
      )}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((t) => (
            <TagBadge key={t} tag={t} onRemove={() => onChange(tags.filter((x) => x !== t))} size="sm" />
          ))}
        </div>
      )}
    </div>
  );
}

interface TagFilterProps {
  activeFilters: string[];
  onChange: (filters: string[]) => void;
  availableTags: string[];
}

export function TagFilter({ activeFilters, onChange, availableTags }: TagFilterProps) {
  if (availableTags.length === 0) return null;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1 h-8">
          <Filter className="h-3 w-3" />
          {activeFilters.length > 0 ? `${activeFilters.length} filter${activeFilters.length > 1 ? "s" : ""}` : "Filter"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="glass border-glass-border w-48 p-2">
        <div className="space-y-1">
          {activeFilters.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-left px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground rounded"
            >
              Clear filters
            </button>
          )}
          {availableTags.map((tag) => (
            <button
              key={tag}
              onClick={() => {
                if (activeFilters.includes(tag)) {
                  onChange(activeFilters.filter((f) => f !== tag));
                } else {
                  onChange([...activeFilters, tag]);
                }
              }}
              className={`w-full text-left px-2 py-1.5 text-xs rounded transition-colors ${
                activeFilters.includes(tag) ? "bg-primary/20 text-primary" : "hover:bg-accent"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
