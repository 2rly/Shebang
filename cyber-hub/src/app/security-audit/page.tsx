"use client";

import { useState, useCallback } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  Info,
  Loader2,
  Copy,
  Check,
  Trash2,
  ChevronDown,
  ChevronUp,
  Bug,
  FileCode,
} from "lucide-react";

// --- Types ---

type Severity = "Critical" | "High" | "Medium" | "Low" | "Info";

interface Finding {
  severity: Severity;
  name: string;
  cweId: string;
  location: string;
  description: string;
  remediation: string;
  riskScore: number;
}

interface AuditResult {
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
    overallRisk: string;
  };
  findings: Finding[];
}

// --- Severity Config ---

const SEVERITY_CONFIG: Record<Severity, { color: string; icon: typeof AlertTriangle; bg: string }> = {
  Critical: { color: "text-red-500", icon: AlertTriangle, bg: "bg-red-500/10 border-red-500/30" },
  High: { color: "text-cyber-accent", icon: AlertCircle, bg: "bg-cyber-accent/10 border-cyber-accent/30" },
  Medium: { color: "text-cyber-warning", icon: AlertTriangle, bg: "bg-cyber-warning/10 border-cyber-warning/30" },
  Low: { color: "text-cyber-secondary", icon: Info, bg: "bg-cyber-secondary/10 border-cyber-secondary/30" },
  Info: { color: "text-cyber-muted", icon: Info, bg: "bg-cyber-muted/10 border-cyber-muted/30" },
};

// --- Static Analysis Engine ---

