"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send,
  Terminal,
  AlertTriangle,
  Shield,
  FileSearch,
  Sparkles,
  Loader2,
  Trash2,
  Radio,
  BookOpen,
} from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  {
    icon: AlertTriangle,
    title: "CVE Intel",
    prompt: "What are the latest CVEs and patches from Release Radar?",
    color: "text-red-400",
  },
  {
    icon: Shield,
    title: "Firewall",
    prompt: "Help me configure iptables for a secure server",
    color: "text-[#00FF00]",
  },
  {
    icon: FileSearch,
    title: "Disk Error",
    prompt: "I'm getting DrvVD_DISKFULL error, how do I fix it?",
    color: "text-amber-400",
  },
  {
    icon: Terminal,
    title: "GRUB",
    prompt: "How to install GRUB bootloader step by step?",
    color: "text-cyan-400",
  },
  {
    icon: Radio,
    title: "Versions",
    prompt: "What is the latest version of Forcepoint DLP?",
    color: "text-purple-400",
  },
  {
    icon: BookOpen,
    title: "Kernel",
    prompt: "How do I diagnose a kernel panic from dmesg output?",
    color: "text-blue-400",
  },
];

const WELCOME_CONTENT = `\`\`\`
 ╔═══════════════════════════════════════╗
 ║  #! ASSISTANT — Senior CyberSec      ║
 ║  shebang.az Security Consultant v3.0  ║
 ╚═══════════════════════════════════════╝
\`\`\`

I'm the **#! Assistant** — a Senior Cybersecurity Consultant at shebang.az.

**Technical Expertise:**
- **Linux Internals** — kernel diagnostics, boot repair (GRUB), storage errors, systemd
- **Network Security** — firewall engineering, IDS/IPS tuning, packet analysis
- **Penetration Testing** — methodology, tools, authorized assessment guidance
- **SIEM/EDR** — deployment, detection rules, log correlation
- **Incident Response** — evidence preservation, forensics, containment playbooks
- **Cloud Security** — AWS/Azure/GCP hardening, container security

**Platform Integrations:**
- **Release Radar** — ask "What is the latest version of [product]?" for live data
- **Documentation** — SIEM, EDR, Firewalls, Hardening, Security Tools, Cloud guides
- **Shell Anatomy** — paste any command for interactive visual breakdown
- **Binary Intel** — package lookups across every major distro
- **Community** — trending discussions and knowledge sharing
- **Articles** — recently published, admin-reviewed content

\`\`\`
$ assistant --topics
  kernel-diagnostics | boot-repair | disk-errors | grub
  nmap | firewalls | passwords | siem | incident-response
  cve-intel | version-lookup | malware-analysis | hardening
\`\`\`

Ask a technical question, paste a command, or select a prompt below.`;

// ── Markdown renderer with color coding ──

