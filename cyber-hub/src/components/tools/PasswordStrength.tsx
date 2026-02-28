"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Eye,
  EyeOff,
  Check,
  X,
  Shield,
  AlertTriangle,
  RefreshCw,
  Copy,
  CheckCircle,
  SlidersHorizontal,
} from "lucide-react";

/* ── Types ── */

interface StrengthCriteria {
  label: string;
  met: boolean;
  required: boolean;
}

interface StrengthResult {
  score: number;
  label: string;
  color: string;
  criteria: StrengthCriteria[];
  crackTime: string;
  suggestions: string[];
  entropy: number;
}

interface GeneratorOptions {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  special: boolean;
  excludeSimilar: boolean;
}

/* ── Character sets ── */

const CHARS = {
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  numbers: "0123456789",
  special: "!@#$%^&*()_+-=[]{}|;:,.<>?",
};

const SIMILAR_CHARS = "ilI1loO0";

/* ── Entropy-based strength analysis ── */

function analyzePassword(password: string): StrengthResult {
  const criteria: StrengthCriteria[] = [
    { label: "At least 8 characters", met: password.length >= 8, required: true },
    { label: "At least 12 characters", met: password.length >= 12, required: false },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password), required: true },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password), required: true },
    { label: "Contains number", met: /[0-9]/.test(password), required: true },
    { label: "Contains special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), required: true },
    { label: "No common patterns", met: !/(123|abc|password|qwerty|admin|letmein)/i.test(password), required: false },
    { label: "At least 16 characters", met: password.length >= 16, required: false },
  ];

  // Calculate charset size
  const charset =
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/[0-9]/.test(password) ? 10 : 0) +
    (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 32 : 0);

  // Calculate entropy: log2(charset^length)
  const entropy = charset > 0 ? password.length * Math.log2(charset) : 0;

  // Score based on entropy
  let score: number;
  if (password.length === 0) score = 0;
  else if (entropy < 28) score = 10;
  else if (entropy < 36) score = 25;
  else if (entropy < 60) score = 45;
  else if (entropy < 80) score = 65;
  else if (entropy < 100) score = 80;
  else if (entropy < 128) score = 90;
  else score = 100;

  // Penalize common patterns
  if (/(123|abc|password|qwerty|admin|letmein)/i.test(password)) {
    score = Math.max(0, score - 30);
  }

  // Determine label and color
  let label: string;
  let color: string;
  if (score <= 20) { label = "Weak"; color = "cyber-accent"; }
  else if (score <= 45) { label = "Medium"; color = "cyber-warning"; }
  else if (score <= 75) { label = "Strong"; color = "cyber-secondary"; }
  else { label = "Very Strong"; color = "cyber-primary"; }

  // Estimate crack time
  const combinations = Math.pow(charset || 1, password.length);
  const guessesPerSecond = 1e10;
  const seconds = combinations / guessesPerSecond;

  let crackTime: string;
  if (seconds < 1) crackTime = "Instantly";
  else if (seconds < 60) crackTime = `${Math.floor(seconds)} seconds`;
  else if (seconds < 3600) crackTime = `${Math.floor(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTime = `${Math.floor(seconds / 3600)} hours`;
  else if (seconds < 31536000) crackTime = `${Math.floor(seconds / 86400)} days`;
  else if (seconds < 31536000 * 1000) crackTime = `${Math.floor(seconds / 31536000)} years`;
  else if (seconds < 31536000 * 1e6) crackTime = `${Math.floor(seconds / (31536000 * 1000))}K years`;
  else if (seconds < 31536000 * 1e9) crackTime = `${Math.floor(seconds / (31536000 * 1e6))}M years`;
  else crackTime = "Centuries+";

  // Generate suggestions
  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push("Increase to 12+ characters");
  if (password.length < 16 && password.length >= 12) suggestions.push("16+ characters recommended for high-security accounts");
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters");
  if (!/[a-z]/.test(password)) suggestions.push("Add lowercase letters");
  if (!/[0-9]/.test(password)) suggestions.push("Add numbers");
  if (!/[!@#$%^&*]/.test(password)) suggestions.push("Add special characters");
  if (/(123|abc|password|qwerty)/i.test(password)) suggestions.push("Avoid common patterns");

  return { score, label, color, criteria, crackTime, suggestions, entropy };
}

/* ── Cryptographically secure password generator ── */

function generatePassword(options: GeneratorOptions): string {
  let pool = "";
  const guaranteedChars: string[] = [];

  let lower = CHARS.lowercase;
  let upper = CHARS.uppercase;
  let nums = CHARS.numbers;
  let spec = CHARS.special;

  // Remove similar characters if enabled
  if (options.excludeSimilar) {
    const filter = (s: string) => s.split("").filter((c) => !SIMILAR_CHARS.includes(c)).join("");
    lower = filter(lower);
    upper = filter(upper);
    nums = filter(nums);
    spec = filter(spec);
  }

  if (options.lowercase) { pool += lower; guaranteedChars.push(lower); }
  if (options.uppercase) { pool += upper; guaranteedChars.push(upper); }
  if (options.numbers) { pool += nums; guaranteedChars.push(nums); }
  if (options.special) { pool += spec; guaranteedChars.push(spec); }

  // Fallback: at least lowercase if nothing selected
  if (pool.length === 0) {
    pool = lower;
    guaranteedChars.push(lower);
  }

  const length = Math.max(options.length, guaranteedChars.length);

  // Use Web Crypto API for CSPRNG
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  // Build password with guaranteed chars first, then fill the rest
  const chars: string[] = [];

  // Guarantee at least one char from each enabled set
  for (let i = 0; i < guaranteedChars.length; i++) {
    const set = guaranteedChars[i];
    chars.push(set[array[i] % set.length]);
  }

  // Fill remaining positions from the full pool
  for (let i = guaranteedChars.length; i < length; i++) {
    chars.push(pool[array[i] % pool.length]);
  }

  // Shuffle the result using Fisher-Yates with crypto random
  const shuffleArray = new Uint32Array(chars.length);
  crypto.getRandomValues(shuffleArray);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = shuffleArray[i] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

/* ── Toggle switch component ── */

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex items-center justify-between p-3 bg-cyber-bg border border-cyber-border rounded-lg cursor-pointer hover:border-cyber-border/80 transition-colors group">
      <div className="min-w-0">
        <span className="text-sm text-cyber-text font-medium">{label}</span>
        {description && <p className="text-[10px] text-cyber-muted mt-0.5">{description}</p>}
      </div>
      <div className="relative flex-shrink-0 ml-3">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only"
        />
        <div
          className={`w-10 h-5 rounded-full transition-colors ${
            checked ? "bg-cyber-primary/30" : "bg-cyber-border"
          }`}
        />
        <div
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full transition-all ${
            checked ? "translate-x-5 bg-cyber-primary" : "bg-cyber-muted"
          }`}
        />
      </div>
    </label>
  );
}

