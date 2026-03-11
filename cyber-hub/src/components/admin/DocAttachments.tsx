"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Paperclip,
  Upload,
  Trash2,
  FileText,
  ImageIcon,
  File,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";

interface Attachment {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  altText: string;
  createdAt: string;
}

interface DocAttachmentsProps {
  docId: number | null;
  onInsert: (markdown: string) => void;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith("image/")) return ImageIcon;
  if (mimeType === "application/pdf") return FileText;
  return File;
}

export default function DocAttachments({ docId, onInsert }: DocAttachmentsProps) {
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchAttachments = useCallback(async () => {
    if (!docId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/docs/${docId}/attachments`);
      if (res.ok) {
        const data = await res.json();
        setAttachments(data.attachments || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [docId]);

  useEffect(() => {
    fetchAttachments();
  }, [fetchAttachments]);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!docId) return;
      setError(null);
      setUploading(true);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`/api/admin/docs/${docId}/attachments`, {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Upload failed");
          return;
        }

        await fetchAttachments();
      } catch {
        setError("Network error. Please try again.");
      } finally {
        setUploading(false);
      }
    },
    [docId, fetchAttachments]
  );

  const handleDelete = async (attachmentId: number) => {
    if (!docId || !confirm("Delete this attachment?")) return;

    try {
      await fetch(`/api/admin/docs/${docId}/attachments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attachmentId }),
      });
      await fetchAttachments();
    } catch {
      setError("Failed to delete attachment.");
    }
  };

  const copyMarkdown = (attachment: Attachment) => {
    const isImage = attachment.mimeType.startsWith("image/");
    const md = isImage
      ? `![${attachment.originalName}](${attachment.url})`
      : `[${attachment.originalName}](${attachment.url})`;
    navigator.clipboard.writeText(md);
    setCopiedId(attachment.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const insertMarkdown = (attachment: Attachment) => {
    const isImage = attachment.mimeType.startsWith("image/");
    const md = isImage
      ? `![${attachment.originalName}](${attachment.url})`
      : `[${attachment.originalName}](${attachment.url})`;
    onInsert(md);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleUpload(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [handleUpload]
  );

  if (!docId) {
    return (
      <div className="cyber-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Paperclip className="w-4 h-4 text-cyber-secondary" />
          <h3 className="text-sm font-mono font-bold text-cyber-text">Attachments</h3>
        </div>
        <p className="text-xs text-cyber-muted italic">
          Save the document first to enable attachments.
        </p>
      </div>
    );
  }

  return (
    <div className="cyber-card overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-cyber-surface border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Paperclip className="w-4 h-4 text-cyber-secondary" />
          <h3 className="text-sm font-mono font-bold text-cyber-text">
            Attachments
          </h3>
          {attachments.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-cyber-secondary/10 text-cyber-secondary rounded">
              {attachments.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono bg-cyber-secondary/10 text-cyber-secondary rounded-lg hover:bg-cyber-secondary/20 border border-cyber-secondary/20 transition-colors disabled:opacity-50"
        >
          {uploading ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Upload className="w-3 h-3" />
          )}
          Upload
        </button>
        <input
          ref={inputRef}
          type="file"
          onChange={handleFileSelect}
          accept="image/*,.pdf,.txt,.md,.json,.excalidraw"
          className="hidden"
        />
      </div>

      {/* Drop zone + file list */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        className={`p-4 transition-colors ${dragging ? "bg-cyber-secondary/5" : ""}`}
      >
        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 mb-3 p-2 bg-cyber-accent/10 border border-cyber-accent/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-cyber-accent flex-shrink-0" />
            <p className="text-xs text-cyber-accent flex-1">{error}</p>
            <button onClick={() => setError(null)} className="text-cyber-accent hover:text-cyber-text">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-cyber-secondary animate-spin" />
          </div>
        ) : attachments.length === 0 ? (
          /* Empty drop zone */
          <div
            onClick={() => inputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all ${
              dragging
                ? "border-cyber-secondary bg-cyber-secondary/5"
                : "border-cyber-border hover:border-cyber-muted"
            }`}
          >
            <Upload className="w-6 h-6 text-cyber-muted mx-auto mb-2" />
            <p className="text-xs text-cyber-muted">
              Drop files here or <span className="text-cyber-secondary">browse</span>
            </p>
            <p className="text-[10px] text-cyber-muted/60 font-mono mt-1">
              Images, PDFs, text files &bull; Max 10MB
            </p>
          </div>
        ) : (
          /* File list */
          <div className="space-y-2">
            {attachments.map((att) => {
              const Icon = getFileIcon(att.mimeType);
              const isImage = att.mimeType.startsWith("image/");

              return (
                <div
                  key={att.id}
                  className="flex items-center gap-3 p-2.5 bg-cyber-bg rounded-lg border border-cyber-border group hover:border-cyber-muted transition-colors"
                >
                  {/* Thumbnail or icon */}
                  {isImage ? (
                    <div className="w-10 h-10 rounded overflow-hidden border border-cyber-border flex-shrink-0 bg-cyber-surface">
                      <img
                        src={att.url}
                        alt={att.originalName}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 rounded bg-cyber-surface border border-cyber-border flex items-center justify-center flex-shrink-0">
                      <Icon className="w-5 h-5 text-cyber-muted" />
                    </div>
                  )}

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-cyber-text truncate font-medium">
                      {att.originalName}
                    </p>
                    <p className="text-[10px] text-cyber-muted font-mono">
                      {formatSize(att.size)} &bull;{" "}
                      {new Date(att.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => insertMarkdown(att)}
                      className="px-2 py-1 text-[10px] font-mono bg-cyber-primary/10 text-cyber-primary rounded hover:bg-cyber-primary/20 transition-colors"
                      title="Insert into content"
                    >
                      Insert
                    </button>
                    <button
                      type="button"
                      onClick={() => copyMarkdown(att)}
                      className="p-1.5 text-cyber-muted hover:text-cyber-secondary transition-colors"
                      title="Copy markdown"
                    >
                      {copiedId === att.id ? (
                        <Check className="w-3.5 h-3.5 text-cyber-primary" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(att.id)}
                      className="p-1.5 text-cyber-muted hover:text-cyber-accent transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

            {/* Small drop hint at bottom */}
            <div
              onClick={() => inputRef.current?.click()}
              className={`border border-dashed rounded-lg p-2 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-cyber-secondary bg-cyber-secondary/5"
                  : "border-cyber-border/50 hover:border-cyber-muted"
              }`}
            >
              <p className="text-[10px] text-cyber-muted font-mono">
                + Drop or click to add more files
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