function renderContent(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);

  return parts.map((part, i) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const lines = inner.split("\n");
      const firstLine = lines[0]?.trim();
      const isLangTag = firstLine && /^[a-zA-Z]+$/.test(firstLine);
      const code = isLangTag ? lines.slice(1).join("\n") : inner;

      return (
        <pre
          key={i}
          className="my-2 p-3 rounded-lg border overflow-x-auto"
          style={{
            background: "#0a0c10",
            borderColor: "#1a2332",
          }}
        >
          <code className="text-xs font-mono" style={{ color: "#00FF00" }}>
            {code.trim()}
          </code>
        </pre>
      );
    }

    // Inline markdown
    return (
      <span key={i}>
        {part.split("\n").map((line, li) => (
          <span key={li}>
            {li > 0 && <br />}
            {line.split(/(\*\*.*?\*\*|`[^`]+`|⚠️.*$|🔴.*$)/g).map((seg, si) => {
              if (seg.startsWith("**") && seg.endsWith("**")) {
                return (
                  <strong key={si} style={{ color: "#00FF00" }}>
                    {seg.slice(2, -2)}
                  </strong>
                );
              }
              if (seg.startsWith("`") && seg.endsWith("`")) {
                return (
                  <code
                    key={si}
                    className="px-1 py-0.5 rounded font-mono text-xs"
                    style={{ background: "#0a0c10", color: "#00FF00" }}
                  >
                    {seg.slice(1, -1)}
                  </code>
                );
              }
              // Red warning lines
              if (seg.startsWith("⚠️")) {
                return (
                  <span key={si} style={{ color: "#ff4444" }}>
                    {seg}
                  </span>
                );
              }
              if (seg.startsWith("🔴")) {
                return (
                  <span key={si} style={{ color: "#ff4444" }}>
                    {seg}
                  </span>
                );
              }
              return seg;
            })}
          </span>
        ))}
      </span>
    );
  });
}

// ── Blinking cursor component ──

function BlinkingCursor() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const id = setInterval(() => setVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  return (
    <span
      className="inline-block font-mono"
      style={{
        color: "#00FF00",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.1s",
      }}
    >
      █
    </span>
  );
}

// ── Typing animation component ──

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "rgba(0, 255, 0, 0.1)", border: "1px solid rgba(0, 255, 0, 0.2)" }}
      >
        <Terminal className="w-4 h-4" style={{ color: "#00FF00" }} />
      </div>
      <div
        className="rounded-lg p-4"
        style={{ background: "#0d1117", border: "1px solid #1a2332" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono" style={{ color: "#00FF00" }}>
            bash@shebang:~$
          </span>
          <span className="text-xs font-mono" style={{ color: "#4b5563" }}>
            processing
          </span>
          <Loader2 className="w-3 h-3 animate-spin" style={{ color: "#00FF00" }} />
          <BlinkingCursor />
        </div>
      </div>
    </div>
  );
}

export default function AssistantPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const welcomeMsg: Message = {
    id: "welcome",
    role: "assistant",
    content: WELCOME_CONTENT,
    timestamp: new Date(),
  };

  // Load conversation history for logged-in users
  useEffect(() => {
    if (!user) {
      setMessages([welcomeMsg]);
      setHistoryLoaded(true);
      return;
    }

    fetch("/api/assistant/history")
      .then((r) => (r.ok ? r.json() : { messages: [] }))
      .then((data) => {
        if (data.messages && data.messages.length > 0) {
          const restored: Message[] = data.messages.map((m: { id: string; role: "user" | "assistant"; content: string; timestamp: string }) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            timestamp: new Date(m.timestamp),
          }));
          setMessages([welcomeMsg, ...restored]);
        } else {
          setMessages([welcomeMsg]);
        }
      })
      .catch(() => setMessages([welcomeMsg]))
      .finally(() => setHistoryLoaded(true));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const clearHistory = async () => {
    if (!user) return;
    await fetch("/api/assistant/history", { method: "DELETE" });
    setMessages([welcomeMsg]);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim() || isTyping) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/assistant/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content.trim() }),
      });

      const data = await res.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.reply || "Segfault in `/dev/brain`. Try again?",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: "Connection to `/dev/brain` timed out. Check your network and try again.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  if (!historyLoaded) {
    return (
      <div className="h-full flex items-center justify-center" style={{ background: "#0a0c10" }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: "#00FF00" }} />
          <span className="text-xs font-mono" style={{ color: "#4b5563" }}>
            Loading session...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col" style={{ background: "#0a0c10" }}>
      {/* Scanline + glow CSS */}
      <style>{`
        @keyframes bash-scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
        .bash-terminal::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: rgba(0, 255, 0, 0.03);
          animation: bash-scanline 8s linear infinite;
          pointer-events: none;
          z-index: 1;
        }
      `}</style>

      {/* Header */}
      <div
        className="p-3 flex items-center justify-between flex-shrink-0"
        style={{ background: "#0d1117", borderBottom: "1px solid #1a2332" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="p-1.5 rounded-lg"
            style={{ background: "rgba(0, 255, 0, 0.1)", border: "1px solid rgba(0, 255, 0, 0.25)" }}
          >
            <Terminal className="w-5 h-5" style={{ color: "#00FF00" }} />
          </div>
          <div>
            <h1 className="font-mono text-sm font-bold flex items-center gap-2" style={{ color: "#e5e7eb" }}>
              #! Assistant
              <span
                className="px-1.5 py-0.5 text-[9px] rounded-full uppercase tracking-widest font-bold"
                style={{ background: "rgba(0, 255, 0, 0.1)", color: "#00FF00", border: "1px solid rgba(0, 255, 0, 0.2)" }}
              >
                Expert v3.0
              </span>
            </h1>
            <p className="text-[10px] font-mono" style={{ color: "#4b5563" }}>
              shebang.az — senior cybersecurity consultant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {user && messages.length > 1 && (
            <button
              onClick={clearHistory}
              className="flex items-center gap-1 px-2 py-1 rounded text-[10px] font-mono transition-colors hover:opacity-80"
              style={{ color: "#4b5563", border: "1px solid #1a2332" }}
              title="Clear conversation"
            >
              <Trash2 className="w-3 h-3" />
              clear
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#00FF00" }} />
            <span className="text-[10px] font-mono" style={{ color: "#4b5563" }}>PID 1337</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 relative bash-terminal">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0, 255, 0, 0.1)", border: "1px solid rgba(0, 255, 0, 0.2)" }}
              >
                <Terminal className="w-4 h-4" style={{ color: "#00FF00" }} />
              </div>
            )}

            <div
              className="max-w-[78%] rounded-lg p-4"
              style={
                message.role === "user"
                  ? { background: "rgba(0, 212, 255, 0.06)", border: "1px solid rgba(0, 212, 255, 0.15)" }
                  : { background: "#0d1117", border: "1px solid #1a2332" }
              }
            >
              {message.role === "assistant" && (
                <div
                  className="flex items-center gap-2 mb-2 pb-2"
                  style={{ borderBottom: "1px solid #1a2332" }}
                >
                  <span className="text-xs font-mono font-bold" style={{ color: "#00FF00" }}>
                    bash@shebang:~$
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: "#4b5563" }}>
                    {message.timestamp.toLocaleTimeString()}
                  </span>
                </div>
              )}
              <div
                className="text-sm leading-relaxed font-mono"
                style={{ color: "#c9d1d9" }}
              >
                {renderContent(message.content)}
              </div>
              {message.role === "user" && (
                <p className="text-[10px] mt-2 text-right font-mono" style={{ color: "#4b5563" }}>
                  {message.timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>

            {message.role === "user" && (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(0, 212, 255, 0.1)", border: "1px solid rgba(0, 212, 255, 0.2)" }}
              >
                <span className="text-xs font-mono font-bold" style={{ color: "#00d4ff" }}>$</span>
              </div>
            )}
          </div>
        ))}

        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-3 flex-shrink-0">
          <p className="text-[10px] mb-2 flex items-center gap-1 font-mono" style={{ color: "#4b5563" }}>
            <Sparkles className="w-3 h-3" />
            quick commands — click to execute
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {suggestedPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.title}
                  onClick={() => sendMessage(prompt.prompt)}
                  className="p-2.5 text-left rounded-lg transition-all duration-200 group hover:scale-[1.02]"
                  style={{ background: "#0d1117", border: "1px solid #1a2332" }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 255, 0, 0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "#1a2332";
                  }}
                >
                  <Icon className={`w-3.5 h-3.5 ${prompt.color} mb-1`} />
                  <p className="text-xs font-mono font-medium" style={{ color: "#c9d1d9" }}>
                    {prompt.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area — terminal style */}
      <div
        className="p-3 flex-shrink-0"
        style={{ background: "#0d1117", borderTop: "1px solid #1a2332" }}
      >
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div
            className="flex-1 flex items-center rounded-lg transition-all"
            style={{
              background: "#0a0c10",
              border: "1px solid #1a2332",
            }}
            onFocus={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(0, 255, 0, 0.4)";
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 12px rgba(0, 255, 0, 0.06)";
            }}
            onBlur={(e) => {
              (e.currentTarget as HTMLElement).style.borderColor = "#1a2332";
              (e.currentTarget as HTMLElement).style.boxShadow = "none";
            }}
          >
            <span className="pl-3 font-mono text-sm flex-shrink-0" style={{ color: "#00FF00" }}>
              root@shebang:~$
            </span>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="ask bash anything..."
              className="flex-1 bg-transparent px-2 py-2.5 outline-none font-mono text-sm"
              style={{ color: "#c9d1d9" }}
              disabled={isTyping}
            />
            {!input && !isTyping && (
              <span className="pr-3">
                <BlinkingCursor />
              </span>
            )}
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="mr-2 p-1.5 rounded transition-colors disabled:opacity-20"
              style={{ color: "#00FF00" }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </form>
        <div className="flex items-center justify-between mt-1.5 px-1">
          <p className="text-[9px] font-mono" style={{ color: "#4b5563" }}>
            {user ? `session: ${user.username} • history saved` : "anonymous session • sign in to save history"}
          </p>
          <p className="text-[9px] font-mono" style={{ color: "#4b5563" }}>
#! assistant v3.0 • expert-level + integrations
          </p>
        </div>
      </div>
    </div>
  );
}
