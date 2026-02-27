"use client";

import { useState, useEffect, useRef } from "react";
import {
  Image as ImageIcon,
  Upload,
  Trash2,
  Loader2,
  Copy,
  Check,
  X,
} from "lucide-react";

interface MediaFile {
  id: number;
  filename: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
  authorName: string;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function MediaLibraryPage() {
  const [media, setMedia] = useState<MediaFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [preview, setPreview] = useState<MediaFile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { fetchMedia(); }, []);

  const fetchMedia = async () => {
    const res = await fetch("/api/admin/media");
    if (res.ok) {
      const data = await res.json();
      setMedia(data.media || []);
    }
    setLoading(false);
  };

  const handleUpload = async (files: FileList) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("altText", file.name.replace(/\.[^.]+$/, ""));
      await fetch("/api/admin/media", { method: "POST", body: formData });
    }
    await fetchMedia();
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this file?")) return;
    await fetch("/api/admin/media", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (preview?.id === id) setPreview(null);
    await fetchMedia();
  };

  const copyUrl = (filename: string) => {
    const url = `/uploads/${filename}`;
    navigator.clipboard.writeText(url);
    setCopied(filename);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyMarkdown = (file: MediaFile) => {
    const md = `![${file.altText || file.originalName}](/uploads/${file.filename})`;
    navigator.clipboard.writeText(md);
    setCopied("md-" + file.filename);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-cyber-text flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-cyber-accent" />
            Media Library
          </h1>
          <p className="text-xs text-cyber-muted mt-1">
            {media.length} file{media.length !== 1 ? "s" : ""} &bull; {formatBytes(media.reduce((s, m) => s + m.sizeBytes, 0))} total
          </p>
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2 bg-cyber-accent/20 text-cyber-accent text-sm rounded-lg hover:bg-cyber-accent/30 border border-cyber-accent/30 transition-colors font-mono disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && handleUpload(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        className="cyber-card p-6 mb-6 border-dashed text-center cursor-pointer hover:border-cyber-accent/50 transition-colors"
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = "rgba(255,0,110,0.5)"; }}
        onDragLeave={(e) => { e.currentTarget.style.borderColor = ""; }}
        onDrop={(e) => { e.preventDefault(); e.currentTarget.style.borderColor = ""; if (e.dataTransfer.files.length) handleUpload(e.dataTransfer.files); }}
      >
        <Upload className="w-8 h-8 text-cyber-muted mx-auto mb-2" />
        <p className="text-sm text-cyber-muted">Drop images here or click to upload</p>
        <p className="text-[10px] text-cyber-muted/60 mt-1">PNG, JPEG, GIF, WebP, SVG — max 5MB</p>
      </div>

      {/* Preview overlay */}
      {preview && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreview(null)}>
          <div className="max-w-3xl w-full cyber-card p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-mono text-cyber-text truncate">{preview.originalName}</h3>
              <button onClick={() => setPreview(null)} className="text-cyber-muted hover:text-cyber-accent transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/uploads/${preview.filename}`} alt={preview.altText} className="max-w-full max-h-[60vh] mx-auto rounded-lg" />
            <div className="flex items-center gap-2 mt-3">
              <button
                onClick={() => copyUrl(preview.filename)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cyber-border/50 text-cyber-text rounded hover:bg-cyber-border transition-colors"
              >
                {copied === preview.filename ? <Check className="w-3 h-3 text-cyber-primary" /> : <Copy className="w-3 h-3" />}
                Copy URL
              </button>
              <button
                onClick={() => copyMarkdown(preview)}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono bg-cyber-border/50 text-cyber-text rounded hover:bg-cyber-border transition-colors"
              >
                {copied === "md-" + preview.filename ? <Check className="w-3 h-3 text-cyber-primary" /> : <Copy className="w-3 h-3" />}
                Copy Markdown
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 text-cyber-primary animate-spin" />
        </div>
      ) : media.length === 0 ? (
        <div className="cyber-card p-8 text-center">
          <ImageIcon className="w-10 h-10 text-cyber-muted mx-auto mb-3" />
          <p className="text-cyber-muted">No media files yet. Upload screenshots and diagrams above.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {media.map((file) => (
            <div key={file.id} className="cyber-card overflow-hidden group">
              <div
                className="aspect-square bg-cyber-bg flex items-center justify-center cursor-pointer overflow-hidden"
                onClick={() => setPreview(file)}
              >
                {file.mimeType.startsWith("image/") ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={`/uploads/${file.filename}`}
                    alt={file.altText}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <ImageIcon className="w-8 h-8 text-cyber-muted" />
                )}
              </div>
              <div className="p-2">
                <p className="text-[10px] font-mono text-cyber-text truncate">{file.originalName}</p>
                <p className="text-[9px] text-cyber-muted">{formatBytes(file.sizeBytes)}</p>
                <div className="flex items-center gap-1 mt-1">
                  <button
                    onClick={() => copyUrl(file.filename)}
                    className="p-1 text-cyber-muted hover:text-cyber-secondary transition-colors"
                    title="Copy URL"
                  >
                    {copied === file.filename ? <Check className="w-3 h-3 text-cyber-primary" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <button
                    onClick={() => handleDelete(file.id)}
                    className="p-1 text-cyber-muted hover:text-cyber-accent transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
