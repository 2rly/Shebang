"use client";

import { useState, useRef, useEffect } from "react";
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  AlertTriangle,
  Shield,
  FileSearch,
  Terminal,
  Loader2,
} from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const suggestedPrompts = [
  {
    icon: AlertTriangle,
    title: "Analyze CVE",
    prompt: "Analyze CVE-2024-XXXX and provide remediation steps",
  },
  {
    icon: Shield,
    title: "Security Review",
    prompt: "Review this firewall rule configuration for security issues",
  },
  {
    icon: FileSearch,
    title: "Log Analysis",
    prompt: "Help me understand these suspicious log entries",
  },
  {
    icon: Terminal,
    title: "Script Help",
    prompt: "Write a Python script to scan for open ports",
  },
];

const initialMessages: Message[] = [
  {
    id: "welcome",
    role: "assistant",
    content: `Welcome to **#! Assistant** — shebang.az's security AI. I'm here to help you with:

- **Threat Analysis**: CVE research, malware behavior, attack patterns
- **Security Configurations**: Firewall rules, SIEM queries, EDR policies
- **Incident Response**: Playbook guidance, investigation techniques
- **Code Review**: Security-focused code analysis and scripts

How can I assist you today?`,
    timestamp: new Date(),
  },
];

export default function AssistantPage() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: content.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I understand you're asking about: "${content.trim()}"

This is a **UI demonstration** of the Cyber Assistant interface. In a production environment, this would connect to:

- **Claude API** or similar LLM for intelligent responses
- **Threat intelligence feeds** for real-time CVE data
- **Internal knowledge base** for organization-specific guidance

To implement the full functionality, you'll need to:
1. Set up an API route at \`/api/chat\`
2. Integrate with your preferred AI provider
3. Add context about your security environment

Would you like me to explain how to set this up?`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);
    }, 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-cyber-border bg-cyber-surface">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyber-primary/20 rounded-lg">
              <Bot className="w-6 h-6 text-cyber-primary" />
            </div>
            <div>
              <h1 className="font-semibold text-cyber-text flex items-center gap-2">
                <span className="text-cyber-secondary">#!</span> Assistant
                <span className="px-2 py-0.5 text-xs bg-cyber-secondary/20 text-cyber-secondary rounded-full">
                  BETA
                </span>
              </h1>
              <p className="text-xs text-cyber-muted">
                shebang.az — AI-powered security analysis
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-cyber-primary rounded-full animate-pulse" />
            <span className="text-xs font-mono text-cyber-muted">Online</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex gap-3 ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {message.role === "assistant" && (
              <div className="w-8 h-8 rounded-lg bg-cyber-primary/20 flex items-center justify-center flex-shrink-0">
                <Bot className="w-5 h-5 text-cyber-primary" />
              </div>
            )}

            <div
              className={`max-w-[70%] p-4 rounded-lg ${
                message.role === "user"
                  ? "bg-cyber-primary/20 border border-cyber-primary/30"
                  : "bg-cyber-surface border border-cyber-border"
              }`}
            >
              <div className="prose prose-invert prose-sm">
                {message.content.split("\n").map((line, i) => (
                  <p key={i} className="mb-2 last:mb-0 text-cyber-text text-sm">
                    {line.split(/(\*\*.*?\*\*)/g).map((part, j) =>
                      part.startsWith("**") && part.endsWith("**") ? (
                        <strong key={j} className="text-cyber-primary">
                          {part.slice(2, -2)}
                        </strong>
                      ) : part.startsWith("`") && part.endsWith("`") ? (
                        <code
                          key={j}
                          className="px-1 py-0.5 bg-cyber-bg rounded text-cyber-secondary font-mono text-xs"
                        >
                          {part.slice(1, -1)}
                        </code>
                      ) : (
                        part
                      )
                    )}
                  </p>
                ))}
              </div>
              <p className="text-xs text-cyber-muted mt-2">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>

            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-cyber-secondary/20 flex items-center justify-center flex-shrink-0">
                <User className="w-5 h-5 text-cyber-secondary" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-primary/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyber-primary" />
            </div>
            <div className="bg-cyber-surface border border-cyber-border rounded-lg p-4">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-cyber-primary animate-spin" />
                <span className="text-sm text-cyber-muted">Analyzing...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="px-4 pb-4">
          <p className="text-xs text-cyber-muted mb-2 flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Suggested prompts
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {suggestedPrompts.map((prompt) => {
              const Icon = prompt.icon;
              return (
                <button
                  key={prompt.title}
                  onClick={() => sendMessage(prompt.prompt)}
                  className="p-3 text-left bg-cyber-surface border border-cyber-border rounded-lg
                           hover:border-cyber-primary/50 transition-colors group"
                >
                  <Icon className="w-4 h-4 text-cyber-muted group-hover:text-cyber-primary mb-1" />
                  <p className="text-sm font-medium text-cyber-text">
                    {prompt.title}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="p-4 border-t border-cyber-border bg-cyber-surface">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about threats, configurations, or security best practices..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-4 py-3 pr-12
                       focus:border-cyber-primary focus:outline-none focus:ring-1 focus:ring-cyber-primary/50
                       placeholder:text-cyber-muted transition-all"
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-cyber-muted
                       hover:text-cyber-primary disabled:opacity-50 disabled:hover:text-cyber-muted
                       transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </form>
        <p className="text-xs text-cyber-muted mt-2 text-center">
          Cyber Assistant provides guidance only. Always verify critical security decisions.
        </p>
      </div>
    </div>
  );
}
