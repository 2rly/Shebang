"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, Check, X, Shield, AlertTriangle, RefreshCw } from "lucide-react";

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
}

function analyzePassword(password: string): StrengthResult {
  const criteria: StrengthCriteria[] = [
    { label: "At least 8 characters", met: password.length >= 8, required: true },
    { label: "At least 12 characters", met: password.length >= 12, required: false },
    { label: "Contains uppercase letter", met: /[A-Z]/.test(password), required: true },
    { label: "Contains lowercase letter", met: /[a-z]/.test(password), required: true },
    { label: "Contains number", met: /[0-9]/.test(password), required: true },
    { label: "Contains special character", met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), required: true },
    { label: "No common patterns", met: !/(123|abc|password|qwerty|admin)/i.test(password), required: false },
    { label: "At least 16 characters", met: password.length >= 16, required: false },
  ];

  const metRequired = criteria.filter(c => c.required && c.met).length;
  const totalRequired = criteria.filter(c => c.required).length;
  const metOptional = criteria.filter(c => !c.required && c.met).length;

  // Calculate score
  let score = 0;
  if (password.length === 0) score = 0;
  else if (metRequired < totalRequired) score = Math.floor((metRequired / totalRequired) * 40);
  else score = 40 + (metOptional * 20);

  score = Math.min(100, score);

  // Determine label and color
  let label: string;
  let color: string;
  if (score < 20) { label = "Very Weak"; color = "cyber-accent"; }
  else if (score < 40) { label = "Weak"; color = "cyber-accent"; }
  else if (score < 60) { label = "Fair"; color = "cyber-warning"; }
  else if (score < 80) { label = "Strong"; color = "cyber-secondary"; }
  else { label = "Very Strong"; color = "cyber-primary"; }

  // Estimate crack time (simplified)
  const charset =
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/[0-9]/.test(password) ? 10 : 0) +
    (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 32 : 0);

  const combinations = Math.pow(charset || 1, password.length);
  const guessesPerSecond = 1e10; // 10 billion guesses/second
  const seconds = combinations / guessesPerSecond;

  let crackTime: string;
  if (seconds < 1) crackTime = "Instantly";
  else if (seconds < 60) crackTime = `${Math.floor(seconds)} seconds`;
  else if (seconds < 3600) crackTime = `${Math.floor(seconds / 60)} minutes`;
  else if (seconds < 86400) crackTime = `${Math.floor(seconds / 3600)} hours`;
  else if (seconds < 31536000) crackTime = `${Math.floor(seconds / 86400)} days`;
  else if (seconds < 31536000 * 100) crackTime = `${Math.floor(seconds / 31536000)} years`;
  else crackTime = "Centuries";

  // Generate suggestions
  const suggestions: string[] = [];
  if (password.length < 12) suggestions.push("Make it longer (12+ characters)");
  if (!/[A-Z]/.test(password)) suggestions.push("Add uppercase letters");
  if (!/[0-9]/.test(password)) suggestions.push("Add numbers");
  if (!/[!@#$%^&*]/.test(password)) suggestions.push("Add special characters (!@#$%^&*)");
  if (/(123|abc|password|qwerty)/i.test(password)) suggestions.push("Avoid common patterns");

  return { score, label, color, criteria, crackTime, suggestions };
}

function generatePassword(length: number = 16): string {
  const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
  let password = "";
  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  for (let i = 0; i < length; i++) {
    password += chars[array[i] % chars.length];
  }
  return password;
}

export function PasswordStrength() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [analysis, setAnalysis] = useState<StrengthResult | null>(null);

  useEffect(() => {
    if (password) {
      setAnalysis(analyzePassword(password));
    } else {
      setAnalysis(null);
    }
  }, [password]);

  const handleGenerate = () => {
    const newPassword = generatePassword(16);
    setPassword(newPassword);
    setShowPassword(true);
  };

  return (
    <div className="space-y-4">
      {/* Input */}
      <div>
        <label className="block text-xs text-cyber-muted mb-1 font-mono">ENTER PASSWORD</label>
        <div className="relative flex gap-2">
          <div className="flex-1 relative">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type or paste a password to analyze..."
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg pl-4 pr-10 py-2.5 font-mono text-sm
                       focus:border-cyber-primary focus:outline-none"
            />
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-cyber-text"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <button onClick={handleGenerate} className="cyber-btn-secondary flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Generate
          </button>
        </div>
      </div>

      {/* Strength Meter */}
      {analysis && (
        <>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold text-${analysis.color}`}>
                {analysis.label}
              </span>
              <span className="text-xs text-cyber-muted font-mono">{analysis.score}%</span>
            </div>
            <div className="h-2 bg-cyber-bg rounded-full overflow-hidden">
              <div
                className={`h-full bg-${analysis.color} transition-all duration-300`}
                style={{ width: `${analysis.score}%` }}
              />
            </div>
          </div>

          {/* Crack Time */}
          <div className="flex items-center gap-3 p-3 bg-cyber-bg border border-cyber-border rounded-lg">
            <Shield className={`w-5 h-5 text-${analysis.color}`} />
            <div>
              <p className="text-xs text-cyber-muted">Estimated crack time (10B guesses/sec)</p>
              <p className={`text-sm font-mono text-${analysis.color}`}>{analysis.crackTime}</p>
            </div>
          </div>

          {/* Criteria Checklist */}
          <div className="bg-cyber-bg border border-cyber-border rounded-lg p-4">
            <h4 className="text-sm font-semibold text-cyber-text mb-3">Password Criteria</h4>
            <div className="grid grid-cols-2 gap-2">
              {analysis.criteria.map((criterion, index) => (
                <div key={index} className="flex items-center gap-2">
                  {criterion.met ? (
                    <Check className="w-4 h-4 text-cyber-primary" />
                  ) : (
                    <X className="w-4 h-4 text-cyber-muted" />
                  )}
                  <span className={`text-xs ${criterion.met ? "text-cyber-text" : "text-cyber-muted"}`}>
                    {criterion.label}
                    {criterion.required && <span className="text-cyber-accent ml-1">*</span>}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Suggestions */}
          {analysis.suggestions.length > 0 && (
            <div className="bg-cyber-warning/10 border border-cyber-warning/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-cyber-warning" />
                <h4 className="text-sm font-semibold text-cyber-warning">Suggestions</h4>
              </div>
              <ul className="space-y-1">
                {analysis.suggestions.map((suggestion, index) => (
                  <li key={index} className="text-xs text-cyber-text flex items-center gap-2">
                    <span className="w-1 h-1 bg-cyber-warning rounded-full" />
                    {suggestion}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}

      {/* Placeholder */}
      {!password && (
        <div className="text-center py-8 text-cyber-muted">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Enter a password to analyze its strength</p>
          <p className="text-xs mt-1">Or click "Generate" for a secure random password</p>
        </div>
      )}
    </div>
  );
}
