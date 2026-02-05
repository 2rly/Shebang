"use client";

import { useState, useEffect } from "react";
import { ArrowRightLeft, Copy, Check, Trash2 } from "lucide-react";

export function Base64Tool() {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [mode, setMode] = useState<"encode" | "decode">("encode");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    if (!input) {
      setOutput("");
      return;
    }

    try {
      if (mode === "encode") {
        // Encode to Base64
        const encoded = btoa(unescape(encodeURIComponent(input)));
        setOutput(encoded);
      } else {
        // Decode from Base64
        const decoded = decodeURIComponent(escape(atob(input)));
        setOutput(decoded);
      }
    } catch (e) {
      setError(mode === "decode" ? "Invalid Base64 string" : "Encoding error");
      setOutput("");
    }
  }, [input, mode]);

  const copyToClipboard = async () => {
    if (output) {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const swapMode = () => {
    setMode(mode === "encode" ? "decode" : "encode");
    setInput(output);
    setOutput(input);
  };

  const clear = () => {
    setInput("");
    setOutput("");
    setError("");
  };

  return (
    <div className="space-y-4">
      {/* Mode Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMode("encode")}
          className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
            mode === "encode"
              ? "bg-cyber-primary text-cyber-bg"
              : "bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-cyber-text"
          }`}
        >
          Encode
        </button>
        <button
          onClick={swapMode}
          className="p-2 text-cyber-muted hover:text-cyber-primary transition-colors"
          title="Swap input/output"
        >
          <ArrowRightLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => setMode("decode")}
          className={`px-4 py-2 rounded-lg text-sm font-mono transition-all ${
            mode === "decode"
              ? "bg-cyber-secondary text-cyber-bg"
              : "bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-cyber-text"
          }`}
        >
          Decode
        </button>
        <button
          onClick={clear}
          className="ml-auto p-2 text-cyber-muted hover:text-cyber-accent transition-colors"
          title="Clear"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Input */}
      <div>
        <label className="block text-xs text-cyber-muted mb-1 font-mono">
          {mode === "encode" ? "PLAIN TEXT" : "BASE64 STRING"}
        </label>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={mode === "encode" ? "Enter text to encode..." : "Enter Base64 to decode..."}
          className="w-full h-32 bg-cyber-bg border border-cyber-border rounded-lg p-3 font-mono text-sm
                   focus:border-cyber-primary focus:outline-none resize-none"
        />
      </div>

      {/* Output */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="text-xs text-cyber-muted font-mono">
            {mode === "encode" ? "BASE64 OUTPUT" : "DECODED TEXT"}
          </label>
          <button
            onClick={copyToClipboard}
            disabled={!output}
            className="flex items-center gap-1 text-xs text-cyber-muted hover:text-cyber-primary disabled:opacity-50 transition-colors"
          >
            {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <div
          className={`w-full h-32 bg-cyber-bg border rounded-lg p-3 font-mono text-sm overflow-auto
                    ${error ? "border-cyber-accent" : "border-cyber-border"}`}
        >
          {error ? (
            <span className="text-cyber-accent">{error}</span>
          ) : (
            <span className="text-cyber-primary break-all">{output || "Output will appear here..."}</span>
          )}
        </div>
      </div>
    </div>
  );
}