function analyzeCode(code: string, language: string): AuditResult {
  const findings: Finding[] = [];
  const lines = code.split("\n");

  // Helper to find line numbers matching a pattern
  const findLines = (pattern: RegExp): string => {
    const matches: number[] = [];
    lines.forEach((line, i) => {
      if (pattern.test(line)) matches.push(i + 1);
    });
    return matches.length > 0 ? `Line(s): ${matches.join(", ")}` : "General";
  };

  // ====== SQL Injection (CWE-89) ======
  const sqlConcatPattern = /(?:query|sql|execute|raw)\s*\(?\s*[`"'].*\$\{|(?:query|sql|execute|raw)\s*\(?\s*[`"'].*\+\s*(?:req|request|params|query|body|input|user)/i;
  if (sqlConcatPattern.test(code)) {
    findings.push({
      severity: "Critical",
      name: "SQL Injection — String Concatenation in Query",
      cweId: "CWE-89",
      location: findLines(sqlConcatPattern),
      description: "User input is concatenated directly into an SQL query string. An attacker can inject arbitrary SQL to read, modify, or delete data, or execute system commands.",
      remediation: "Use parameterized queries or prepared statements. Example:\n// BAD: db.query(`SELECT * FROM users WHERE id = ${id}`)\n// GOOD: db.query('SELECT * FROM users WHERE id = $1', [id])",
      riskScore: 9.8,
    });
  }

  // ====== XSS: dangerouslySetInnerHTML (CWE-79) ======
  const dangerousHtmlPattern = /dangerouslySetInnerHTML/;
  if (dangerousHtmlPattern.test(code)) {
    findings.push({
      severity: "Critical",
      name: "Cross-Site Scripting (XSS) — dangerouslySetInnerHTML",
      cweId: "CWE-79",
      location: findLines(dangerousHtmlPattern),
      description: "Using dangerouslySetInnerHTML renders raw HTML into the DOM. If the content includes unsanitized user input, an attacker can inject scripts that steal cookies, session tokens, or redirect users.",
      remediation: "Sanitize HTML with DOMPurify before rendering:\nimport DOMPurify from 'dompurify';\n<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />",
      riskScore: 8.5,
    });
  }

  // ====== XSS: innerHTML (CWE-79) ======
  const innerHtmlPattern = /\.innerHTML\s*=(?!=)/;
  if (innerHtmlPattern.test(code)) {
    findings.push({
      severity: "High",
      name: "Cross-Site Scripting (XSS) — innerHTML Assignment",
      cweId: "CWE-79",
      location: findLines(innerHtmlPattern),
      description: "Assigning user-controlled data to .innerHTML allows arbitrary HTML/JavaScript execution in the victim's browser.",
      remediation: "Use .textContent for plain text, or sanitize with DOMPurify:\nelement.textContent = userInput; // Safe\nelement.innerHTML = DOMPurify.sanitize(userInput); // If HTML needed",
      riskScore: 8.0,
    });
  }

  // ====== eval() / Function() (CWE-95) ======
  const evalPattern = /\beval\s*\(|new\s+Function\s*\(/;
  if (evalPattern.test(code)) {
    findings.push({
      severity: "Critical",
      name: "Code Injection — eval() / new Function()",
      cweId: "CWE-95",
      location: findLines(evalPattern),
      description: "eval() and new Function() execute arbitrary code at runtime. If user input reaches these functions, an attacker can execute arbitrary JavaScript in the application context.",
      remediation: "Remove eval() entirely. Use JSON.parse() for JSON data, or use a sandboxed interpreter if dynamic code execution is required.",
      riskScore: 9.5,
    });
  }

  // ====== Hardcoded Secrets (CWE-798) ======
  const secretPatterns = [
    /(?:api[_-]?key|apikey|secret|password|token|auth)\s*[:=]\s*["'][a-zA-Z0-9+/=_-]{8,}["']/i,
    /(?:AKIA|AIza|sk-|ghp_|gho_|glpat-)[a-zA-Z0-9]{10,}/,
    /(?:Bearer|Basic)\s+[a-zA-Z0-9+/=_-]{20,}/,
  ];
  for (const pattern of secretPatterns) {
    if (pattern.test(code)) {
      findings.push({
        severity: "Critical",
        name: "Hardcoded Secret / API Key",
        cweId: "CWE-798",
        location: findLines(pattern),
        description: "Credentials, API keys, or tokens are hardcoded in source code. Anyone with access to the code can extract and abuse these secrets.",
        remediation: "Move secrets to environment variables:\n// BAD: const API_KEY = 'sk-abc123...';\n// GOOD: const API_KEY = process.env.API_KEY;",
        riskScore: 9.0,
      });
      break;
    }
  }

  // ====== SSRF (CWE-918) ======
  const ssrfPattern = /fetch\s*\(\s*(?:`[^`]*\$\{|[^)]*\+\s*(?:req|request|params|query|body|input|user|url))/i;
  if (ssrfPattern.test(code)) {
    findings.push({
      severity: "High",
      name: "Server-Side Request Forgery (SSRF)",
      cweId: "CWE-918",
      location: findLines(ssrfPattern),
      description: "User input is used to construct a URL for server-side requests. An attacker can redirect the server to make requests to internal services, metadata endpoints (169.254.169.254), or other unintended targets.",
      remediation: "Validate and allowlist destination URLs:\nconst ALLOWED_HOSTS = ['api.example.com'];\nconst url = new URL(userInput);\nif (!ALLOWED_HOSTS.includes(url.hostname)) throw new Error('Blocked');",
      riskScore: 8.5,
    });
  }

  // ====== Command Injection (CWE-78) ======
  const cmdInjPattern = /(?:exec|spawn|execSync|execFile|system)\s*\([^)]*(?:\$\{|`|\+\s*(?:req|request|params|query|body|input|user))/i;
  if (cmdInjPattern.test(code)) {
    findings.push({
      severity: "Critical",
      name: "OS Command Injection",
      cweId: "CWE-78",
      location: findLines(cmdInjPattern),
      description: "User input is passed to a shell command execution function. An attacker can chain arbitrary OS commands using ; | & etc.",
      remediation: "Use parameterized APIs instead of shell commands:\n// BAD: exec(`ping ${userIP}`)\n// GOOD: execFile('ping', ['-c', '1', validatedIP])",
      riskScore: 9.8,
    });
  }

  // ====== Path Traversal (CWE-22) ======
  const pathTraversalPattern = /(?:readFile|writeFile|createReadStream|readdir|unlink|access|open)\s*\([^)]*(?:\$\{|`|\+\s*(?:req|request|params|query|body|input|user|filename|path|file))/i;
  if (pathTraversalPattern.test(code)) {
    findings.push({
      severity: "High",
      name: "Path Traversal — Unvalidated File Access",
      cweId: "CWE-22",
      location: findLines(pathTraversalPattern),
      description: "User input is used directly in file system operations. An attacker can use ../ sequences to access files outside the intended directory.",
      remediation: "Use path.resolve() and validate the result:\nconst safePath = path.resolve(BASE_DIR, userInput);\nif (!safePath.startsWith(BASE_DIR)) throw new Error('Invalid path');",
      riskScore: 7.5,
    });
  }

  // ====== Insecure Deserialization (CWE-502) ======
  const deserPattern = /JSON\.parse\s*\(\s*(?:req|request|body|input|user|data)/i;
  if (deserPattern.test(code)) {
    findings.push({
      severity: "Medium",
      name: "Insecure Deserialization — Unvalidated JSON.parse",
      cweId: "CWE-502",
      location: findLines(deserPattern),
      description: "JSON.parse on untrusted input without schema validation can lead to prototype pollution or unexpected object structures that bypass security checks.",
      remediation: "Validate parsed data with a schema validator:\nimport { z } from 'zod';\nconst schema = z.object({ name: z.string() });\nconst data = schema.parse(JSON.parse(body));",
      riskScore: 6.5,
    });
  }

  // ====== Missing CSRF Protection (CWE-352) ======
  const csrfPattern = /(?:app\.post|app\.put|app\.delete|router\.post|router\.put|router\.delete)\s*\(/;
  if (csrfPattern.test(code) && !/csrf|csrfToken|x-csrf/i.test(code)) {
    findings.push({
      severity: "Medium",
      name: "Missing CSRF Protection",
      cweId: "CWE-352",
      location: findLines(csrfPattern),
      description: "State-changing endpoints (POST/PUT/DELETE) don't appear to implement CSRF token validation. An attacker can trick authenticated users into making unwanted requests.",
      remediation: "Implement CSRF tokens for all state-changing endpoints:\napp.use(csrf({ cookie: true }));\n// Or use SameSite=Strict cookies and verify Origin header",
      riskScore: 6.0,
    });
  }

  // ====== Weak Crypto (CWE-327) ======
  const weakCryptoPattern = /(?:createHash|crypto\.hash)\s*\(\s*['"](?:md5|sha1)['"]/i;
  if (weakCryptoPattern.test(code)) {
    findings.push({
      severity: "Medium",
      name: "Weak Cryptographic Algorithm",
      cweId: "CWE-327",
      location: findLines(weakCryptoPattern),
      description: "MD5 and SHA-1 are cryptographically broken. They should not be used for passwords, signatures, or integrity verification.",
      remediation: "Use SHA-256 or stronger:\n// BAD: crypto.createHash('md5')\n// GOOD: crypto.createHash('sha256')\n// For passwords: use bcrypt or argon2",
      riskScore: 5.5,
    });
  }

  // ====== Unvalidated Redirect (CWE-601) ======
  const redirectPattern = /(?:redirect|location\.href|window\.location|res\.redirect)\s*(?:\(|=)\s*(?:req|request|params|query|body|input|user|url)/i;
  if (redirectPattern.test(code)) {
    findings.push({
      severity: "Medium",
      name: "Open Redirect — Unvalidated Redirect Target",
      cweId: "CWE-601",
      location: findLines(redirectPattern),
      description: "User input controls a redirect destination. Attackers can craft links that appear to come from your domain but redirect to malicious sites for phishing.",
      remediation: "Validate redirect URLs against an allowlist:\nconst ALLOWED = ['/dashboard', '/profile'];\nif (!ALLOWED.includes(target)) target = '/';",
      riskScore: 5.0,
    });
  }

  // ====== console.log with sensitive data (CWE-532) ======
  const logLeakPattern = /console\.log\s*\([^)]*(?:password|secret|token|key|auth|credential|ssn|credit)/i;
  if (logLeakPattern.test(code)) {
    findings.push({
      severity: "Low",
      name: "Sensitive Data Exposure in Logs",
      cweId: "CWE-532",
      location: findLines(logLeakPattern),
      description: "Sensitive data (passwords, tokens, keys) is being logged. Log data can be accessed by operations staff, aggregated in monitoring systems, or leaked through log management tools.",
      remediation: "Never log sensitive data:\n// BAD: console.log('User password:', password)\n// GOOD: console.log('User authenticated:', userId)",
      riskScore: 4.0,
    });
  }

  // ====== Regex DoS (CWE-1333) ======
  const regexDosPattern = /new RegExp\s*\(\s*(?:req|request|params|query|body|input|user)/i;
  if (regexDosPattern.test(code)) {
    findings.push({
      severity: "Medium",
      name: "Regular Expression DoS (ReDoS)",
      cweId: "CWE-1333",
      location: findLines(regexDosPattern),
      description: "User input is used to construct a regular expression. Maliciously crafted patterns can cause catastrophic backtracking, leading to denial of service.",
      remediation: "Never pass user input to RegExp. If needed, escape special characters:\nfunction escapeRegex(s) { return s.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&'); }",
      riskScore: 6.0,
    });
  }

  // ====== No Error Handling (CWE-755) ======
  if (/(?:async\s+function|=>\s*\{)/.test(code) && !/try\s*\{|\.catch\s*\(/.test(code)) {
    findings.push({
      severity: "Low",
      name: "Missing Error Handling",
      cweId: "CWE-755",
      location: "General — async functions without try/catch",
      description: "Async functions lack error handling. Unhandled exceptions can crash the application, expose stack traces, or leave resources in an inconsistent state.",
      remediation: "Wrap async operations in try/catch:\ntry {\n  const data = await fetchData();\n} catch (err) {\n  logger.error('Fetch failed', err);\n  return res.status(500).json({ error: 'Internal error' });\n}",
      riskScore: 3.0,
    });
  }

  // ====== Language-specific checks ======

  // Python: subprocess with shell=True
  if ((language === "python" || language === "py") && /subprocess.*shell\s*=\s*True/i.test(code)) {
    findings.push({
      severity: "Critical",
      name: "OS Command Injection — subprocess shell=True",
      cweId: "CWE-78",
      location: findLines(/subprocess.*shell\s*=\s*True/i),
      description: "Using subprocess with shell=True passes the command through the system shell, enabling command injection if user input is included.",
      remediation: "Use shell=False (default) and pass arguments as a list:\n# BAD: subprocess.run(f'ls {user_dir}', shell=True)\n# GOOD: subprocess.run(['ls', user_dir])",
      riskScore: 9.5,
    });
  }

  // Python: pickle
  if ((language === "python" || language === "py") && /pickle\.loads?\s*\(/i.test(code)) {
    findings.push({
      severity: "Critical",
      name: "Insecure Deserialization — pickle",
      cweId: "CWE-502",
      location: findLines(/pickle\.loads?\s*\(/i),
      description: "pickle.load() can execute arbitrary code during deserialization. Never unpickle data from untrusted sources.",
      remediation: "Use JSON or a safe serialization format:\n# BAD: data = pickle.loads(request.data)\n# GOOD: data = json.loads(request.data)",
      riskScore: 9.5,
    });
  }

  // Go: fmt.Sprintf in SQL
  if ((language === "go" || language === "golang") && /fmt\.Sprintf.*(?:SELECT|INSERT|UPDATE|DELETE)/i.test(code)) {
    findings.push({
      severity: "Critical",
      name: "SQL Injection — fmt.Sprintf in Query",
      cweId: "CWE-89",
      location: findLines(/fmt\.Sprintf.*(?:SELECT|INSERT|UPDATE|DELETE)/i),
      description: "String formatting is used to build SQL queries. This allows SQL injection attacks.",
      remediation: "Use parameterized queries:\n// BAD: db.Query(fmt.Sprintf(\"SELECT * FROM users WHERE id = %s\", id))\n// GOOD: db.Query(\"SELECT * FROM users WHERE id = $1\", id)",
      riskScore: 9.8,
    });
  }

  // If nothing found
  if (findings.length === 0) {
    findings.push({
      severity: "Info",
      name: "No Vulnerabilities Detected",
      cweId: "N/A",
      location: "N/A",
      description: "The static analysis did not detect common vulnerability patterns. Note: this does not guarantee the code is secure — complex logic flaws, business logic issues, and context-specific vulnerabilities require manual review.",
      remediation: "Continue to follow secure coding practices. Consider running SAST tools (Semgrep, CodeQL) and DAST tools (OWASP ZAP) for deeper analysis.",
      riskScore: 0,
    });
  }

  // Sort by risk score descending
  findings.sort((a, b) => b.riskScore - a.riskScore);

  const summary = {
    critical: findings.filter((f) => f.severity === "Critical").length,
    high: findings.filter((f) => f.severity === "High").length,
    medium: findings.filter((f) => f.severity === "Medium").length,
    low: findings.filter((f) => f.severity === "Low").length,
    info: findings.filter((f) => f.severity === "Info").length,
    overallRisk:
      findings.some((f) => f.severity === "Critical") ? "Critical" :
      findings.some((f) => f.severity === "High") ? "High" :
      findings.some((f) => f.severity === "Medium") ? "Medium" :
      findings.some((f) => f.severity === "Low") ? "Low" : "Clean",
  };

  return { summary, findings };
}

// --- Example Vulnerable Code Samples ---

const EXAMPLES: Record<string, { label: string; language: string; code: string }> = {
  sqli: {
    label: "SQL Injection",
    language: "javascript",
    code: `const express = require('express');
const app = express();
const db = require('./db');

app.get('/user', async (req, res) => {
  const userId = req.query.id;
  const result = await db.query(\`SELECT * FROM users WHERE id = \${userId}\`);
  res.json(result.rows);
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const sql = "SELECT * FROM users WHERE username = '" + username + "' AND password = '" + password + "'";
  const result = await db.query(sql);
  res.json({ success: result.rows.length > 0 });
});`,
  },
  xss: {
    label: "XSS + Secrets",
    language: "javascript",
    code: `import React from 'react';

const API_KEY = "sk-abc123secretkey456def789";

function Comment({ text }) {
  return <div dangerouslySetInnerHTML={{ __html: text }} />;
}

function UserProfile({ bio }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    ref.current.innerHTML = bio;
  }, [bio]);
  return <div ref={ref} />;
}

function Search() {
  const userInput = new URLSearchParams(location.search).get('q');
  const regex = new RegExp(userInput);
  return <div>{regex.test('hello') ? 'match' : 'no match'}</div>;
}`,
  },
  python: {
    label: "Python Vulns",
    language: "python",
    code: `import subprocess
import pickle
import hashlib

def run_command(user_input):
    result = subprocess.run(f"ls {user_input}", shell=True, capture_output=True)
    return result.stdout

def load_session(data):
    session = pickle.loads(data)
    return session

def hash_password(password):
    return hashlib.md5(password.encode()).hexdigest()

def search_users(query):
    sql = f"SELECT * FROM users WHERE name LIKE '%{query}%'"
    cursor.execute(sql)
    return cursor.fetchall()

def log_login(user, password):
    print(f"Login attempt: user={user}, password={password}")`,
  },
  clean: {
    label: "Clean Code",
    language: "javascript",
    code: `import { z } from 'zod';
import bcrypt from 'bcrypt';
import { db } from './database';

const UserSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128),
});

export async function createUser(req, res) {
  try {
    const { email, password } = UserSchema.parse(req.body);
    const hash = await bcrypt.hash(password, 12);
    await db.query('INSERT INTO users (email, password) VALUES ($1, $2)', [email, hash]);
    res.status(201).json({ message: 'User created' });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input' });
    }
    console.error('User creation failed:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
}`,
  },
};

// --- Languages ---

const LANGUAGES = [
  "javascript", "typescript", "python", "go", "java", "php", "ruby", "c", "cpp", "csharp", "rust", "shell",
];

// --- Page Component ---

export default function SecurityAuditPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [result, setResult] = useState<AuditResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedFindings, setExpandedFindings] = useState<Set<number>>(new Set());

  const runAudit = useCallback(() => {
    if (!code.trim()) return;
    setScanning(true);
    setResult(null);
    // Simulate brief scanning delay for UX
    setTimeout(() => {
      const auditResult = analyzeCode(code, language);
      setResult(auditResult);
      // Auto-expand all findings
      setExpandedFindings(new Set(auditResult.findings.map((_, i) => i)));
      setScanning(false);
    }, 800);
  }, [code, language]);

  const loadExample = (key: string) => {
    const ex = EXAMPLES[key];
    setCode(ex.code);
    setLanguage(ex.language);
    setResult(null);
  };

  const copyReport = async () => {
    if (!result) return;
    const report = result.findings
      .map(
        (f, i) =>
          `[${f.severity}] ${f.name}\n  CWE: ${f.cweId} | Risk: ${f.riskScore}/10\n  Location: ${f.location}\n  ${f.description}\n  Fix: ${f.remediation}\n`
      )
      .join("\n");
    await navigator.clipboard.writeText(report);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleFinding = (index: number) => {
    setExpandedFindings((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const riskColor = (risk: string) => {
    switch (risk) {
      case "Critical": return "text-red-500";
      case "High": return "text-cyber-accent";
      case "Medium": return "text-cyber-warning";
      case "Low": return "text-cyber-secondary";
      default: return "text-cyber-primary";
    }
  };

  return (
    <div className="p-6 h-full flex flex-col">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-cyber-text flex items-center gap-3">
          <div className="p-2 bg-cyber-accent/20 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-cyber-accent" />
          </div>
          <span>
            AI Code <span className="text-cyber-accent">Security Auditor</span>
          </span>
        </h1>
        <p className="text-sm text-cyber-muted mt-2">
          Static analysis for OWASP Top 10, SANS Top 25, and CWE vulnerabilities — paste code and scan
        </p>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">
        {/* Left: Code Input */}
        <div className="flex-1 flex flex-col min-h-0">
          {/* Controls */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-cyber-bg border border-cyber-border rounded-lg px-3 py-1.5 text-xs font-mono text-cyber-text
                         focus:border-cyber-accent focus:outline-none"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>

              <div className="flex gap-1 ml-2">
                {Object.entries(EXAMPLES).map(([key, ex]) => (
                  <button
                    key={key}
                    onClick={() => loadExample(key)}
                    className="text-[10px] text-cyber-muted hover:text-cyber-accent transition-colors
                             px-2 py-1 rounded bg-cyber-bg border border-cyber-border/50 hover:border-cyber-accent/30"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { setCode(""); setResult(null); }}
                className="p-1.5 text-cyber-muted hover:text-cyber-accent transition-colors"
                title="Clear"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={runAudit}
                disabled={!code.trim() || scanning}
                className="cyber-btn flex items-center gap-2 px-4 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Bug className="w-4 h-4" />
                )}
                {scanning ? "Scanning..." : "Audit Code"}
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here for security analysis...

Supported: JavaScript, TypeScript, Python, Go, Java, PHP, Ruby, C/C++, Rust, Shell

Detects: SQL Injection, XSS, SSRF, Command Injection, Hardcoded Secrets, Path Traversal, Weak Crypto, CSRF, ReDoS, Insecure Deserialization, and more."
            className="flex-1 bg-cyber-bg border border-cyber-border rounded-lg p-4 font-mono text-sm text-cyber-text
                     focus:border-cyber-accent focus:outline-none resize-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Right: Results */}
        <div className="w-[480px] flex-shrink-0 flex flex-col min-h-0">
          {!result && !scanning && (
            <div className="flex-1 flex flex-col items-center justify-center text-center bg-cyber-surface border border-cyber-border rounded-lg p-8">
              <FileCode className="w-12 h-12 text-cyber-muted mb-4" />
              <h3 className="text-sm font-medium text-cyber-text mb-2">No Code Scanned</h3>
              <p className="text-xs text-cyber-muted max-w-xs">
                Paste code on the left and click &quot;Audit Code&quot; to scan for vulnerabilities.
                Try an example to see the auditor in action.
              </p>
              <div className="flex gap-2 mt-4">
                {Object.entries(EXAMPLES).map(([key, ex]) => (
                  <button
                    key={key}
                    onClick={() => { loadExample(key); setTimeout(runAudit, 100); }}
                    className="text-[10px] px-2 py-1 rounded bg-cyber-accent/10 text-cyber-accent border border-cyber-accent/30
                             hover:bg-cyber-accent/20 transition-colors"
                  >
                    {ex.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {scanning && (
            <div className="flex-1 flex flex-col items-center justify-center bg-cyber-surface border border-cyber-border rounded-lg">
              <Loader2 className="w-10 h-10 text-cyber-accent animate-spin mb-4" />
              <p className="text-sm text-cyber-text font-mono">Analyzing code...</p>
              <p className="text-xs text-cyber-muted mt-1">Checking OWASP Top 10, SANS Top 25, CWE patterns</p>
            </div>
          )}

          {result && !scanning && (
            <div className="flex-1 flex flex-col min-h-0 bg-cyber-surface border border-cyber-border rounded-lg overflow-hidden">
              {/* Summary Header */}
              <div className="p-4 border-b border-cyber-border">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-cyber-text">Audit Results</h3>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-mono font-bold ${riskColor(result.summary.overallRisk)}`}>
                      {result.summary.overallRisk.toUpperCase()} RISK
                    </span>
                    <button
                      onClick={copyReport}
                      className="flex items-center gap-1 text-[10px] text-cyber-muted hover:text-cyber-accent transition-colors px-2 py-0.5 rounded border border-cyber-border/50"
                    >
                      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      {copied ? "Copied" : "Copy"}
                    </button>
                  </div>
                </div>

                {/* Severity Counts */}
                <div className="flex gap-2">
                  {[
                    { label: "Critical", count: result.summary.critical, color: "bg-red-500/20 text-red-500 border-red-500/30" },
                    { label: "High", count: result.summary.high, color: "bg-cyber-accent/20 text-cyber-accent border-cyber-accent/30" },
                    { label: "Medium", count: result.summary.medium, color: "bg-cyber-warning/20 text-cyber-warning border-cyber-warning/30" },
                    { label: "Low", count: result.summary.low, color: "bg-cyber-secondary/20 text-cyber-secondary border-cyber-secondary/30" },
                    { label: "Info", count: result.summary.info, color: "bg-cyber-muted/20 text-cyber-muted border-cyber-muted/30" },
                  ]
                    .filter((s) => s.count > 0)
                    .map((s) => (
                      <span key={s.label} className={`text-[10px] font-mono px-2 py-0.5 rounded border ${s.color}`}>
                        {s.count} {s.label}
                      </span>
                    ))}
                </div>
              </div>

              {/* Findings List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {result.findings.map((finding, i) => {
                  const config = SEVERITY_CONFIG[finding.severity];
                  const Icon = config.icon;
                  const isExpanded = expandedFindings.has(i);

                  return (
                    <div key={i} className={`rounded-lg border overflow-hidden ${config.bg}`}>
                      <button
                        onClick={() => toggleFinding(i)}
                        className="w-full flex items-center gap-2.5 p-3 text-left hover:bg-white/5 transition-colors"
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${config.color}`}>{finding.severity}</span>
                            <span className="text-xs text-cyber-text font-medium truncate">{finding.name}</span>
                          </div>
                          <div className="flex items-center gap-3 mt-0.5">
                            <span className="text-[10px] font-mono text-cyber-muted">{finding.cweId}</span>
                            <span className="text-[10px] font-mono text-cyber-muted">CVSS: {finding.riskScore}</span>
                            <span className="text-[10px] text-cyber-muted">{finding.location}</span>
                          </div>
                        </div>
                        {isExpanded ? (
                          <ChevronUp className="w-3.5 h-3.5 text-cyber-muted shrink-0" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5 text-cyber-muted shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="px-3 pb-3 space-y-2 border-t border-white/5">
                          <div className="mt-2">
                            <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Description</p>
                            <p className="text-xs text-cyber-text leading-relaxed">{finding.description}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-cyber-muted uppercase tracking-wider mb-1">Remediation</p>
                            <pre className="text-[11px] text-cyber-primary bg-cyber-bg/80 rounded p-2 overflow-x-auto font-mono whitespace-pre-wrap leading-relaxed">
                              {finding.remediation}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
