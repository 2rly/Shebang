"use client";

import { useState } from "react";
import { Eye, Edit3, Bold, Code, List, Link2, ImageIcon, Heading } from "lucide-react";

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

function renderPreview(md: string) {
  // Lightweight markdown to HTML for preview
  let html = md
    // Code blocks
    .replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-cyber-bg border border-cyber-border rounded-lg p-3 my-2 overflow-x-auto"><code class="text-cyber-primary text-xs font-mono">$2</code></pre>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="bg-cyber-bg px-1.5 py-0.5 rounded text-cyber-primary text-xs font-mono">$1</code>')
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-cyber-text mt-4 mb-2">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-cyber-text mt-4 mb-2">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-cyber-text mt-4 mb-2">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyber-text font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-cyber-secondary underline" target="_blank" rel="noopener">$1</a>')
    // Images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded-lg my-2 border border-cyber-border" />')
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-cyber-text">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-cyber-text list-decimal">$1</li>')
    // Paragraphs (double newline)
    .replace(/\n\n/g, '</p><p class="text-cyber-text text-sm leading-relaxed my-2">')
    // Single newlines
    .replace(/\n/g, "<br />");

  return `<p class="text-cyber-text text-sm leading-relaxed">${html}</p>`;
}

function insertAtCursor(textarea: HTMLTextAreaElement, before: string, after: string = "") {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);
  const replacement = before + (selected || "text") + after;

  // Use execCommand to maintain undo history
  textarea.focus();
  document.execCommand("insertText", false, replacement);

  // Set cursor position
  const newPos = start + before.length + (selected || "text").length;
  textarea.setSelectionRange(newPos, newPos);
}

export default function MarkdownEditor({ value, onChange, placeholder, minHeight = "300px" }: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  const handleToolbar = (action: string) => {
    const textarea = document.getElementById("md-editor") as HTMLTextAreaElement;
    if (!textarea) return;

    switch (action) {
      case "bold":
        insertAtCursor(textarea, "**", "**");
        break;
      case "heading":
        insertAtCursor(textarea, "## ", "");
        break;
      case "code":
        insertAtCursor(textarea, "```bash\n", "\n```");
        break;
      case "inline-code":
        insertAtCursor(textarea, "`", "`");
        break;
      case "list":
        insertAtCursor(textarea, "- ", "");
        break;
      case "link":
        insertAtCursor(textarea, "[", "](https://)");
        break;
      case "image":
        insertAtCursor(textarea, "![alt text](", ")");
        break;
    }
    // Update the value from textarea after insertion
    onChange(textarea.value);
  };

  return (
    <div className="border border-cyber-border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-cyber-surface border-b border-cyber-border px-3 py-2">
        <div className="flex items-center gap-1">
          {[
            { action: "bold", icon: Bold, title: "Bold" },
            { action: "heading", icon: Heading, title: "Heading" },
            { action: "code", icon: Code, title: "Code Block" },
            { action: "list", icon: List, title: "List" },
            { action: "link", icon: Link2, title: "Link" },
            { action: "image", icon: ImageIcon, title: "Image" },
          ].map((tool) => {
            const Icon = tool.icon;
            return (
              <button
                key={tool.action}
                type="button"
                onClick={() => handleToolbar(tool.action)}
                className="p-1.5 rounded text-cyber-muted hover:text-cyber-text hover:bg-cyber-border/50 transition-colors"
                title={tool.title}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-1 border border-cyber-border rounded-lg overflow-hidden">
          <button
            type="button"
            onClick={() => setMode("write")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-mono transition-colors ${
              mode === "write"
                ? "bg-cyber-accent/20 text-cyber-accent"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <Edit3 className="w-3 h-3" /> Write
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1 px-3 py-1 text-xs font-mono transition-colors ${
              mode === "preview"
                ? "bg-cyber-accent/20 text-cyber-accent"
                : "text-cyber-muted hover:text-cyber-text"
            }`}
          >
            <Eye className="w-3 h-3" /> Preview
          </button>
        </div>
      </div>

      {/* Editor / Preview */}
      {mode === "write" ? (
        <textarea
          id="md-editor"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || "Write your content in Markdown..."}
          className="w-full bg-cyber-bg text-cyber-text text-sm font-mono p-4 outline-none resize-y placeholder:text-cyber-muted/50"
          style={{ minHeight }}
        />
      ) : (
        <div
          className="p-4 prose prose-invert max-w-none overflow-y-auto"
          style={{ minHeight }}
          dangerouslySetInnerHTML={{ __html: renderPreview(value) || '<p class="text-cyber-muted italic">Nothing to preview yet...</p>' }}
        />
      )}
    </div>
  );
}