/* ── Strength bar segment ── */

function StrengthBar({ score, color }: { score: number; color: string }) {
  const segments = [
    { min: 0, label: "W" },
    { min: 25, label: "M" },
    { min: 50, label: "S" },
    { min: 75, label: "VS" },
  ];

  return (
    <div className="flex gap-1">
      {segments.map((seg, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={`h-2 w-full rounded-full transition-all duration-300 ${
              score > seg.min ? `bg-${color}` : "bg-cyber-border"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

/* ── Main Component ── */

export function PasswordStrength() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<StrengthResult | null>(null);
  const [copied, setCopied] = useState(false);
  const [showGenerator, setShowGenerator] = useState(true);

  const [options, setOptions] = useState<GeneratorOptions>({
    length: 16,
    uppercase: true,
    lowercase: true,
    numbers: true,
    special: true,
    excludeSimilar: false,
  });

  useEffect(() => {
    if (password) {
      setAnalysis(analyzePassword(password));
    } else {
      setAnalysis(null);
    }
  }, [password]);

  const handleGenerate = useCallback(() => {
    const newPassword = generatePassword(options);
    setPassword(newPassword);
    setShowPassword(true);
    setCopied(false);
  }, [options]);

  const handleCopy = async () => {
    if (!password) return;
    await navigator.clipboard.writeText(password);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5">
      {/* Password Output */}
      <div>
        <label className="block text-xs text-cyber-muted mb-1.5 font-mono uppercase tracking-wider">
          Password
        </label>
        <div className="relative flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => { setPassword(e.target.value); setCopied(false); }}
              placeholder="Type, paste, or generate a password..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg pl-4 pr-20 py-3 font-mono text-sm
                       focus:border-cyber-primary focus:outline-none transition-colors"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded transition-colors ${
                  copied
                    ? "text-cyber-primary"
                    : "text-cyber-muted hover:text-cyber-text"
                }`}
                title={copied ? "Copied!" : "Copy to clipboard"}
              >
                {copied ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setShowPassword(!showPassword)}
                className="p-1.5 text-cyber-muted hover:text-cyber-text rounded transition-colors"
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            className="cyber-btn-secondary flex items-center gap-2 flex-shrink-0"
            title="Generate new password"
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden sm:inline">Generate</span>
          </button>
        </div>
        {/* Copy notification */}
        {copied && (
          <p className="text-xs text-cyber-primary font-mono mt-1.5 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" /> Copied to clipboard
          </p>
        )}
      </div>

      {/* Strength Meter */}
      {analysis && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm font-bold text-${analysis.color}`}>
                {analysis.label}
              </span>
              <span className="text-[10px] text-cyber-muted font-mono">
                {analysis.entropy.toFixed(0)} bits entropy
              </span>
            </div>
            <span className="text-xs text-cyber-muted font-mono">{analysis.score}%</span>
          </div>
          <StrengthBar score={analysis.score} color={analysis.color} />
        </div>
      )}

      {/* Crack Time */}
      {analysis && (
        <div className="flex items-center gap-3 p-3 bg-cyber-bg border border-cyber-border rounded-lg">
          <Shield className={`w-5 h-5 text-${analysis.color} flex-shrink-0`} />
          <div>
            <p className="text-xs text-cyber-muted">Estimated crack time (10B guesses/sec)</p>
            <p className={`text-sm font-mono font-bold text-${analysis.color}`}>{analysis.crackTime}</p>
          </div>
        </div>
      )}

      {/* Generator Options */}
      <div className="bg-cyber-bg border border-cyber-border rounded-lg overflow-hidden">
        <button
          onClick={() => setShowGenerator(!showGenerator)}
          className="w-full flex items-center justify-between p-3 text-sm font-semibold text-cyber-text hover:bg-cyber-border/20 transition-colors"
        >
          <span className="flex items-center gap-2">
            <SlidersHorizontal className="w-4 h-4 text-cyber-secondary" />
            Generator Options
          </span>
          <span className="text-xs text-cyber-muted font-mono">
            {options.length} chars
          </span>
        </button>

        {showGenerator && (
          <div className="p-4 pt-0 space-y-4">
            {/* Length Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs text-cyber-muted font-mono uppercase tracking-wider">
                  Length
                </label>
                <span className="text-sm font-mono font-bold text-cyber-primary">
                  {options.length}
                </span>
              </div>
              <div className="relative">
                <input
                  type="range"
                  min={8}
                  max={64}
                  value={options.length}
                  onChange={(e) => setOptions({ ...options, length: parseInt(e.target.value) })}
                  className="w-full h-2 bg-cyber-border rounded-full appearance-none cursor-pointer
                    [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                    [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyber-primary
                    [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(0,255,157,0.4)]
                    [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full
                    [&::-moz-range-thumb]:bg-cyber-primary [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                />
                <div className="flex justify-between mt-1">
                  <span className="text-[10px] text-cyber-muted font-mono">8</span>
                  <span className="text-[10px] text-cyber-muted font-mono">64</span>
                </div>
              </div>
            </div>

            {/* Character Toggles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Toggle
                checked={options.uppercase}
                onChange={(v) => setOptions({ ...options, uppercase: v })}
                label="Uppercase"
                description="A-Z"
              />
              <Toggle
                checked={options.lowercase}
                onChange={(v) => setOptions({ ...options, lowercase: v })}
                label="Lowercase"
                description="a-z"
              />
              <Toggle
                checked={options.numbers}
                onChange={(v) => setOptions({ ...options, numbers: v })}
                label="Numbers"
                description="0-9"
              />
              <Toggle
                checked={options.special}
                onChange={(v) => setOptions({ ...options, special: v })}
                label="Special"
                description="!@#$%^&*"
              />
            </div>

            {/* Exclude Similar */}
            <Toggle
              checked={options.excludeSimilar}
              onChange={(v) => setOptions({ ...options, excludeSimilar: v })}
              label="Exclude Similar Characters"
              description="Remove i, l, 1, I, L, o, 0, O to avoid confusion"
            />
          </div>
        )}
      </div>

      {/* Criteria Checklist */}
      {analysis && (
        <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4">
          <h4 className="text-sm font-semibold text-cyber-text mb-3">Password Criteria</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {analysis.criteria.map((criterion, index) => (
              <div key={index} className="flex items-center gap-2">
                {criterion.met ? (
                  <Check className="w-4 h-4 text-cyber-primary flex-shrink-0" />
                ) : (
                  <X className="w-4 h-4 text-cyber-muted flex-shrink-0" />
                )}
                <span className={`text-xs ${criterion.met ? "text-cyber-text" : "text-cyber-muted"}`}>
                  {criterion.label}
                  {criterion.required && <span className="text-cyber-accent ml-1">*</span>}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Suggestions */}
      {analysis && analysis.suggestions.length > 0 && (
        <div className="bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-cyber-warning" />
            <h4 className="text-sm font-semibold text-cyber-warning">Suggestions</h4>
          </div>
          <ul className="space-y-1">
            {analysis.suggestions.map((suggestion, index) => (
              <li key={index} className="text-xs text-cyber-text flex items-center gap-2">
                <span className="w-1 h-1 bg-cyber-warning rounded-full flex-shrink-0" />
                {suggestion}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Placeholder when empty */}
      {!password && (
        <div className="text-center py-6 text-cyber-muted">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a password to analyze its strength</p>
          <p className="text-xs mt-1">Or click &quot;Generate&quot; for a cryptographically secure password</p>
        </div>
      )}
    </div>
  );
}
