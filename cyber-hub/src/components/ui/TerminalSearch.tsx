"use client";

import { useState, useEffect, useRef } from "react";

interface TerminalSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  prefix?: string;
  className?: string;
}

export function TerminalSearch({
  value,
  onChange,
  placeholder = "search query",
  prefix = "search",
  className = "",
}: TerminalSearchProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [cursorVisible, setCursorVisible] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  // Blinking cursor effect
  useEffect(() => {
    if (isFocused) {
      const interval = setInterval(() => {
        setCursorVisible((v) => !v);
      }, 530);
      return () => clearInterval(interval);
    } else {
      setCursorVisible(false);
    }
  }, [isFocused]);

  return (
    <div
      className={`bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden transition-all duration-300 ${
        isFocused ? "border-cyber-primary shadow-[0_0_15px_rgba(0,255,157,0.15)]" : ""
      } ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      {/* Terminal Header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-cyber-surface border-b border-cyber-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-cyber-accent/80" />
          <div className="w-3 h-3 rounded-full bg-cyber-warning/80" />
          <div className="w-3 h-3 rounded-full bg-cyber-primary/80" />
        </div>
        <span className="text-[10px] font-mono text-cyber-muted ml-2">
          shebang@search:~
        </span>
      </div>

      {/* Terminal Input Area */}
      <div className="flex items-center px-3 py-3">
        {/* Prompt */}
        <div className="flex items-center gap-2 mr-2 flex-shrink-0">
          <span className="text-cyber-primary font-mono text-sm">┌──(</span>
          <span className="text-cyber-secondary font-mono text-sm font-bold">root</span>
          <span className="text-cyber-primary font-mono text-sm">㉿</span>
          <span className="text-cyber-secondary font-mono text-sm font-bold">shebang</span>
          <span className="text-cyber-primary font-mono text-sm">)-[</span>
          <span className="text-cyber-text font-mono text-sm">~/{prefix}</span>
          <span className="text-cyber-primary font-mono text-sm">]</span>
        </div>
      </div>

      <div className="flex items-center px-3 pb-3 -mt-1">
        <span className="text-cyber-primary font-mono text-sm mr-2">└─$</span>
        <div className="flex-1 relative flex items-center">
          <span className="text-cyber-muted font-mono text-sm mr-1">grep -i "</span>
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="w-full bg-transparent outline-none font-mono text-sm text-cyber-text caret-transparent"
              style={{ caretColor: "transparent" }}
            />
            {/* Custom cursor */}
            <span
              className={`absolute top-0 font-mono text-sm pointer-events-none transition-opacity ${
                cursorVisible && isFocused ? "opacity-100" : "opacity-0"
              }`}
              style={{
                left: `${value.length * 0.6}em`,
                color: "#00ff9d"
              }}
            >
              █
            </span>
            {/* Placeholder */}
            {!value && !isFocused && (
              <span className="absolute left-0 top-0 text-cyber-muted/50 font-mono text-sm pointer-events-none">
                {placeholder}
              </span>
            )}
          </div>
          <span className="text-cyber-muted font-mono text-sm ml-1">"</span>
        </div>
      </div>
    </div>
  );
}

// Simpler inline terminal search for smaller spaces
export function TerminalSearchInline({
  value,
  onChange,
  placeholder = "search...",
  className = "",
}: Omit<TerminalSearchProps, "prefix">) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex items-center bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2.5 transition-all duration-300 ${
        isFocused ? "border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.1)]" : ""
      } ${className}`}
      onClick={() => inputRef.current?.focus()}
    >
      <span className="text-cyber-primary font-mono text-sm mr-2">$</span>
      <span className="text-cyber-muted font-mono text-sm mr-2">grep</span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent outline-none font-mono text-sm text-cyber-text placeholder:text-cyber-muted/50"
      />
      {isFocused && (
        <span className="text-cyber-primary font-mono text-sm animate-pulse">_</span>
      )}
    </div>
  );
}

// Mini terminal search with just prompt
export function TerminalSearchMini({
  value,
  onChange,
  placeholder = "search...",
  className = "",
}: Omit<TerminalSearchProps, "prefix">) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex items-center bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden transition-all duration-300 ${
        isFocused ? "border-cyber-primary shadow-[0_0_10px_rgba(0,255,157,0.1)]" : ""
      } ${className}`}
    >
      <div className="bg-cyber-surface px-3 py-2.5 border-r border-cyber-border">
        <span className="text-cyber-primary font-mono text-sm">root@shebang:~$</span>
      </div>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="flex-1 bg-transparent px-3 py-2.5 outline-none font-mono text-sm text-cyber-text placeholder:text-cyber-muted/50"
      />
      {value && (
        <div className="px-3 py-2.5 border-l border-cyber-border">
          <span className="text-cyber-muted font-mono text-xs">{value.length} chars</span>
        </div>
      )}
    </div>
  );
}
