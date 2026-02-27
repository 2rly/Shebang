"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

const PRESET_TAGS = [
  "Cybersecurity", "Linux", "Windows", "Networking", "Web Dev",
  "Cloud", "Docker", "Kubernetes", "Python", "Penetration Testing",
  "SIEM", "Forensics", "Malware Analysis", "Hardening", "Gaming",
];

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ tags, onChange }: TagInputProps) {
  const [input, setInput] = useState("");
  const [showPresets, setShowPresets] = useState(false);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    }
    if (e.key === "Backspace" && !input && tags.length > 0) {
      removeTag(tags[tags.length - 1]);
    }
  };

  const unusedPresets = PRESET_TAGS.filter((t) => !tags.includes(t));

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5 p-2 bg-cyber-bg border border-cyber-border rounded-lg min-h-[40px]">
        {tags.map((tag) => (
          <span
            key={tag}
            className="flex items-center gap-1 px-2 py-0.5 bg-cyber-accent/10 text-cyber-accent text-xs font-mono rounded border border-cyber-accent/20"
          >
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-white transition-colors">
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowPresets(true)}
          onBlur={() => setTimeout(() => setShowPresets(false), 200)}
          placeholder={tags.length === 0 ? "Add tags..." : ""}
          className="flex-1 min-w-[100px] bg-transparent text-sm text-cyber-text outline-none placeholder:text-cyber-muted/50 font-mono"
        />
      </div>

      {/* Preset tags */}
      {showPresets && unusedPresets.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {unusedPresets.map((tag) => (
            <button
              key={tag}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => addTag(tag)}
              className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-cyber-muted bg-cyber-border/30 rounded hover:bg-cyber-border/60 hover:text-cyber-text transition-colors"
            >
              <Plus className="w-2.5 h-2.5" /> {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
