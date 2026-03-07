"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  User,
  Tag,
  FolderOpen,
  Loader2,
  FileText,
  Copy,
  Check,
} from "lucide-react";

interface DocDetail {
  id: number;
  title: string;
  slug: string;
  description: string;
  category: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  authorName: string;
}

function renderMarkdown(md: string): string {
  return md
    // Code blocks
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      '<pre class="bg-cyber-bg border border-cyber-border rounded-lg p-4 my-3 overflow-x-auto"><code class="text-cyber-primary text-sm font-mono">$2</code></pre>'
    )
    // Inline code
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-cyber-bg px-1.5 py-0.5 rounded text-cyber-primary text-sm font-mono border border-cyber-border">$1</code>'
    )
    // Headers
    .replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold text-cyber-text mt-6 mb-3">$1</h3>')
    .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-cyber-text mt-8 mb-3 pb-2 border-b border-cyber-border">$1</h2>')
    .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold text-cyber-text mt-8 mb-4">$1</h1>')
    // Bold and italic
    .replace(/\*\*(.+?)\*\*/g, '<strong class="text-cyber-text font-bold">$1</strong>')
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Links
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-cyber-secondary underline hover:text-cyber-primary transition-colors" target="_blank" rel="noopener">$1</a>'
    )
    // Images
    .replace(
      /!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="max-w-full rounded-lg my-3 border border-cyber-border" />'
    )
    // Blockquotes
    .replace(
      /^> (.+)$/gm,
      '<blockquote class="border-l-2 border-cyber-primary pl-4 my-3 text-cyber-muted italic">$1</blockquote>'
    )
    // Unordered lists
    .replace(/^- (.+)$/gm, '<li class="ml-4 text-cyber-text text-sm leading-relaxed">$1</li>')
    // Ordered lists
    .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 text-cyber-text text-sm list-decimal leading-relaxed">$1</li>')
    // Horizontal rule
    .replace(/^---$/gm, '<hr class="border-cyber-border my-6" />')
    // Paragraphs
    .replace(/\n\n/g, '</p><p class="text-cyber-text text-sm leading-relaxed my-3">')
    // Single newlines
    .replace(/\n/g, "<br />");
}

export default function DocDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [doc, setDoc] = useState<DocDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  useEffect(() => {
    fetch(`/api/documents/${slug}`)
      .then((r) => {
        if (r.status === 404) {
          setNotFound(true);
          return null;
        }
        return r.ok ? r.json() : null;
      })
      .then((data) => {
        if (data?.doc) setDoc(data.doc);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [slug]);

  const copyUrl = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 text-cyber-primary animate-spin" />
      </div>
    );
  }

  if (notFound || !doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-12 h-12 text-cyber-muted mx-auto mb-4 opacity-30" />
          <h2 className="text-xl font-bold text-cyber-text mb-2">Document Not Found</h2>
          <p className="text-cyber-muted mb-4">
            The document you&apos;re looking for doesn&apos;t exist or hasn&apos;t been published yet.
          </p>
          <Link
            href="/docs"
            className="text-sm text-cyber-primary hover:underline font-mono"
          >
            Back to Documentation
          </Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(doc.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="p-3 md:p-6 h-full overflow-y-auto">
      <div className="max-w-4xl mx-auto">
        {/* Back link */}
        <Link
          href="/docs"
          className="flex items-center gap-2 text-sm text-cyber-muted hover:text-cyber-text mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Documentation
        </Link>

        {/* Document header */}
        <div className="cyber-card p-6 mb-6">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <span className="px-2 py-0.5 text-[10px] font-mono bg-cyber-primary/10 text-cyber-primary rounded border border-cyber-primary/20">
              <FolderOpen className="w-3 h-3 inline mr-1" />
              {doc.category}
            </span>
            {doc.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 text-[10px] font-mono bg-cyber-border/50 text-cyber-muted rounded"
              >
                <Tag className="w-3 h-3 inline mr-1" />
                {tag}
              </span>
            ))}
          </div>

          <h1 className="text-2xl md:text-3xl font-bold text-cyber-text mb-2">
            {doc.title}
          </h1>

          {doc.description && (
            <p className="text-sm text-cyber-muted mb-4">{doc.description}</p>
          )}

          <div className="flex items-center gap-4 text-xs text-cyber-muted font-mono">
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" /> {doc.authorName}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formattedDate}
            </span>
            <button
              onClick={copyUrl}
              className="flex items-center gap-1 hover:text-cyber-primary transition-colors"
            >
              {copiedUrl ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedUrl ? "Copied!" : "Share"}
            </button>
          </div>
        </div>

        {/* Document content */}
        <div className="cyber-card p-6 md:p-8">
          <div
            className="prose prose-invert max-w-none"
            dangerouslySetInnerHTML={{
              __html: `<p class="text-cyber-text text-sm leading-relaxed">${renderMarkdown(doc.content)}</p>`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
