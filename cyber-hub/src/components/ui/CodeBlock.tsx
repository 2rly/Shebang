"use client";

import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import { Copy, Check } from "lucide-react";
import { registerLanguages } from "@/lib/prism-languages";

/* Register bash, powershell, docker, etc. into Prism */
registerLanguages();

/* ─── Custom cyberpunk theme ─── */
const cyberTheme: typeof themes.dracula = {
  plain: {
    color: "#e2e8f0",
    backgroundColor: "transparent",
  },
  styles: [
    // Comments — dimmed cyan
    {
      types: ["comment", "prolog", "doctype", "cdata"],
      style: { color: "#5a6a7a", fontStyle: "italic" as const },
    },
    // Strings — neon green
    {
      types: ["string", "attr-value", "template-string", "char"],
      style: { color: "#00ff9d" },
    },
    // Keywords — soft purple
    {
      types: ["keyword", "selector", "important", "atrule", "rule"],
      style: { color: "#c084fc", fontWeight: "bold" },
    },
    // Functions — bright blue
    {
      types: ["function", "function-variable", "method"],
      style: { color: "#38bdf8" },
    },
    // Variables, parameters — cyan
    {
      types: ["variable", "parameter", "interpolation", "attr-name"],
      style: { color: "#00d4ff" },
    },
    // Numbers, booleans — warm orange
    {
      types: ["number", "boolean", "constant", "symbol"],
      style: { color: "#fbbf24" },
    },
    // Operators, punctuation
    {
      types: ["operator", "entity", "url"],
      style: { color: "#ff006e" },
    },
    // Punctuation — muted
    {
      types: ["punctuation"],
      style: { color: "#7a8599" },
    },
    // Class names, type names — warm pink
    {
      types: ["class-name", "maybe-class-name", "builtin"],
      style: { color: "#f472b6" },
    },
    // Tags (HTML/JSX)
    {
      types: ["tag"],
      style: { color: "#ff006e" },
    },
    // Regex
    {
      types: ["regex"],
      style: { color: "#00ff9d" },
    },
    // Property
    {
      types: ["property"],
      style: { color: "#38bdf8" },
    },
    // Namespace
    {
      types: ["namespace"],
      style: { color: "#f472b6", opacity: 0.8 },
    },
    // Inserted
    {
      types: ["inserted"],
      style: { color: "#00ff9d" },
    },
    // Deleted
    {
      types: ["deleted"],
      style: { color: "#ff006e" },
    },
  ],
};

/* ─── Language display names ─── */
const langNames: Record<string, string> = {
  js: "JavaScript",
  jsx: "JSX",
  ts: "TypeScript",
  tsx: "TSX",
  py: "Python",
  python: "Python",
  bash: "Bash",
  sh: "Shell",
  shell: "Shell",
  powershell: "PowerShell",
  ps1: "PowerShell",
  ps: "PowerShell",
  css: "CSS",
  html: "HTML",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  sql: "SQL",
  go: "Go",
  rust: "Rust",
  c: "C",
  cpp: "C++",
  java: "Java",
  ruby: "Ruby",
  php: "PHP",
  dockerfile: "Dockerfile",
  docker: "Dockerfile",
  markdown: "Markdown",
  md: "Markdown",
  xml: "XML",
  toml: "TOML",
  ini: "INI",
  conf: "Config",
  nginx: "Nginx",
  lua: "Lua",
  perl: "Perl",
  r: "R",
  swift: "Swift",
  kotlin: "Kotlin",
  scala: "Scala",
  hcl: "HCL",
  terraform: "Terraform",
  tf: "Terraform",
};

/* ─── Map aliases to Prism language keys ─── */
const langAliases: Record<string, string> = {
  ps1: "powershell",
  ps: "powershell",
  sh: "bash",
  shell: "bash",
  py: "python",
  js: "javascript",
  ts: "typescript",
  yml: "yaml",
  docker: "dockerfile",
  md: "markdown",
  tf: "hcl",
  terraform: "hcl",
  conf: "ini",
  nginx: "nginx",
};

interface CodeBlockProps {
  code: string;
  language?: string;
}

export default function CodeBlock({ code, language = "" }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const lang = language.toLowerCase().trim();
  const prismLang = langAliases[lang] || lang || "bash";
  const displayName = langNames[lang] || lang.toUpperCase() || "CODE";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper group relative my-4 rounded-xl overflow-hidden">
      {/* Glassmorphism container */}
      <div className="code-block-glass">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
          {/* Language tag */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
              <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
              <div className="w-3 h-3 rounded-full bg-[#28c840]" />
            </div>
            <span className="code-block-lang-tag">
              {displayName}
            </span>
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="code-block-copy-btn"
            title="Copy to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Code content */}
        <div className="overflow-x-auto">
          <Highlight theme={cyberTheme} code={code.trimEnd()} language={prismLang}>
            {({ className, style, tokens, getLineProps, getTokenProps }) => (
              <pre
                className={`${className} px-4 py-4 text-sm font-mono leading-relaxed`}
                style={{ ...style, background: "transparent", margin: 0 }}
              >
                {tokens.map((line, i) => {
                  const lineProps = getLineProps({ line, key: i });
                  return (
                    <div key={i} {...lineProps} className="code-block-line">
                      <span className="code-block-line-number">
                        {i + 1}
                      </span>
                      <span className="code-block-line-content">
                        {line.map((token, key) => (
                          <span key={key} {...getTokenProps({ token, key })} />
                        ))}
                      </span>
                    </div>
                  );
                })}
              </pre>
            )}
          </Highlight>
        </div>
      </div>
    </div>
  );
}
