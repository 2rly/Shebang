"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, FileText, ImageIcon, Loader2, CheckCircle, AlertCircle } from "lucide-react";

interface UploadResult {
  url: string;
  filename: string;
  originalName: string;
  size: number;
  type: string;
  isImage: boolean;
  markdown: string;
}

interface FileUploadProps {
  onUpload: (result: UploadResult) => void;
  onClose: () => void;
}

export default function FileUpload({ onUpload, onClose }: FileUploadProps) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<UploadResult | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(async (file: File) => {
    setError(null);
    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Upload failed");
        return;
      }

      setResult(data);
      onUpload(data);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setUploading(false);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setDragging(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }, [handleUpload]);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-cyber-surface border border-cyber-border rounded-xl w-full max-w-md mx-4 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-cyber-border">
          <h3 className="text-sm font-mono font-bold text-cyber-text flex items-center gap-2">
            <Upload className="w-4 h-4 text-cyber-secondary" />
            Upload File
          </h3>
          <button onClick={onClose} className="p-1 text-cyber-muted hover:text-cyber-text transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {result ? (
            /* Success state */
            <div className="text-center py-4">
              <CheckCircle className="w-10 h-10 text-cyber-primary mx-auto mb-3" />
              <p className="text-sm text-cyber-text font-medium mb-1">Uploaded successfully</p>
              <p className="text-xs text-cyber-muted font-mono mb-3">{result.originalName} ({formatSize(result.size)})</p>
              {result.isImage && (
                <img
                  src={result.url}
                  alt={result.originalName}
                  className="max-h-32 mx-auto rounded-lg border border-cyber-border mb-3"
                />
              )}
              <div className="bg-cyber-bg rounded-lg p-2 border border-cyber-border">
                <p className="text-[10px] text-cyber-muted font-mono uppercase mb-1">Markdown inserted</p>
                <code className="text-xs text-cyber-primary font-mono break-all">{result.markdown}</code>
              </div>
            </div>
          ) : uploading ? (
            /* Uploading state */
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 text-cyber-secondary mx-auto mb-3 animate-spin" />
              <p className="text-sm text-cyber-muted font-mono">Uploading...</p>
            </div>
          ) : (
            /* Drop zone */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => inputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                dragging
                  ? "border-cyber-secondary bg-cyber-secondary/5"
                  : "border-cyber-border hover:border-cyber-muted"
              }`}
            >
              <div className="flex justify-center gap-2 mb-3">
                <ImageIcon className="w-6 h-6 text-cyber-muted" />
                <FileText className="w-6 h-6 text-cyber-muted" />
              </div>
              <p className="text-sm text-cyber-text mb-1">
                Drop a file here or <span className="text-cyber-secondary">browse</span>
              </p>
              <p className="text-xs text-cyber-muted font-mono">
                Images, PDFs, text files &bull; Max 10MB
              </p>
              <input
                ref={inputRef}
                type="file"
                onChange={handleFileSelect}
                accept="image/*,.pdf,.txt,.md,.json"
                className="hidden"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 mt-3 p-2 bg-cyber-accent/10 border border-cyber-accent/20 rounded-lg">
              <AlertCircle className="w-4 h-4 text-cyber-accent flex-shrink-0" />
              <p className="text-xs text-cyber-accent">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-cyber-border flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-mono text-cyber-muted hover:text-cyber-text bg-cyber-border/30 hover:bg-cyber-border/50 rounded-lg transition-colors"
          >
            {result ? "Done" : "Cancel"}
          </button>
        </div>
      </div>
    </div>
  );
}
