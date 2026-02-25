"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { Radar, ExternalLink, ArrowRight, History, X, Loader2 } from "lucide-react";

export default function BinaryIntelPage() {
  const [binary, setBinary] = useState("");
  const [submittedBin, setSubmittedBin] = useState("");
  const [iframeSrc, setIframeSrc] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [isFocused, setIsFocused] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isFocused) {
      const interval = setInterval(() => setCursorVisible((v) => !v), 530);
      return () => clearInterval(interval);
    }
    setCursorVisible(false);
  }, [isFocused]);

  const locate = (bin: string) => {
    const trimmed = bin.trim();
    if (!trimmed) return;
    setSubmittedBin(trimmed);
    setLoading(true);
    setIframeSrc(`https://command-not-found.com/${encodeURIComponent(trimmed)}`);
    setHistory((prev) =>
      [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 10)
    );
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    locate(binary);
  };

  const openExternal = () => {
    if (submittedBin) {
      window.open(
        `https://command-not-found.com/${encodeURIComponent(submittedBin)}`,
        "_blank"
      );
    }
  };

  return (
    <div className="px-4 pt-3 pb-2 h-full flex flex-col">
      {/* Compact header row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Radar className="w-5 h-5 text-cyber-secondary flex-shrink-0" />
          <h1 className="text-lg font-bold text-cyber-text">
            Binary <span className="text-cyber-secondary">Intel</span>
          </h1>
          <span className="text-xs text-cyber-muted hidden sm:inline">
            — powered by command-not-found.com
          </span>
        </div>

        {/* History chips inline in header */}
        {history.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto ml-4">
            <History className="w-3.5 h-3.5 text-cyber-muted flex-shrink-0" />
            {history.slice(0, 5).map((h, i) => (
              <button
                key={i}
                onClick={() => { setBinary(h); locate(h); }}
                className="px-2 py-0.5 text-[11px] font-mono bg-cyber-surface border border-cyber-border rounded-full text-cyber-muted hover:text-cyber-secondary hover:border-cyber-secondary/30 transition-colors whitespace-nowrap flex-shrink-0"
              >
                {h}
              </button>
            ))}
            <button
              onClick={() => setHistory([])}
              className="p-0.5 text-cyber-muted hover:text-cyber-accent transition-colors flex-shrink-0"
              title="Clear history"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>

      {/* Slim terminal input */}
      <form onSubmit={handleSubmit} className="mb-2">
        <div
          className={`bg-cyber-bg border rounded-lg overflow-hidden transition-all duration-300 ${
            isFocused
              ? "border-cyber-secondary shadow-[0_0_10px_rgba(0,212,255,0.12)]"
              : "border-cyber-border"
          }`}
          onClick={() => inputRef.current?.focus()}
        >
          <div className="flex items-center px-3 py-2">
            <span className="text-cyber-secondary font-mono text-sm mr-2 flex-shrink-0">
              root@shebang:~$
            </span>
            <span className="text-cyber-muted font-mono text-sm mr-1 flex-shrink-0">
              intel --locate &quot;
            </span>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={binary}
                onChange={(e) => setBinary(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                className="w-full bg-transparent outline-none font-mono text-sm text-cyber-text caret-transparent"
              />
              {!binary && (
                <span
                  className="absolute inset-0 pointer-events-none font-mono text-sm flex items-center"
                  style={{ color: "#4b5563", opacity: 0.4 }}
                >
                  Package &amp; binary intelligence — powered by command-not-found.com
                </span>
              )}
              <span
                className={`absolute top-0 font-mono text-sm pointer-events-none transition-opacity ${
                  cursorVisible && isFocused ? "opacity-100" : "opacity-0"
                }`}
                style={{ left: `${binary.length * 0.6}em`, color: "#00d4ff" }}
              >
                █
              </span>
            </div>
            <span className="text-cyber-muted font-mono text-sm mr-2 flex-shrink-0">
              &quot;
            </span>
            <button
              type="submit"
              disabled={!binary.trim()}
              className="p-1.5 bg-cyber-secondary/20 text-cyber-secondary rounded hover:bg-cyber-secondary/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed flex-shrink-0"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>

      {/* Results area — fills remaining height */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden rounded-lg border border-cyber-border">
        {iframeSrc ? (
          <>
            {/* Thin result bar with external link */}
            <div className="flex items-center justify-between px-3 py-1.5 border-b border-cyber-border bg-cyber-surface">
              <div className="flex items-center gap-2 min-w-0">
                <Radar className="w-3.5 h-3.5 text-cyber-secondary flex-shrink-0" />
                <code className="text-xs font-mono text-cyber-secondary truncate">
                  {submittedBin}
                </code>
              </div>
              <button
                onClick={openExternal}
                className="flex items-center gap-1 text-[11px] font-mono text-cyber-muted hover:text-cyber-secondary transition-colors flex-shrink-0"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="hidden sm:inline">command-not-found.com</span>
              </button>
            </div>

            {/* iframe — full bleed */}
            <div className="flex-1 relative bg-white">
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-cyber-bg/90 z-10">
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-6 h-6 text-cyber-secondary animate-spin" />
                    <span className="text-xs font-mono text-cyber-muted">
                      Scanning package repositories...
                    </span>
                  </div>
                </div>
              )}
              <iframe
                src={iframeSrc}
                title="command-not-found result"
                className="w-full h-full border-0"
                onLoad={() => setLoading(false)}
                sandbox="allow-scripts allow-same-origin allow-popups"
              />
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-cyber-surface">
            <div className="text-center max-w-md">
              <Radar className="w-14 h-14 text-cyber-secondary/20 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-cyber-text mb-1.5">
                Binary Intelligence Locator
              </h3>
              <p className="text-sm text-cyber-muted mb-5">
                Enter any binary or command name to discover which package provides it
                and installation instructions across distros.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  "nmap",
                  "tcpdump",
                  "hashcat",
                  "john",
                  "aircrack-ng",
                  "nikto",
                  "sqlmap",
                  "gobuster",
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => { setBinary(example); locate(example); }}
                    className="px-3 py-1.5 text-xs font-mono text-left bg-cyber-bg border border-cyber-border rounded-lg text-cyber-muted hover:text-cyber-secondary hover:border-cyber-secondary/30 transition-colors"
                  >
                    $ which {example}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
